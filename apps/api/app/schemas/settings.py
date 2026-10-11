from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class TenantSettingsResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    quarantine_threshold: int = Field(..., ge=50, le=100, description="Auto-quarantine risk score threshold (50-100)")
    slack_webhook_url: Optional[str] = Field(None, description="Incoming Slack webhook URL")
    alert_critical_only: bool = Field(False, description="Whether to alert exclusively on critical severity threats")
    notification_email: Optional[str] = Field(None, description="Notification email address")
    auto_quarantine_enabled: bool = Field(True, description="Enable automated blocking/quarantine")
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TenantSettingsUpdate(BaseModel):
    quarantine_threshold: Optional[int] = Field(None, ge=50, le=100, description="Auto-quarantine risk score threshold")
    slack_webhook_url: Optional[str] = Field(None, description="Incoming Slack webhook URL")
    alert_critical_only: Optional[bool] = Field(None, description="Whether to alert exclusively on critical severity threats")
    notification_email: Optional[str] = Field(None, description="Notification email address")
    auto_quarantine_enabled: Optional[bool] = Field(None, description="Enable automated blocking/quarantine")
