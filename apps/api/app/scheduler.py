"""Periodic synchronization worker for configured, pull-capable connectors."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select, text

from app.core.config import get_settings
from app.db.models import Brand, Connector
from app.db.session import SessionLocal, engine
from app.domain.connector_service import sync_connector_telemetry

logger = logging.getLogger("astra.connector_scheduler")

# Session-scoped PostgreSQL advisory lock prevents duplicate polling when the
# scheduler service is accidentally scaled to multiple replicas.
SCHEDULER_LOCK_ID = 781_204_219
PULL_CONNECTOR_TYPES = {
    "virustotal", "virustotal_v3", "youtube", "youtube_data",
    "youtube_data_api", "telegram", "telegram_bot", "google_play",
    "google_play_abuse", "certificate_transparency", "crt_sh",
    "x_twitter", "x_api", "x_api_v2",
}
DAILY_CONNECTOR_TYPES = {"certificate_transparency", "crt_sh"}
SCHEDULABLE_STATUSES = {"active", "degraded", "error"}


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def sync_due_connectors() -> None:
    settings = get_settings()
    if not settings.connector_auto_sync_enabled:
        return

    now = datetime.now(timezone.utc)
    with SessionLocal() as session:
        connectors = session.scalars(
            select(Connector).where(
                or_(
                    Connector.auth_config_vault_ref.is_not(None),
                    Connector.connector_type.in_(DAILY_CONNECTOR_TYPES),
                ),
                Connector.status.in_(SCHEDULABLE_STATUSES),
                Connector.tenant_id.in_(select(Brand.tenant_id).distinct()),
            ).order_by(Connector.created_at.asc())
        ).all()
        due = []
        for connector in connectors:
            connector_type = connector.connector_type.lower()
            if connector_type not in PULL_CONNECTOR_TYPES:
                continue
            interval = timedelta(days=1) if connector_type in DAILY_CONNECTOR_TYPES else timedelta(
                seconds=max(60, settings.connector_auto_sync_interval_seconds)
            )
            last_attempt = connector.last_sync_attempt_at or connector.last_successful_sync_at
            if last_attempt is None or now >= _utc(last_attempt) + interval:
                due.append((connector.tenant_id, connector.id, connector.name))

    for tenant_id, connector_id, name in due:
        try:
            with SessionLocal() as session:
                result = sync_connector_telemetry(session, tenant_id, connector_id)
            logger.info(
                "Scheduled connector sync completed: name=%s connector_id=%s findings=%d status=%s",
                name,
                connector_id,
                result["synced_findings_count"],
                result["status"],
            )
        except Exception as exc:
            if "No brand registered for this tenant" in str(exc) or "No approved brand ownership" in str(exc):
                logger.info("Deferring connector sync until an approved brand is enrolled: connector_id=%s", connector_id)
                continue
            # Provider errors are normally persisted by the service. Keep an
            # unexpected worker exception visible in connector health as well.
            logger.exception("Scheduled connector sync failed: name=%s connector_id=%s", name, connector_id)
            with SessionLocal() as session:
                connector = session.get(Connector, connector_id)
                if connector and connector.tenant_id == tenant_id:
                    connector.status = "error"
                    connector.error_message = str(exc)[:2000]
                    session.commit()


def run_scheduler() -> None:
    settings = get_settings()
    poll_seconds = max(5, settings.connector_scheduler_poll_seconds)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logger.info(
        "Connector scheduler started: enabled=%s interval_seconds=%s poll_seconds=%s",
        settings.connector_auto_sync_enabled,
        max(60, settings.connector_auto_sync_interval_seconds),
        poll_seconds,
    )

    with engine.connect() as lock_connection:
        lock_acquired = False
        while not lock_acquired:
            try:
                lock_acquired = bool(
                    lock_connection.execute(
                        text("SELECT pg_try_advisory_lock(:lock_id)"),
                        {"lock_id": SCHEDULER_LOCK_ID},
                    ).scalar_one()
                )
                lock_connection.commit()
            except Exception:
                lock_connection.rollback()
                logger.exception("Could not acquire connector scheduler lock; retrying")
            if not lock_acquired:
                time.sleep(poll_seconds)

        logger.info("Connector scheduler lock acquired")
        while True:
            try:
                sync_due_connectors()
            except Exception:
                logger.exception("Connector scheduler cycle failed")
            time.sleep(poll_seconds)


if __name__ == "__main__":
    run_scheduler()
