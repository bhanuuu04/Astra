"""Finding ingestion and triage API endpoints with evidence sealing."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.session import get_session
from app.domain.finding_service import (
    get_finding_with_signals,
    ingest_finding,
    list_findings,
    update_finding_triage,
)
from app.schemas.finding import (
    FindingIngest,
    FindingIngestResponse,
    FindingListResponse,
    FindingResponse,
    FindingTriageSignal,
    FindingTriageUpdate,
)

router = APIRouter(prefix="/api/v1/findings", tags=["findings"])


@router.post("/ingest", response_model=FindingIngestResponse, status_code=status.HTTP_201_CREATED)
def handle_ingest_finding(
    finding_data: FindingIngest,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> FindingIngestResponse:
    """Ingest a single finding with idempotency, SHA-256 evidence sealing, and triage scoring.
    
    **Features:**
    - Idempotent ingestion based on tenant_id + surface + external_id
    - Cryptographic SHA-256 evidence sealing before parsing
    - Explainable triage priority with feature breakdown
    - Automatic data_mode tracking (live, synthetic_demo, manual_upload)
    
    **Request Headers:**
    - X-Idempotency-Key: Optional idempotency key for batch operations
    
    **Returns:**
    - finding_id: UUID of created/existing finding
    - triage_priority: 0.0-1.0 priority score
    - signals: List of detection signals with explanations
    - data_mode: Echo of data source mode
    """
    try:
        return ingest_finding(session, context.tenant_id, finding_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=FindingListResponse)
def handle_list_findings(
    brand_id: Optional[uuid.UUID] = Query(None, description="Filter by brand"),
    surface: Optional[str] = Query(None, description="Filter by surface (instagram, x, google_play, etc.)"),
    triage_status: Optional[str] = Query(None, description="Filter by status (pending, confirmed_threat, false_positive)"),
    min_priority: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum triage priority"),
    data_mode: Optional[str] = Query(None, description="Filter by data mode (live, synthetic_demo, manual_upload)"),
    limit: int = Query(50, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Page offset"),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> FindingListResponse:
    """List findings with filtering, pagination, and data mode indicators.
    
    **Query Parameters:**
    - All filters are optional
    - Results ordered by: triage_priority DESC, observed_at DESC
    - data_mode field clearly indicates: LIVE | SYNTHETIC_DEMO | MANUAL_UPLOAD
    
    **Returns:**
    - Paginated list with total count
    - Each finding includes triage_status and triage_priority
    - Data mode badge for transparency
    """
    findings, total = list_findings(
        session=session,
        tenant_id=context.tenant_id,
        brand_id=brand_id,
        surface=surface,
        triage_status=triage_status,
        min_priority=min_priority,
        data_mode=data_mode,
        limit=limit,
        offset=offset
    )
    
    finding_responses = [FindingResponse.model_validate(f) for f in findings]
    
    return FindingListResponse(
        findings=finding_responses,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{finding_id}", response_model=FindingResponse)
def handle_get_finding(
    finding_id: uuid.UUID,
    include_signals: bool = Query(False, description="Include detection signal breakdown"),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> FindingResponse:
    """Get single finding with optional signal breakdown.
    
    **Path Parameters:**
    - finding_id: Finding UUID
    
    **Query Parameters:**
    - include_signals: Include explainable detection signals
    
    **Returns:**
    - Complete finding detail
    - Optional signals with feature values and explanations
    - Enforces tenant isolation (404 for foreign findings)
    """
    result = get_finding_with_signals(session, context.tenant_id, finding_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding {finding_id} not found"
        )
    
    finding, signals = result
    
    response = FindingResponse.model_validate(finding)
    
    if include_signals:
        response.signals = [
            FindingTriageSignal(
                detector_key=s.detector_key,
                detector_version=s.detector_version,
                score=s.score,
                explanation=s.explanation,
                feature_values=s.feature_values
            )
            for s in signals
        ]
    
    return response


@router.patch("/{finding_id}/triage", response_model=FindingResponse)
def handle_update_finding_triage(
    finding_id: uuid.UUID,
    update: FindingTriageUpdate,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> FindingResponse:
    """Update finding triage status with audit logging.
    
    **Human-Governed Triage Workflow:**
    - Analyst reviews finding and signals
    - Updates status with rationale (minimum 10 characters)
    - Optionally assigns to analyst
    - Optionally escalates to campaign cluster
    
    **Valid Status Values:**
    - pending: Awaiting review
    - investigating: Under active investigation
    - confirmed_threat: Verified malicious/unauthorized
    - false_positive: Benign, no action needed
    - needs_evidence: Requires additional evidence
    
    **Audit Trail:**
    - All status changes logged in finding.normalized_attributes.triage_history
    - Includes timestamp, old/new status, rationale, analyst ID
    - Immutable audit log entry created (see POST /api/v1/audit-logs)
    
    **Returns:**
    - Updated finding with new status
    - Enforces tenant isolation
    """
    try:
        finding = update_finding_triage(
            session=session,
            tenant_id=context.tenant_id,
            finding_id=finding_id,
            triage_status=update.triage_status,
            rationale=update.rationale,
            actor_id=context.user_id,
            analyst_id=update.assigned_analyst_id
        )
        
        # TODO: If escalate_to_campaign=True, create/link campaign cluster
        
        return FindingResponse.model_validate(finding)
        
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
