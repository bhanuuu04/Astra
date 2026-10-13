"""Tenant notices and platform-level brand ownership adjudication."""
from datetime import datetime, timezone
import uuid
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_platform_admin
from app.db.models import Brand, BrandClaim, BrandClaimDocument, GovernanceNotice
from app.db.session import get_session
from app.domain.brand_governance_service import adjudicate_brand_claim, mark_notice_read, read_kyb_document
from app.api.routes.brands import _ensure_passive_ct_monitor

router = APIRouter(prefix="/api/v1/governance", tags=["brand governance"])


class ClaimDecision(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    notes: str = Field(..., min_length=10, max_length=2000)


@router.get("/notices")
def list_governance_notices(
    unread_only: bool = False,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
):
    query = select(GovernanceNotice).where(GovernanceNotice.tenant_id == context.tenant_id)
    if unread_only:
        query = query.where(GovernanceNotice.read_at.is_(None))
    notices = session.scalars(query.order_by(GovernanceNotice.created_at.desc()).limit(100)).all()
    return [{
        "id": str(item.id), "claim_id": str(item.claim_id) if item.claim_id else None,
        "type": item.notice_type, "title": item.title, "message": item.message,
        "read_at": item.read_at, "created_at": item.created_at,
    } for item in notices]


@router.post("/notices/{notice_id}/read")
def read_governance_notice(
    notice_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
):
    notice = session.scalar(select(GovernanceNotice).where(
        GovernanceNotice.id == notice_id,
        GovernanceNotice.tenant_id == context.tenant_id,
    ))
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found")
    mark_notice_read(session, notice)
    return {"id": str(notice.id), "read_at": notice.read_at}


@router.get("/claims")
def list_claims_for_platform_review(
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_platform_admin),
):
    claims = session.scalars(select(BrandClaim).where(
        BrandClaim.status.in_(("pending_review", "pending_documents", "disputed")),
    ).order_by(BrandClaim.created_at.asc())).all()
    result = []
    for claim in claims:
        brand = session.get(Brand, claim.brand_id)
        documents = session.scalars(select(BrandClaimDocument).where(BrandClaimDocument.claim_id == claim.id)).all()
        result.append({
            "id": str(claim.id), "tenant_id": str(claim.tenant_id), "brand_id": str(claim.brand_id),
            "brand_name": brand.name if brand else "Deleted brand", "official_domain": claim.official_domain,
            "applicant_email": claim.applicant_email, "email_domain_match": claim.email_domain_match,
            "legal_entity_name": claim.legal_entity_name, "status": claim.status,
            "incumbent_brand_id": str(claim.incumbent_brand_id) if claim.incumbent_brand_id else None,
            "created_at": claim.created_at,
            "documents": [{
                "id": str(doc.id), "document_type": doc.document_type,
                "original_filename": doc.original_filename, "content_type": doc.content_type,
                "sha256": doc.sha256, "review_status": doc.review_status, "created_at": doc.created_at,
            } for doc in documents],
        })
    return result


@router.get("/claims/{claim_id}/documents/{document_id}")
def download_claim_document(
    claim_id: uuid.UUID,
    document_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_platform_admin),
):
    document = session.scalar(select(BrandClaimDocument).where(
        BrandClaimDocument.id == document_id,
        BrandClaimDocument.claim_id == claim_id,
    ))
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Legal document not found")
    try:
        content = read_kyb_document(document.object_key)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored legal document could not be read") from exc
    filename = quote(document.original_filename)
    return Response(
        content=content,
        media_type=document.content_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}", "X-Content-Type-Options": "nosniff"},
    )


@router.post("/claims/{claim_id}/decision")
def decide_claim(
    claim_id: uuid.UUID,
    decision: ClaimDecision,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_platform_admin),
):
    claim = session.get(BrandClaim, claim_id)
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ownership claim not found")
    if claim.status in {"approved", "rejected"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This ownership claim has already been decided")
    try:
        adjudicate_brand_claim(
            session, claim, decision.action, context.user_id or uuid.uuid4(), decision.notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if decision.action == "approve":
        _ensure_passive_ct_monitor(session, claim.tenant_id, context.user_id or uuid.uuid4())
    return {"claim_id": str(claim.id), "status": claim.status, "reviewed_at": claim.reviewed_at}

