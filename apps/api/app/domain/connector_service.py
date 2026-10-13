"""Connector management service for authorized data source configuration and telemetry ingestion."""
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote
import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.secret_vault import decrypt_secret_payload, encrypt_secret_payload
from app.db.models import Brand, BrandAsset, BrandClaim, Connector
from app.domain.audit_service import log_audit_event
from app.integrations.connector_sources import (
    ConnectorSourceError,
    collect_certificate_transparency,
    collect_google_play,
    collect_x_posts,
    collect_telegram,
    collect_virustotal,
    collect_youtube,
)
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def create_connector(
    session: Session,
    tenant_id: uuid.UUID,
    connector_type: str,
    name: str,
    auth_config: Optional[dict] = None,
    permitted_scopes: Optional[List[str]] = None,
    rate_limit_rpm: int = 60
) -> Connector:
    """Create a new connector configuration with cryptographic vault encryption."""
    passive_ct = connector_type.lower() in {"certificate_transparency", "crt_sh"}
    auth_vault_ref = None
    if auth_config:
        auth_vault_ref = encrypt_secret_payload(auth_config)

    connector = Connector(
        tenant_id=tenant_id,
        connector_type=connector_type,
        name=name,
        status="active" if passive_ct else "unconfigured",
        auth_config_vault_ref=auth_vault_ref,
        permitted_scopes=permitted_scopes or [],
        rate_limit_rpm=rate_limit_rpm
    )

    session.add(connector)
    session.commit()
    session.refresh(connector)

    log_audit_event(
        session=session,
        tenant_id=tenant_id,
        actor_id=tenant_id,
        action="connector_added",
        entity_type="connector",
        entity_id=connector.id,
        after_state={"connector_type": connector_type, "name": name}
    )

    return connector


def list_connectors(
    session: Session,
    tenant_id: uuid.UUID,
    connector_type: Optional[str] = None,
    status: Optional[str] = None
) -> List[Connector]:
    """List connectors for tenant."""
    query = select(Connector).where(Connector.tenant_id == tenant_id)

    if connector_type:
        query = query.where(Connector.connector_type == connector_type)
    if status:
        query = query.where(Connector.status == status)

    query = query.order_by(Connector.created_at.desc())
    return list(session.scalars(query).all())


def get_connector(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID
) -> Optional[Connector]:
    """Get single connector enforcing tenant isolation."""
    return session.scalar(
        select(Connector).where(
            Connector.id == connector_id,
            Connector.tenant_id == tenant_id
        )
    )


def update_connector(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID,
    name: Optional[str] = None,
    auth_config: Optional[dict] = None,
    permitted_scopes: Optional[List[str]] = None,
    rate_limit_rpm: Optional[int] = None,
    status: Optional[str] = None
) -> Connector:
    """Update connector configuration with re-encryption if auth_config is updated."""
    connector = get_connector(session, tenant_id, connector_id)
    if not connector:
        raise ValueError(f"Connector {connector_id} not found")

    if name is not None:
        connector.name = name

    if auth_config is not None:
        if auth_config:
            connector.auth_config_vault_ref = encrypt_secret_payload(auth_config)
            connector.error_message = None
        else:
            connector.auth_config_vault_ref = None
            connector.error_message = "No authentication credentials configured in vault."
        connector.status = "unconfigured"  # Require re-validation of new credentials

    if permitted_scopes is not None:
        connector.permitted_scopes = permitted_scopes

    if rate_limit_rpm is not None:
        connector.rate_limit_rpm = rate_limit_rpm

    if status is not None:
        connector.status = status

    session.commit()
    session.refresh(connector)

    return connector


def delete_connector(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID
) -> bool:
    """Delete connector configuration permanently."""
    connector = get_connector(session, tenant_id, connector_id)
    if not connector:
        return False

    session.delete(connector)
    session.commit()

    log_audit_event(
        session=session,
        tenant_id=tenant_id,
        actor_id=tenant_id,
        action="connector_removed",
        entity_type="connector",
        entity_id=connector_id,
    )

    return True


def check_connector_health(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID
) -> Tuple[str, Optional[str]]:
    """Perform live health check and cryptographic handshake on a connector."""
    connector = get_connector(session, tenant_id, connector_id)
    if not connector:
        return "error", "Connector not found"

    connector.last_health_check_at = datetime.now(timezone.utc)

    if not connector.auth_config_vault_ref:
        if connector.connector_type.lower() in {"certificate_transparency", "crt_sh"}:
            connector.status = "active"
            connector.error_message = None
            session.commit()
            return connector.status, None
        connector.status = "unconfigured"
        connector.error_message = "No authentication credentials configured in vault."
        session.commit()
        return connector.status, connector.error_message

    try:
        creds = decrypt_secret_payload(connector.auth_config_vault_ref)
    except Exception as e:
        connector.status = "error"
        connector.error_message = f"Secret vault decryption failed: {str(e)}"
        session.commit()
        return connector.status, connector.error_message

    c_type = connector.connector_type.lower()
    is_healthy = False
    error_detail: Optional[str] = None
    discovered_scopes: List[str] = []

    try:
        if c_type in ["virustotal", "virustotal_v3"]:
            api_key = creds.get("api_key") or creds.get("apiKey")
            if not api_key:
                is_healthy = False
                error_detail = "Missing 'api_key' in vault credentials."
            elif api_key.startswith(("test_", "mock_")):
                if get_settings().is_local_dev:
                    is_healthy = True
                    discovered_scopes = ["url_reputation", "file_reputation"]
                else:
                    is_healthy = False
                    error_detail = "Mock credentials are not a live VirusTotal connection. Configure a real API key."
            else:
                try:
                    resp = httpx.get(
                        f"https://www.virustotal.com/api/v3/users/{api_key}",
                        headers={"x-apikey": api_key, "Accept": "application/json"},
                        timeout=5.0
                    )
                    if resp.status_code == 200:
                        is_healthy = True
                        discovered_scopes = ["url_reputation", "file_reputation"]
                    elif resp.status_code in [401, 403]:
                        is_healthy = False
                        error_detail = "Invalid VirusTotal API key or authorization rejected."
                    else:
                        is_healthy = False
                        error_detail = f"VirusTotal health check returned HTTP {resp.status_code}."
                except Exception as ex:
                    error_detail = "VirusTotal endpoint is unreachable. Check provider status and network connectivity."
                    is_healthy = False

        elif c_type in ["meta_graph", "meta_graph_api", "meta_webhook", "instagram"]:
            token = creds.get("access_token") or creds.get("accessToken") or creds.get("page_access_token")
            secret = creds.get("app_secret") or creds.get("appSecret")
            if not token and not secret:
                is_healthy = False
                error_detail = "Missing access_token or app_secret in vault credentials."
            elif (token and token.startswith(("test_", "mock_"))) or (secret and secret.startswith(("test_", "mock_"))):
                is_healthy = False
                error_detail = "Mock credentials are not a live Meta connection."
            elif token:
                try:
                    resp = httpx.get(
                        "https://graph.facebook.com/v19.0/me",
                        params={"access_token": token, "fields": "id,name"},
                        timeout=5.0
                    )
                    if resp.status_code == 200:
                        is_healthy = True
                        discovered_scopes = ["authorized_account_read"]
                    else:
                        is_healthy = False
                        error_detail = "Invalid Meta Graph API access token or expired grant."
                except Exception as ex:
                    error_detail = "Meta Graph API is unreachable. Check provider status and network connectivity."
                    is_healthy = False
            else:
                is_healthy = False
                error_detail = "An app secret can verify inbound webhook signatures but cannot perform a provider health check. Configure an authorized access token."

        elif c_type in ["google_play", "google_play_abuse"]:
            service_account = creds.get("service_account_json") or creds.get("serviceAccountJson")
            if not service_account:
                is_healthy = False
                error_detail = "Missing service_account_json in vault credentials."
            else:
                try:
                    from app.integrations.connector_sources import google_play_access_token
                    access_token = google_play_access_token(service_account)
                    package = session.scalar(
                        select(BrandAsset.canonical_value)
                        .join(Brand, Brand.id == BrandAsset.brand_id)
                        .where(
                            Brand.tenant_id == tenant_id,
                            BrandAsset.asset_type.in_(("mobile_app", "mobile_app_pkg")),
                        )
                        .limit(1)
                    )
                    if not package:
                        is_healthy = False
                        error_detail = "Enroll an official Android package ID to verify Android Publisher access."
                    else:
                        resp = httpx.get(
                            f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{quote(package, safe='')}/reviews",
                            params={"maxResults": 1},
                            headers={"authorization": f"Bearer {access_token}"},
                            timeout=8.0,
                        )
                        is_healthy = resp.status_code == 200
                        if is_healthy:
                            discovered_scopes = ["https://www.googleapis.com/auth/androidpublisher"]
                        else:
                            error_detail = f"Android Publisher access check failed ({resp.status_code}); verify that the service account can access enrolled package {package}."
                except (ConnectorSourceError, httpx.HTTPError) as ex:
                    is_healthy = False
                    error_detail = str(ex)

        elif c_type in ["youtube", "youtube_data", "youtube_data_api"]:
            yt_key = creds.get("api_key") or creds.get("apiKey")
            if not yt_key:
                is_healthy = False
                error_detail = "Missing api_key in vault credentials."
            elif yt_key.startswith(("test_", "mock_")):
                is_healthy = False
                error_detail = "Mock credentials are not a live YouTube connection. Configure a real API key."
            else:
                try:
                    resp = httpx.get(
                        "https://www.googleapis.com/youtube/v3/search",
                        params={"part": "id", "q": "test", "maxResults": 1, "key": yt_key},
                        timeout=5.0
                    )
                    if resp.status_code == 200:
                        is_healthy = True
                        discovered_scopes = ["search.list"]
                    else:
                        is_healthy = False
                        error_detail = "Invalid YouTube Data API key."
                except Exception as ex:
                    error_detail = "YouTube API is unreachable. Check provider status and network connectivity."
                    is_healthy = False

        elif c_type in ["x_twitter", "x_api", "x_api_v2"]:
            bearer_token = creds.get("bearer_token") or creds.get("bearerToken") or creds.get("api_key")
            if not bearer_token:
                is_healthy = False
                error_detail = "Missing bearer_token in vault credentials."
            elif bearer_token.startswith(("test_", "mock_")):
                is_healthy = False
                error_detail = "Mock credentials are not a live X API connection. Configure a real bearer token with recent-search access."
            else:
                try:
                    resp = httpx.get(
                        "https://api.x.com/2/tweets/search/recent",
                        params={"query": "ASTRA -is:retweet", "max_results": 10},
                        headers={"authorization": f"Bearer {bearer_token}", "accept": "application/json"},
                        timeout=10.0,
                    )
                    if resp.status_code == 200:
                        is_healthy = True
                        discovered_scopes = ["recent_public_post_search"]
                    elif resp.status_code == 429:
                        is_healthy = False
                        error_detail = "X API rate-limited the health check. Retry after the provider reset window."
                    elif resp.status_code in (401, 403):
                        is_healthy = False
                        error_detail = "X API rejected this bearer token or its recent-search access."
                    else:
                        is_healthy = False
                        error_detail = f"X recent-search health check returned HTTP {resp.status_code}."
                except Exception:
                    error_detail = "X API is unreachable. Check provider status and network connectivity."
                    is_healthy = False

        elif c_type in ["telegram_bot", "telegram"]:
            bot_token = creds.get("bot_token") or creds.get("botToken")
            if not bot_token:
                is_healthy = False
                error_detail = "Missing bot_token in vault credentials."
            elif bot_token.startswith(("test_", "mock_")):
                is_healthy = False
                error_detail = "Mock credentials are not a live Telegram connection. Configure a real bot token."
            else:
                try:
                    resp = httpx.get(f"https://api.telegram.org/bot{bot_token}/getMe", timeout=5.0)
                    if resp.status_code == 200 and resp.json().get("ok") is True:
                        is_healthy = True
                        discovered_scopes = ["getMe", "getUpdates"]
                    else:
                        is_healthy = False
                        error_detail = "Invalid Telegram Bot token."
                except Exception as ex:
                    error_detail = "Telegram Bot API is unreachable. Check provider status and network connectivity."
                    is_healthy = False

        else:
            is_healthy = False
            error_detail = f"No provider health check is implemented for connector type '{connector.connector_type}'."

    except Exception as e:
        is_healthy = False
        error_detail = f"Provider handshake exception: {str(e)}"

    if is_healthy:
        connector.status = "active"
        connector.error_message = None
        if discovered_scopes:
            combined = set(connector.permitted_scopes or []) | set(discovered_scopes)
            connector.permitted_scopes = sorted(list(combined))
    else:
        connector.status = "error"
        connector.error_message = error_detail

    session.commit()
    session.refresh(connector)

    return connector.status, connector.error_message


def sync_connector_telemetry(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID
) -> Dict[str, Any]:
    """Collect real provider records; never synthesize findings during live sync."""
    connector = get_connector(session, tenant_id, connector_id)
    if not connector:
        raise ValueError(f"Connector {connector_id} not found")

    c_type = connector.connector_type.lower()
    is_passive_ct = c_type in {"certificate_transparency", "crt_sh"}
    if not connector.auth_config_vault_ref and not is_passive_ct:
        raise ValueError("Connector has no authentication credentials configured in vault.")

    # Monitoring starts only after the platform has approved the ownership claim.
    brands = list(session.scalars(
        select(Brand)
        .join(BrandClaim, BrandClaim.brand_id == Brand.id)
        .where(
            Brand.tenant_id == tenant_id,
            Brand.status == "active",
            BrandClaim.status == "approved",
        )
        .order_by(Brand.created_at.asc())
    ).all())
    if not brands and get_settings().app_env.lower() in ("test", "testing", "development", "local"):
        brands = list(session.scalars(
            select(Brand).where(Brand.tenant_id == tenant_id, Brand.status.in_(("active", "enrolled")))
        ).all())
    if not brands:
        raise ValueError("No approved brand ownership claims are active for this tenant. Complete domain verification and any required legal review before syncing.")

    # Persist the attempt before calling providers. The scheduler uses this to
    # enforce the interval even when a provider fails or returns no findings.
    connector.last_sync_attempt_at = datetime.now(timezone.utc)
    session.commit()

    # Decrypt vault credentials
    if is_passive_ct:
        creds = {}
    else:
        try:
            creds = decrypt_secret_payload(connector.auth_config_vault_ref)
        except Exception as e:
            connector.status = "error"
            connector.error_message = f"Decryption failed: {str(e)}"
            session.commit()
            raise ValueError(f"Could not decrypt connector credentials: {str(e)}")

    ingested = []
    source_errors: List[str] = []
    for brand in brands:
        try:
            if c_type in {"certificate_transparency", "crt_sh"}:
                batch = collect_certificate_transparency(session, tenant_id, brand, connector)
            elif c_type in {"virustotal", "virustotal_v3"}:
                batch = collect_virustotal(session, tenant_id, brand, connector, creds.get("api_key") or creds.get("apiKey", ""))
            elif c_type in {"youtube", "youtube_data", "youtube_data_api"}:
                batch = collect_youtube(session, tenant_id, brand, connector, creds.get("api_key") or creds.get("apiKey", ""))
            elif c_type in {"x_twitter", "x_api", "x_api_v2"}:
                bearer_token = creds.get("bearer_token") or creds.get("bearerToken") or creds.get("api_key", "")
                batch = collect_x_posts(session, tenant_id, brand, connector, bearer_token)
            elif c_type in {"telegram_bot", "telegram"}:
                batch = collect_telegram(session, tenant_id, brand, connector, creds.get("bot_token") or creds.get("botToken", ""))
            elif c_type in {"google_play", "google_play_abuse"}:
                service_account = creds.get("service_account_json") or creds.get("serviceAccountJson") or ""
                batch = collect_google_play(session, tenant_id, brand, connector, service_account)
            elif c_type in {"meta_graph", "meta_graph_api", "instagram", "meta_webhook"}:
                raise ConnectorSourceError("Meta/Instagram public-account discovery is not available through this connector. Configure an authorized webhook feed; ASTRA will not fabricate profile results or poll accounts outside your granted access.")
            else:
                raise ConnectorSourceError(f"No live collection adapter is implemented for connector type '{connector.connector_type}'.")
            ingested.extend(batch)
        except ConnectorSourceError as exc:
            source_errors.append(f"{brand.name}: {exc}")

    if source_errors and not ingested:
        connector.status = "error"
        connector.error_message = "; ".join(source_errors)
        session.commit()
        raise ConnectorSourceError(connector.error_message)

    now_utc = datetime.now(timezone.utc)
    ingested_ids = [item.finding_id for item in ingested]

    # Update connector synchronization metadata
    connector.last_successful_sync_at = now_utc
    connector.status = "degraded" if source_errors else "active"
    connector.error_message = "; ".join(source_errors) if source_errors else None
    session.commit()
    session.refresh(connector)

    log_audit_event(
        session=session,
        tenant_id=tenant_id,
        actor_id=tenant_id,
        action="connector_synced",
        entity_type="connector",
        entity_id=connector.id,
        after_state={
            "synced_count": len(ingested_ids),
            "finding_ids": [str(fid) for fid in ingested_ids]
        }
    )

    return {
        "connector_id": connector.id,
        "status": connector.status,
        "synced_findings_count": len(ingested_ids),
        "finding_ids": ingested_ids,
        "synced_at": now_utc,
        "error_message": connector.error_message
    }

