from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field


class ResponseDraftItem(BaseModel):
    recipient_type: str = Field(..., description="Recipient: meta, x_twitter, google_play, icann_registrar, payment_rail, customer_advisory")
    recipient_name: str
    subject: str
    body_text: str
    contact_email: str
    portal_url: Optional[str] = None
    policy_reference: str


class EvidenceManifestItem(BaseModel):
    id: str
    name: str
    media_type: str
    sha256: str
    captured_at: str
    source_reference: str
    included: bool = True


class ResponsePacketResponse(BaseModel):
    action_id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_title: str
    status: str
    drafts: List[ResponseDraftItem]
    manifest: List[EvidenceManifestItem]
    created_at: datetime


class SimulateActionRequest(BaseModel):
    actor: Optional[str] = "analyst@astra.security"
    notes: Optional[str] = "Simulated response execution during analyst triage"


class SimulateActionResponse(BaseModel):
    action_id: uuid.UUID
    campaign_id: uuid.UUID
    status: str
    simulated_at: datetime
    simulated_by: str
    message: str
