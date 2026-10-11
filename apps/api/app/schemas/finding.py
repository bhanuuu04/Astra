"""Pydantic schemas for Finding model (normalized threat observations)."""
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class FindingIngest(BaseModel):
    """Single finding ingestion request."""
    brand_id: uuid.UUID
    connector_id: Optional[uuid.UUID] = None
    surface: str = Field(..., description="Platform: instagram, x, google_play, telegram, virustotal, etc.")
    external_id: str = Field(..., description="External platform identifier")
    target_identifier: str = Field(..., description="Handle, package name, or URL being reported")
    observed_at: datetime
    source_kind: str = Field(..., description="Type: social_profile, mobile_app, web_domain, messaging")
    data_mode: str = Field(default="live", description="Data source mode: live, synthetic_demo, manual_upload")
    raw_payload: Optional[Dict[str, Any]] = None
    evidence_files: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    normalized_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)


class FindingBatchIngestRequest(BaseModel):
    """Batch finding ingestion request."""
    tenant_id: Optional[uuid.UUID] = None  # Server-enforced from auth context
    findings: List[FindingIngest]
    idempotency_key: Optional[str] = None


class FindingTriageSignal(BaseModel):
    """Individual detection signal contributing to triage priority."""
    detector_key: str
    detector_version: str
    score: float
    explanation: str
    feature_values: Optional[Dict[str, Any]] = None


class FindingResponse(BaseModel):
    """Finding response with triage information."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    brand_id: uuid.UUID
    connector_id: Optional[uuid.UUID] = None
    source_kind: str
    surface: str
    external_id: str
    target_identifier: str
    observed_at: datetime
    collected_at: datetime
    data_mode: str  # CRITICAL: live, synthetic_demo, manual_upload badge
    raw_evidence_id: Optional[uuid.UUID] = None
    normalized_attributes: Dict[str, Any]
    triage_status: str  # pending, investigating, confirmed_threat, false_positive, needs_evidence
    triage_priority: float  # 0.0 - 1.0
    assigned_analyst_id: Optional[uuid.UUID] = None
    created_at: datetime
    
    # Optional nested signal breakdown
    signals: Optional[List[FindingTriageSignal]] = None

    model_config = ConfigDict(from_attributes=True)


class FindingListResponse(BaseModel):
    """Paginated findings list response."""
    findings: List[FindingResponse]
    total: int
    limit: int
    offset: int


class FindingTriageUpdate(BaseModel):
    """Update finding triage status."""
    triage_status: Literal["pending", "investigating", "confirmed_threat", "false_positive", "needs_evidence"] = Field(
        ..., description="New status: pending, investigating, confirmed_threat, false_positive, needs_evidence"
    )
    rationale: str = Field(..., min_length=10, description="Analyst rationale for triage decision")
    assigned_analyst_id: Optional[uuid.UUID] = None
    escalate_to_campaign: bool = Field(default=False, description="Link to campaign cluster")


class FindingIngestResponse(BaseModel):
    """Response from finding ingestion."""
    finding_id: uuid.UUID
    triage_priority: float
    signals: List[FindingTriageSignal]
    data_mode: str  # Echo back for confirmation


class FindingBatchIngestResponse(BaseModel):
    """Batch ingestion response."""
    ingested_count: int
    duplicate_count: int
    finding_ids: List[uuid.UUID]
