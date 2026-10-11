from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field


class AnalysisJobRequest(BaseModel):
    tenant_id: Optional[uuid.UUID] = None
    brand_id: Optional[uuid.UUID] = None
    sighting_ids: Optional[List[uuid.UUID]] = None


class SignalResponse(BaseModel):
    id: uuid.UUID
    sighting_id: uuid.UUID
    run_id: Optional[uuid.UUID] = None
    detector_key: str
    detector_version: str
    score: float
    threshold: float
    explanation: str
    evidence_ids: Optional[List[str]] = None
    feature_values: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisJobResponse(BaseModel):
    run_id: uuid.UUID
    status: str
    brand_id: uuid.UUID
    sightings_processed: int
    signals_generated: int
    edges_proposed: int
    campaigns_updated: int
    created_at: datetime
    completed_at: Optional[datetime] = None
