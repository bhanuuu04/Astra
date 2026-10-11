"""Pydantic schemas for Connector model (authorized data sources)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class ConnectorCreate(BaseModel):
    """Create a new connector."""
    connector_type: str = Field(..., description="Type: meta_graph, google_play, virustotal, telegram_bot, youtube, x_twitter")
    name: str = Field(..., min_length=3, max_length=128, description="Human-readable connector name")
    auth_config: Optional[Dict[str, str]] = Field(default=None, description="Authentication credentials (encrypted into secret vault)")
    permitted_scopes: Optional[List[str]] = Field(default_factory=list, description="OAuth scopes or permissions")
    rate_limit_rpm: Optional[int] = Field(default=60, description="Rate limit in requests per minute")


class ConnectorUpdate(BaseModel):
    """Update connector configuration."""
    name: Optional[str] = Field(None, min_length=3, max_length=128)
    auth_config: Optional[Dict[str, str]] = None
    permitted_scopes: Optional[List[str]] = None
    rate_limit_rpm: Optional[int] = None
    status: Optional[str] = None  # active, degraded, error, revoked


class ConnectorResponse(BaseModel):
    """Connector response with health and sync telemetry."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    connector_type: str
    name: str
    status: str  # active, degraded, error, revoked, unconfigured
    permitted_scopes: List[str]
    rate_limit_rpm: int
    last_health_check_at: Optional[datetime] = None
    last_successful_sync_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    
    # DO NOT expose auth_config_vault_ref or secret credentials in response
    model_config = ConfigDict(from_attributes=True)


class ConnectorHealthCheck(BaseModel):
    """Connector health check response."""
    connector_id: uuid.UUID
    status: str  # active, degraded, error, unconfigured
    last_check: datetime
    next_sync_expected: Optional[datetime] = None
    error_message: Optional[str] = None


class ConnectorSyncResponse(BaseModel):
    """Result of running live telemetry ingestion sync on a connector."""
    connector_id: uuid.UUID
    status: str
    synced_findings_count: int
    finding_ids: List[uuid.UUID] = Field(default_factory=list)
    synced_at: datetime
    error_message: Optional[str] = None


class ConnectorListResponse(BaseModel):
    """List of connectors."""
    connectors: List[ConnectorResponse]
    total: int
