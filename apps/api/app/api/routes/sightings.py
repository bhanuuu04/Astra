from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.models import EvidenceObject, Sighting
from app.db.session import get_session
from app.domain.sighting_service import ingest_batch, list_sightings
from app.schemas.sighting import (
    EvidenceDetailResponse,
    SightingBatchRequest,
    SightingBatchResponse,
    SightingResponse,
)
from app.storage.evidence_storage import load_evidence_content, verify_evidence_integrity

router = APIRouter(prefix="/api/v1/sightings", tags=["sightings"])


@router.post(":batch", response_model=SightingBatchResponse, status_code=status.HTTP_201_CREATED)
def handle_batch_ingest(
    batch: SightingBatchRequest,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> SightingBatchResponse:
    # Server-verified tenant context enforcement
    batch.tenant_id = context.tenant_id
    try:
        return ingest_batch(session, batch)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("", response_model=List[SightingResponse])
def handle_list_sightings(
    brand_id: Optional[uuid.UUID] = Query(None, description="Filter by brand"),
    surface: Optional[str] = Query(None, description="Filter by surface"),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> List[SightingResponse]:
    sightings = list_sightings(
        session,
        tenant_id=context.tenant_id,
        brand_id=brand_id,
        surface=surface,
        limit=limit,
    )
    return [SightingResponse.model_validate(s) for s in sightings]


@router.get("/{sighting_id}/evidence", response_model=List[EvidenceDetailResponse])
def handle_get_sighting_evidence(
    sighting_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> List[EvidenceDetailResponse]:
    """Retrieve evidence objects for a sighting with cryptographic integrity verification."""
    sighting = session.scalar(
        select(Sighting).where(Sighting.id == sighting_id, Sighting.tenant_id == context.tenant_id)
    )
    if not sighting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sighting not found")

    evidence_records = list(
        session.scalars(select(EvidenceObject).where(EvidenceObject.sighting_id == sighting_id)).all()
    )

    results = []
    for ev in evidence_records:
        is_valid, _ = verify_evidence_integrity(ev.object_key, ev.sha256)
        raw_bytes = load_evidence_content(ev.object_key)
        content_str = raw_bytes.decode("utf-8", errors="replace") if raw_bytes else None

        results.append(
            EvidenceDetailResponse(
                id=ev.id,
                sighting_id=ev.sighting_id,
                object_key=ev.object_key,
                media_type=ev.media_type,
                sha256=ev.sha256,
                captured_at=ev.captured_at,
                source_ref=ev.source_ref,
                verified_integrity=is_valid,
                content=content_str,
            )
        )
    return results
