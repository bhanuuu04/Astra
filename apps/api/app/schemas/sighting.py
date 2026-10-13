from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field


class SightingCreate(BaseModel):
    brand_id: Optional[uuid.UUID] = None
    surface: str = Field(..., description="Surface: x_twitter, instagram, telegram, web, apk, linkedin")
    source_kind: str = Field("direct_message", description="Kind: direct_message, post, web_crawl, fixture")
    observed_at: Optional[datetime] = None
    raw_ref: Optional[str] = None
    content: Optional[str] = None
    sender: Optional[Dict[str, Any]] = None
    normalized_payload: Optional[Dict[str, Any]] = None
    evidence_text: Optional[str] = None
    media_type: Optional[str] = "text/plain"


class SightingBatchRequest(BaseModel):
    tenant_id: Optional[uuid.UUID] = None
    brand_id: Optional[uuid.UUID] = None
    sightings: List[SightingCreate]


class SightingResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    brand_id: uuid.UUID
    surface: str
    source_kind: str
    observed_at: Optional[datetime] = None
    raw_ref: Optional[str] = None
    normalized_payload: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SightingBatchResponse(BaseModel):
    ingested_count: int
    sighting_ids: List[uuid.UUID]
    indicators_extracted: int


class EvidenceDetailResponse(BaseModel):
    id: uuid.UUID
    sighting_id: uuid.UUID
    object_key: str
    media_type: str
    sha256: str
    captured_at: datetime
    source_ref: Optional[str] = None
    verified_integrity: bool = True
    content: Optional[str] = None

    class Config:
        from_attributes = True


class SightingWhitelistRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Reason for whitelisting / claiming this asset")


class SightingDismissRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Reason for dismissing as false positive")


class SightingTakedownRequest(BaseModel):
    target_provider: Optional[str] = Field(None, description="Provider: registrar_dmca, cloudflare_abuse, meta_takedown, x_abuse, google_abuse")
    notes: Optional[str] = Field(None, description="Notes or case description for the takedown request")


class SightingActionResponse(BaseModel):
    success: bool
    sighting: SightingResponse
    message: str
    triage_status: Optional[str] = None
    is_benign: Optional[bool] = None
    sighting_id: Optional[str] = None


