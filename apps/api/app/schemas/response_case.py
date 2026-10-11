"""Pydantic schemas for ResponseCase model (human-governed takedown workflow)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field


class ResponseCaseDraft(BaseModel):
    """Create a draft response case."""
    finding_id: uuid.UUID
    cluster_id: Optional[uuid.UUID] = None
    target_provider: str = Field(..., description="Provider: meta_takedown, google_abuse, cloudflare_abuse, registrar_dmca")
    case_type: Optional[str] = Field(default="infringement_takedown", description="Takedown category")
    draft_recipient: Optional[str] = Field(default=None, description="Recipient authority or abuse desk")
    draft_subject: Optional[str] = Field(default=None, description="Notice subject line")
    draft_body: Optional[str] = Field(default=None, description="Legal notice body text")
    submission_payload: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Provider-specific takedown request payload")
    evidence_manifest: Optional[List[uuid.UUID]] = Field(default_factory=list, description="Evidence object IDs to include")


class ResponseCaseApprove(BaseModel):
    """Approve a response case."""
    approval_notes: Optional[str] = None


class ResponseCaseDispatch(BaseModel):
    """Dispatch a response case to external provider."""
    submission_channel: str = Field(default="manual_portal", description="Channel: manual_portal, api_automated, email_legal")


class ResponseCaseResolve(BaseModel):
    """Mark response case as resolved."""
    resolution_notes: str = Field(..., min_length=10, description="Outcome details")
    external_case_reference: Optional[str] = None


class ResponseCaseResponse(BaseModel):
    """Response case detail response."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    finding_id: uuid.UUID
    cluster_id: Optional[uuid.UUID] = None
    target_provider: str
    case_type: str = "infringement_takedown"
    draft_recipient: Optional[str] = None
    draft_subject: Optional[str] = None
    draft_body: Optional[str] = None
    lifecycle_state: str  # draft, pending_approval, approved, submitted, acknowledged, resolved, rejected
    drafted_by: uuid.UUID
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    submission_channel: str
    external_case_reference: Optional[str] = None
    evidence_manifest_hash: str
    evidence_manifest: Optional[List[uuid.UUID]] = None
    submission_payload: Dict[str, Any]
    submitted_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ResponseCaseListResponse(BaseModel):
    """List of response cases."""
    cases: List[ResponseCaseResponse]
    total: int
    limit: int
    offset: int
