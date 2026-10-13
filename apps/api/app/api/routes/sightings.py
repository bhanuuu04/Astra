from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.models import EvidenceObject, Sighting
from app.db.session import get_session
from app.domain.sighting_service import (
    dismiss_sighting,
    ingest_batch,
    list_sightings,
    reopen_sighting,
    takedown_sighting,
    whitelist_sighting,
)
from app.schemas.sighting import (
    EvidenceDetailResponse,
    SightingActionResponse,
    SightingBatchRequest,
    SightingBatchResponse,
    SightingDismissRequest,
    SightingResponse,
    SightingTakedownRequest,
    SightingWhitelistRequest,
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


@router.post("/{sighting_id}/whitelist", response_model=SightingActionResponse)
def handle_whitelist_sighting(
    sighting_id: uuid.UUID,
    req: SightingWhitelistRequest = SightingWhitelistRequest(),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> SightingActionResponse:
    """Claim target as a legitimate brand asset and whitelist from future threat scans."""
    try:
        sighting = whitelist_sighting(
            session=session,
            sighting_id=sighting_id,
            tenant_id=context.tenant_id,
            actor=context.actor,
            reason=req.reason or "",
        )
        return SightingActionResponse(
            success=True,
            sighting=SightingResponse.model_validate(sighting),
            message="Target successfully whitelisted and added to verified brand perimeter.",
            triage_status="whitelisted",
            is_benign=True,
            sighting_id=str(sighting.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{sighting_id}/dismiss", response_model=SightingActionResponse)
def handle_dismiss_sighting(
    sighting_id: uuid.UUID,
    req: SightingDismissRequest = SightingDismissRequest(),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> SightingActionResponse:
    """Dismiss threat finding as false positive or benign non-infringing entity."""
    try:
        sighting = dismiss_sighting(
            session=session,
            sighting_id=sighting_id,
            tenant_id=context.tenant_id,
            actor=context.actor,
            reason=req.reason or "",
        )
        return SightingActionResponse(
            success=True,
            sighting=SightingResponse.model_validate(sighting),
            message="Finding dismissed as false positive.",
            triage_status="dismissed",
            is_benign=False,
            sighting_id=str(sighting.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{sighting_id}/takedown")
def handle_takedown_sighting(
    sighting_id: uuid.UUID,
    req: SightingTakedownRequest = SightingTakedownRequest(),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> dict:
    """Initiate a formal takedown request or abuse report against this impersonator."""
    try:
        result = takedown_sighting(
            session=session,
            sighting_id=sighting_id,
            tenant_id=context.tenant_id,
            actor=context.actor,
            user_id=context.user_id,
            target_provider=req.target_provider,
            notes=req.notes or "",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{sighting_id}/reopen", response_model=SightingActionResponse)
def handle_reopen_sighting(
    sighting_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> SightingActionResponse:
    """Reopen a previously whitelisted or dismissed sighting back to active investigation."""
    try:
        sighting = reopen_sighting(
            session=session,
            sighting_id=sighting_id,
            tenant_id=context.tenant_id,
            actor=context.actor,
        )
        return SightingActionResponse(
            success=True,
            sighting=SightingResponse.model_validate(sighting),
            message="Finding reopened for active investigation.",
            triage_status="active",
            is_benign=False,
            sighting_id=str(sighting.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

