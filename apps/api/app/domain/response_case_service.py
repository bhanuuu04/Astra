"""Response case service for human-governed takedown workflow."""
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import (
    Finding,
    CampaignCluster,
    ResponseCase,
    EvidenceObject,
)
from app.domain.audit_service import log_audit_event, sanitize_state_for_audit


def generate_evidence_manifest_hash(evidence_ids: List[uuid.UUID]) -> str:
    """Generate SHA-256 hash of evidence manifest for tamper detection.
    
    Args:
        evidence_ids: List of evidence object IDs
        
    Returns:
        SHA-256 hash of sorted evidence IDs
    """
    sorted_ids = sorted(str(eid) for eid in evidence_ids)
    manifest_str = json.dumps(sorted_ids, sort_keys=True)
    return hashlib.sha256(manifest_str.encode('utf-8')).hexdigest()


def create_response_case_draft(
    session: Session,
    tenant_id: uuid.UUID,
    finding_id: uuid.UUID,
    cluster_id: Optional[uuid.UUID],
    target_provider: str,
    submission_payload: dict,
    evidence_manifest: List[uuid.UUID],
    drafted_by: uuid.UUID
) -> ResponseCase:
    """Create draft response case for takedown.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        finding_id: Finding to respond to
        cluster_id: Optional campaign cluster
        target_provider: Provider (meta_takedown, google_abuse, etc.)
        submission_payload: Provider-specific payload
        evidence_manifest: List of evidence object IDs
        drafted_by: User ID creating draft
        
    Returns:
        Created ResponseCase
        
    Raises:
        ValueError: If finding not found or invalid
    """
    # Verify finding exists and belongs to tenant
    finding = session.scalar(
        select(Finding).where(
            Finding.id == finding_id,
            Finding.tenant_id == tenant_id
        )
    )
    
    if not finding:
        raise ValueError(f"Finding {finding_id} not found for tenant {tenant_id}")
    
    # Verify cluster if provided
    if cluster_id:
        cluster = session.scalar(
            select(CampaignCluster).where(
                CampaignCluster.id == cluster_id,
                CampaignCluster.tenant_id == tenant_id
            )
        )
        if not cluster:
            raise ValueError(f"Cluster {cluster_id} not found for tenant {tenant_id}")
    
    # Verify evidence manifest IDs if specified
    if evidence_manifest:
        existing_evidence = list(session.scalars(
            select(EvidenceObject.id).where(
                EvidenceObject.id.in_(evidence_manifest),
                EvidenceObject.finding_id == finding_id,
            )
        ).all())
        if len(existing_evidence) != len(set(evidence_manifest)):
            raise ValueError("Every response-case evidence item must be attached to the finding being reported.")
    
    # Retain evidence manifest in submission payload
    if not isinstance(submission_payload, dict):
        submission_payload = {}
    submission_payload["evidence_manifest"] = [str(eid) for eid in evidence_manifest]

    # Generate evidence manifest hash
    manifest_hash = generate_evidence_manifest_hash(evidence_manifest)
    
    # Create response case
    response_case = ResponseCase(
        tenant_id=tenant_id,
        finding_id=finding_id,
        cluster_id=cluster_id,
        target_provider=target_provider,
        lifecycle_state="draft",
        drafted_by=drafted_by,
        submission_channel="manual_portal",
        evidence_manifest_hash=manifest_hash,
        submission_payload=submission_payload
    )
    
    session.add(response_case)
    session.commit()
    
    return response_case


def approve_response_case(
    session: Session,
    tenant_id: uuid.UUID,
    response_case_id: uuid.UUID,
    approved_by: uuid.UUID,
    approver_role: str,
    approval_notes: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> ResponseCase:
    """Approve response case for dispatch.
    
    **Separation of Duties:**
    - Optionally enforce that drafter cannot approve their own case
    - Requires reviewer or org_admin role
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        response_case_id: Response case to approve
        approved_by: User ID approving
        approver_role: Tenant role of the approving user
        approval_notes: Optional approval notes
        ip_address: Client IP for audit
        user_agent: Client user agent for audit
        
    Returns:
        Approved ResponseCase
        
    Raises:
        ValueError: If case not found, wrong state, or separation of duties violation
    """
    if approver_role not in ("reviewer", "org_admin"):
        raise ValueError("Only reviewers or organization administrators can approve response cases")

    response_case = session.scalar(
        select(ResponseCase).where(
            ResponseCase.id == response_case_id,
            ResponseCase.tenant_id == tenant_id
        )
    )
    
    if not response_case:
        raise ValueError(f"Response case {response_case_id} not found")
    
    if response_case.lifecycle_state != "draft":
        raise ValueError(f"Cannot approve case in state: {response_case.lifecycle_state}")
    
    # Capture before state
    before_state = sanitize_state_for_audit(response_case)
    
    # Separation of duties verification
    settings = get_settings()
    if settings.app_env not in ("development", "test") and response_case.drafted_by == approved_by:
        raise ValueError("Separation of duties violation: Drafter cannot approve their own response case")
    
    response_case.lifecycle_state = "approved"
    response_case.approved_by = approved_by
    response_case.approved_at = datetime.now(timezone.utc)
    
    if approval_notes:
        if not response_case.submission_payload:
            response_case.submission_payload = {}
        response_case.submission_payload['approval_notes'] = approval_notes
    
    session.flush()
    
    # Log audit event
    after_state = sanitize_state_for_audit(response_case)
    log_audit_event(
        session=session,
        tenant_id=tenant_id,
        actor_id=approved_by,
        action="takedown_approved",
        entity_type="response_case",
        entity_id=response_case.id,
        before_state=before_state,
        after_state=after_state,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    session.commit()
    
    return response_case


def dispatch_response_case(
    session: Session,
    tenant_id: uuid.UUID,
    response_case_id: uuid.UUID,
    submission_channel: str = "manual_portal"
) -> ResponseCase:
    """Dispatch approved response case to external provider.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        response_case_id: Response case to dispatch
        submission_channel: Channel (manual_portal, api_automated, email_legal)
        
    Returns:
        Dispatched ResponseCase
        
    Raises:
        ValueError: If case not found or not approved
    """
    response_case = session.scalar(
        select(ResponseCase).where(
            ResponseCase.id == response_case_id,
            ResponseCase.tenant_id == tenant_id
        )
    )
    
    if not response_case:
        raise ValueError(f"Response case {response_case_id} not found")
    
    if response_case.lifecycle_state != "approved":
        raise ValueError(f"Cannot dispatch case in state: {response_case.lifecycle_state}")

    if submission_channel != "manual_portal":
        raise ValueError(
            "Automated API and email submission are not configured. Submit through the provider's official portal, then record it using manual_portal."
        )
    
    response_case.lifecycle_state = "submitted"
    response_case.submission_channel = submission_channel
    response_case.submitted_at = datetime.now(timezone.utc)
    
    # This records an analyst-confirmed manual submission; ASTRA does not send it.
    if not response_case.submission_payload:
        response_case.submission_payload = {}
    response_case.submission_payload["dispatched_channel"] = submission_channel
    response_case.submission_payload["dispatched_timestamp"] = response_case.submitted_at.isoformat()
    
    session.commit()
    
    return response_case


def resolve_response_case(
    session: Session,
    tenant_id: uuid.UUID,
    response_case_id: uuid.UUID,
    resolution_notes: str,
    external_case_reference: Optional[str] = None
) -> ResponseCase:
    """Mark response case as resolved with outcome.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        response_case_id: Response case to resolve
        resolution_notes: Outcome details
        external_case_reference: Provider case/ticket ID
        
    Returns:
        Resolved ResponseCase
        
    Raises:
        ValueError: If case not found or invalid state
    """
    response_case = session.scalar(
        select(ResponseCase).where(
            ResponseCase.id == response_case_id,
            ResponseCase.tenant_id == tenant_id
        )
    )
    
    if not response_case:
        raise ValueError(f"Response case {response_case_id} not found")
    
    if response_case.lifecycle_state not in ("submitted", "acknowledged"):
        raise ValueError(f"Cannot resolve case in state: {response_case.lifecycle_state}")
    
    response_case.lifecycle_state = "resolved"
    response_case.resolved_at = datetime.now(timezone.utc)
    response_case.resolution_notes = resolution_notes
    
    if external_case_reference:
        response_case.external_case_reference = external_case_reference
    
    session.commit()
    
    return response_case


def list_response_cases(
    session: Session,
    tenant_id: uuid.UUID,
    lifecycle_state: Optional[str] = None,
    target_provider: Optional[str] = None,
    drafted_by: Optional[uuid.UUID] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[ResponseCase], int]:
    """List response cases with filters.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        lifecycle_state: Optional state filter
        target_provider: Optional provider filter
        drafted_by: Optional drafter filter
        limit: Page size
        offset: Page offset
        
    Returns:
        Tuple of (cases list, total count)
    """
    query = select(ResponseCase).where(ResponseCase.tenant_id == tenant_id)
    
    if lifecycle_state:
        query = query.where(ResponseCase.lifecycle_state == lifecycle_state)
    if target_provider:
        query = query.where(ResponseCase.target_provider == target_provider)
    if drafted_by:
        query = query.where(ResponseCase.drafted_by == drafted_by)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = session.scalar(count_query) or 0
    
    # Apply pagination and ordering
    query = query.order_by(ResponseCase.created_at.desc())
    query = query.limit(limit).offset(offset)
    
    cases = list(session.scalars(query).all())
    
    return cases, total


def get_response_case(
    session: Session,
    tenant_id: uuid.UUID,
    response_case_id: uuid.UUID
) -> Optional[ResponseCase]:
    """Get single response case.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        response_case_id: Response case ID
        
    Returns:
        ResponseCase or None if not found
    """
    return session.scalar(
        select(ResponseCase).where(
            ResponseCase.id == response_case_id,
            ResponseCase.tenant_id == tenant_id
        )
    )
