from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field

from app.schemas.analysis import SignalResponse
from app.schemas.sighting import SightingResponse


class CampaignEdgeResponse(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    from_endpoint: str
    to_endpoint: str
    pivot_type: str
    confidence: float
    evidence_ids: Optional[List[str]] = None
    review_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    brand_id: uuid.UUID
    title: str
    status: str
    risk_score: float
    first_seen_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True


class CampaignDetailResponse(BaseModel):
    campaign: CampaignResponse
    members: List[SightingResponse]
    edges: List[CampaignEdgeResponse]
    signals: List[SignalResponse]


class EdgeDecisionRequest(BaseModel):
    decision: str = Field(..., description="Action: confirm or reject")
    reason: str = Field(..., min_length=3, description="Analyst justification")
    actor: Optional[str] = "analyst@astra.security"


class CampaignDecisionRequest(BaseModel):
    decision: str = Field(..., description="Action: accept, reject, or benign")
    reason: str = Field(..., min_length=3, description="Analyst justification")
    actor: Optional[str] = "analyst@astra.security"
