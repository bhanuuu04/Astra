from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field


class ConnectorType(str, Enum):
    ANALYST_SUBMITTED = "analyst_submitted"
    CUSTOMER_AUTHORIZED = "customer_authorized"
    META_GRAPH = "meta_graph_api"
    YOUTUBE_DATA = "youtube_data_api"
    VIRUSTOTAL = "virustotal_v3"
    GOOGLE_PLAY = "google_play_abuse"
    WEB_CRAWLER = "licensed_web_provider"


class ConnectorStatus(str, Enum):
    ACTIVE_LIVE = "active_live"
    UNCONFIGURED = "unconfigured"
    RATE_LIMITED = "rate_limited"
    STALE = "stale"
    AUTH_EXPIRED = "auth_expired"
    ERROR = "error"


class NormalizedFinding(BaseModel):
    """Enterprise Ingestion Contract: every finding arriving into ASTRA must satisfy this contract."""

    # 1. Provenance & Identity
    source_identity: str = Field(..., description="Unique connector identity, e.g. meta:instagram_graph or analyst:portal")
    connector_type: ConnectorType
    permission_scope: str = Field(..., description="Authorization scope under which data was collected")
    external_id: str = Field(..., description="External platform ID or canonical URL")
    source_timestamp: Optional[datetime] = Field(None, description="Timestamp reported by external source")
    collected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # 2. Target Brand & Surface
    brand_id: uuid.UUID
    surface: str = Field(..., description="Social platform or surface: instagram, telegram, apk, web")
    target_handle_or_ref: str

    # 3. Evidence Payload & Cryptography
    raw_payload_bytes: Optional[bytes] = None
    raw_payload_ref: Optional[str] = None
    sha256_hash: Optional[str] = None
    media_type: str = "application/json"

    # 4. Extracted Telemetry
    normalized_content: str
    sender_metadata: Optional[Dict[str, Any]] = None
    extracted_pivots: List[Dict[str, str]] = Field(default_factory=list)

    # 5. Connector Lifecycle & Parser
    parser_version: str = "1.0.0"
    connector_status: ConnectorStatus = ConnectorStatus.ACTIVE_LIVE
    is_live_source: bool = True
