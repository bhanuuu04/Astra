from datetime import datetime, timezone
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import TenantSettings
from app.schemas.settings import TenantSettingsUpdate


def get_tenant_settings(session: Session, tenant_id: uuid.UUID) -> TenantSettings:
    """Retrieve settings for a tenant, initializing defaults if none exist."""
    settings = session.scalar(
        select(TenantSettings).where(TenantSettings.tenant_id == tenant_id)
    )
    if not settings:
        settings = TenantSettings(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            quarantine_threshold=80,
            slack_webhook_url=None,
            alert_critical_only=False,
            notification_email=None,
            auto_quarantine_enabled=True,
        )
        session.add(settings)
        session.commit()
    return settings


def update_tenant_settings(
    session: Session, tenant_id: uuid.UUID, updates: TenantSettingsUpdate
) -> TenantSettings:
    """Update settings for a tenant and persist them to PostgreSQL."""
    settings = get_tenant_settings(session, tenant_id)

    if updates.quarantine_threshold is not None:
        settings.quarantine_threshold = updates.quarantine_threshold
    if updates.slack_webhook_url is not None:
        # Allow clearing by setting empty string
        settings.slack_webhook_url = updates.slack_webhook_url.strip() if updates.slack_webhook_url.strip() else None
    if updates.alert_critical_only is not None:
        settings.alert_critical_only = updates.alert_critical_only
    if updates.notification_email is not None:
        settings.notification_email = updates.notification_email.strip() if updates.notification_email.strip() else None
    if updates.auto_quarantine_enabled is not None:
        settings.auto_quarantine_enabled = updates.auto_quarantine_enabled

    settings.updated_at = datetime.now(timezone.utc)
    session.add(settings)
    session.commit()
    return settings
