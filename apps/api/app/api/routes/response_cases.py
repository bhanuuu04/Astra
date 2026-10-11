"""Response case API endpoints for human-governed takedown workflow."""
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.session import get_session
from app.domain.response_case_service import (
    approve_response_case,
    create_response_case_draft,
    dispatch_response_case,
    get_response_case,
    list_response_cases,
    resolve_response_case,
)
from app.schemas.response_case import (
    ResponseCaseApprove,
    ResponseCaseDraft,
    ResponseCaseDispatch,
    ResponseCaseListResponse,
    ResponseCaseResolve,
    ResponseCaseResponse,
)

router = APIRouter(prefix="/api/v1/responses", tags=["responses"])


def _to_response_case_response(case) -> ResponseCaseResponse:
    """Map ResponseCase model to schema with payload-derived fields."""
    payload = case.submission_payload or {}
    case_type = payload.get("case_type", "infringement_takedown")
    draft_recipient = payload.get("draft_recipient")
    draft_subject = payload.get("draft_subject")
    draft_body = payload.get("draft_body")
    evidence_manifest_raw = payload.get("evidence_manifest") or []
    evidence_manifest = []
    for em in evidence_manifest_raw:
        try:
            evidence_manifest.append(uuid.UUID(str(em)))
        except (ValueError, TypeError):
            pass

    return ResponseCaseResponse(
        id=case.id,
        tenant_id=case.tenant_id,
        finding_id=case.finding_id,
        cluster_id=case.cluster_id,
        target_provider=case.target_provider,
        case_type=case_type,
        draft_recipient=draft_recipient,
        draft_subject=draft_subject,
        draft_body=draft_body,
        lifecycle_state=case.lifecycle_state,
        drafted_by=case.drafted_by,
        approved_by=case.approved_by,
        approved_at=case.approved_at,
        submission_channel=case.submission_channel,
        external_case_reference=case.external_case_reference,
        evidence_manifest_hash=case.evidence_manifest_hash,
        evidence_manifest=evidence_manifest,
        submission_payload=payload,
        submitted_at=case.submitted_at,
        resolved_at=case.resolved_at,
        resolution_notes=case.resolution_notes,
        created_at=case.created_at,
    )


@router.post("/draft", response_model=ResponseCaseResponse, status_code=status.HTTP_201_CREATED)
def handle_create_response_draft(
    draft: ResponseCaseDraft,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ResponseCaseResponse:
    """Create draft response case for takedown submission.
    
    **Human-Governed Takedown Workflow:**
    - Analyst drafts response with evidence bundle
    - Reviewer/Lead approves before dispatch
    - System generates tamper-evident evidence manifest
    - Audit trail records all state transitions
    
    **State Machine:**
    draft → pending_approval → approved → submitted → acknowledged → resolved/rejected
    
    **Target Providers:**
    - meta_takedown: Meta/Instagram IP Reporting
    - google_abuse: Google Play Store Abuse
    - cloudflare_abuse: Cloudflare Abuse Reporting
    - registrar_dmca: Domain Registrar DMCA
    
    **Request Body:**
    - finding_id: Finding to respond to
    - cluster_id: Optional campaign cluster linkage
    - target_provider: Destination for takedown
    - submission_payload: Provider-specific request body
    - evidence_manifest: List of evidence object IDs to bundle
    
    **Returns:**
    - Created response case in 'draft' state
    - evidence_manifest_hash: SHA-256 seal for tamper detection
    - Initial state: 'draft'
    """
    try:
        payload = dict(draft.submission_payload or {})
        if draft.case_type:
            payload["case_type"] = draft.case_type
        if draft.draft_recipient:
            payload["draft_recipient"] = draft.draft_recipient
        if draft.draft_subject:
            payload["draft_subject"] = draft.draft_subject
        if draft.draft_body:
            payload["draft_body"] = draft.draft_body

        response_case = create_response_case_draft(
            session=session,
            tenant_id=context.tenant_id,
            finding_id=draft.finding_id,
            cluster_id=draft.cluster_id,
            target_provider=draft.target_provider,
            submission_payload=payload,
            evidence_manifest=draft.evidence_manifest or [],
            drafted_by=context.user_id  # From auth context
        )
        
        return _to_response_case_response(response_case)
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=ResponseCaseListResponse)
def handle_list_response_cases(
    lifecycle_state: Optional[str] = Query(None, description="Filter by state: draft, approved, submitted, resolved"),
    target_provider: Optional[str] = Query(None, description="Filter by provider"),
    drafted_by: Optional[uuid.UUID] = Query(None, description="Filter by drafter"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> ResponseCaseListResponse:
    """List response cases with filtering and pagination.
    
    **Query Parameters:**
    - All filters optional
    - Results ordered by created_at DESC
    
    **Returns:**
    - Paginated list of response cases
    - Each case includes complete workflow state
    - Enforces tenant isolation
    """
    cases, total = list_response_cases(
        session=session,
        tenant_id=context.tenant_id,
        lifecycle_state=lifecycle_state,
        target_provider=target_provider,
        drafted_by=drafted_by,
        limit=limit,
        offset=offset
    )
    
    case_responses = [_to_response_case_response(c) for c in cases]
    
    return ResponseCaseListResponse(
        cases=case_responses,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{response_case_id}", response_model=ResponseCaseResponse)
def handle_get_response_case(
    response_case_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> ResponseCaseResponse:
    """Get single response case detail.
    
    **Returns:**
    - Complete response case with workflow state
    - Evidence manifest hash for verification
    - Submission payload and provider details
    - Enforces tenant isolation (404 for foreign cases)
    """
    response_case = get_response_case(session, context.tenant_id, response_case_id)
    
    if not response_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response case {response_case_id} not found"
        )
    
    return _to_response_case_response(response_case)


@router.post("/{response_case_id}/approve", response_model=ResponseCaseResponse)
def handle_approve_response_case(
    response_case_id: uuid.UUID,
    approval: ResponseCaseApprove,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ResponseCaseResponse:
    """Approve response case for dispatch (Reviewer/Lead only).
    
    **Authorization:**
    - Restricted to 'reviewer' or 'org_admin' roles
    - Optionally enforces separation of duties (drafter ≠ approver)
    
    **State Transition:**
    draft → approved
    
    **Audit Trail:**
    - Records approver ID and timestamp
    - Logs approval in audit_logs table
    - Optional approval notes stored in payload
    
    **Request Body:**
    - approval_notes: Optional notes from reviewer
    
    **Returns:**
    - Updated response case in 'approved' state
    - approved_by and approved_at timestamps populated
    """
    try:
        response_case = approve_response_case(
            session=session,
            tenant_id=context.tenant_id,
            response_case_id=response_case_id,
            approved_by=context.user_id,
            approval_notes=approval.approval_notes
        )
        
        return _to_response_case_response(response_case)
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{response_case_id}/dispatch", response_model=ResponseCaseResponse)
def handle_dispatch_response_case(
    response_case_id: uuid.UUID,
    dispatch: ResponseCaseDispatch,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ResponseCaseResponse:
    """Dispatch approved response case to external provider.
    
    **Submission Channels:**
    - manual_portal: Analyst manually submits via provider web portal
    - api_automated: Automatic submission via provider API
    - email_legal: Email-based legal notice (registrar DMCA, etc.)
    
    **State Transition:**
    approved → submitted
    
    **Provider Integration:**
    - TODO: Integrate with Meta IP Reporting API
    - TODO: Integrate with Google Play Developer API
    - TODO: Integrate with Cloudflare Abuse API
    - TODO: Generate signed legal PDF for registrar DMCA
    
    **Request Body:**
    - submission_channel: Channel for submission
    
    **Returns:**
    - Updated response case in 'submitted' state
    - submitted_at timestamp populated
    """
    try:
        response_case = dispatch_response_case(
            session=session,
            tenant_id=context.tenant_id,
            response_case_id=response_case_id,
            submission_channel=dispatch.submission_channel
        )
        
        return _to_response_case_response(response_case)
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{response_case_id}/resolve", response_model=ResponseCaseResponse)
def handle_resolve_response_case(
    response_case_id: uuid.UUID,
    resolution: ResponseCaseResolve,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ResponseCaseResponse:
    """Mark response case as resolved with outcome.
    
    **State Transition:**
    submitted | acknowledged → resolved
    
    **Resolution Tracking:**
    - Records outcome notes (takedown success, provider rejection, etc.)
    - Optional external case reference (provider ticket ID)
    - Resolved timestamp for SLA tracking
    
    **Request Body:**
    - resolution_notes: Detailed outcome (minimum 10 characters)
    - external_case_reference: Provider case/ticket ID (optional)
    
    **Returns:**
    - Updated response case in 'resolved' state
    - resolved_at timestamp and notes populated
    """
    try:
        response_case = resolve_response_case(
            session=session,
            tenant_id=context.tenant_id,
            response_case_id=response_case_id,
            resolution_notes=resolution.resolution_notes,
            external_case_reference=resolution.external_case_reference
        )
        
        return _to_response_case_response(response_case)
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
