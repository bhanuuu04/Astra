"""Live, provider-backed collection for connectors that support read APIs.

This module deliberately has no demo fallback. A provider failure is surfaced to
the operator instead of being converted into fabricated telemetry.
"""
from __future__ import annotations

import base64
import hashlib
import json
import re
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Brand, BrandAsset, Connector, Finding
from app.domain.finding_service import ingest_finding
from app.schemas.finding import FindingIngest


class ConnectorSourceError(ValueError):
    """A connector cannot collect from its provider with the current setup."""


def _brand_assets(session: Session, brand: Brand) -> list[BrandAsset]:
    return list(session.scalars(select(BrandAsset).where(BrandAsset.brand_id == brand.id)).all())


def _canonical_brand_terms(session: Session, brand: Brand) -> list[str]:
    terms = [brand.name.strip()]
    terms.extend(
        asset.canonical_value.strip().lstrip("@").split(":")[-1]
        for asset in _brand_assets(session, brand) if asset.asset_type in {"handle", "social_handle"}
    )
    return [term for term in dict.fromkeys(terms) if term]


def _ingest(
    session: Session,
    tenant_id,
    brand: Brand,
    connector: Connector,
    *,
    surface: str,
    source_kind: str,
    external_id: str,
    target_identifier: str,
    observed_at: datetime,
    raw_payload: dict[str, Any],
    normalized_attributes: dict[str, Any],
) -> Any:
    return ingest_finding(session, tenant_id, FindingIngest(
        brand_id=brand.id,
        connector_id=connector.id,
        surface=surface,
        source_kind=source_kind,
        external_id=external_id,
        target_identifier=target_identifier,
        observed_at=observed_at,
        data_mode="live",
        raw_payload=raw_payload,
        normalized_attributes={**normalized_attributes, "source_mode": "live_api"},
    ))


def collect_youtube(
    session: Session,
    tenant_id,
    brand: Brand,
    connector: Connector,
    api_key: str,
) -> list[Any]:
    """Search public YouTube results and persist the provider's real records."""
    if not api_key or api_key.startswith(("test_", "mock_")):
        raise ConnectorSourceError("A real YouTube Data API key is required; mock keys cannot run a live sync.")

    terms = _canonical_brand_terms(session, brand)
    query = f'"{terms[0]}" support OR customer care OR verify'
    try:
        response = httpx.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={"part": "snippet", "q": query, "type": "video", "maxResults": 25, "order": "date", "key": api_key},
            timeout=15.0,
        )
        if response.status_code != 200:
            raise ConnectorSourceError(f"YouTube Data API returned HTTP {response.status_code}.")
        payload = response.json()
    except ConnectorSourceError:
        raise
    except (httpx.HTTPError, ValueError) as exc:
        raise ConnectorSourceError("YouTube API collection failed due to a network or response error. Check the provider status and API credentials.") from exc

    ingested = []
    for item in payload.get("items", []):
        video_id = (item.get("id") or {}).get("videoId")
        snippet = item.get("snippet") or {}
        if not video_id:
            continue
        title = snippet.get("title") or ""
        description = snippet.get("description") or ""
        channel = snippet.get("channelTitle") or ""
        content = f"{title}\n{description}\n{channel}"
        folded_content = content.casefold()
        brand_match = any(term.casefold() in folded_content for term in terms)
        urls = re.findall(r"https?://[^\s<>\"]+", description, flags=re.IGNORECASE)
        phones = re.findall(r"\+?\d[\d ().-]{8,}\d", description)
        handles = re.findall(r"(?:t\.me/|telegram\.me/)[A-Za-z0-9_+]+", description, flags=re.IGNORECASE)
        scam_terms = [word for word in ("verify", "support", "refund", "wallet", "otp", "claim", "suspended") if word in folded_content]
        observed_at = datetime.fromisoformat(snippet["publishedAt"].replace("Z", "+00:00")) if snippet.get("publishedAt") else datetime.now(timezone.utc)
        attrs = {
            "provider": "youtube_data_api_v3",
            "brand_term_match": brand_match,
            "extracted_urls": urls,
            "extracted_phones": phones,
            "telegram_references": handles,
            "suspicious_terms": scam_terms,
            "channel_id": snippet.get("channelId"),
            "channel_title": channel,
        }
        ingested.append(_ingest(
            session, tenant_id, brand, connector,
            surface="youtube", source_kind="social_content",
            external_id=f"{brand.id}:{video_id}",
            target_identifier=f"https://www.youtube.com/watch?v={video_id}",
            observed_at=observed_at,
            raw_payload={"provider": "youtube_data_api_v3", "query": query, "item": item},
            normalized_attributes=attrs,
        ))
    return ingested


def collect_virustotal(
    session: Session,
    tenant_id,
    brand: Brand,
    connector: Connector,
    api_key: str,
) -> list[Any]:
    """Enrich URLs already submitted to ASTRA; VT is not treated as a discovery feed."""
    if not api_key or api_key.startswith(("test_", "mock_")):
        raise ConnectorSourceError("A real VirusTotal API key is required; mock keys cannot run a live sync.")

    candidates = list(session.scalars(
        select(Finding).where(
            Finding.tenant_id == tenant_id,
            Finding.brand_id == brand.id,
            Finding.connector_id.is_(None),
            Finding.target_identifier.like("http%"),
        ).order_by(Finding.created_at.desc()).limit(1)
    ).all())
    if not candidates:
        return []

    ingested = []
    for candidate in candidates:
        url = candidate.target_identifier
        url_id = base64.urlsafe_b64encode(url.encode("utf-8")).decode("ascii").rstrip("=")
        try:
            response = httpx.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers={"x-apikey": api_key, "accept": "application/json"}, timeout=15.0,
            )
            if response.status_code == 404:
                continue
            response.raise_for_status()
            report = response.json()
        except httpx.HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else None
            detail = f"VirusTotal returned HTTP {status_code}." if status_code else "VirusTotal is unreachable."
            raise ConnectorSourceError(detail) from exc

        attributes = (report.get("data") or {}).get("attributes") or {}
        stats = attributes.get("last_analysis_stats") or {}
        malicious = int(stats.get("malicious", 0) or 0)
        suspicious = int(stats.get("suspicious", 0) or 0)
        if malicious + suspicious == 0:
            continue
        ingested.append(_ingest(
            session, tenant_id, brand, connector,
            surface="virustotal", source_kind="web_domain",
            external_id=f"vt-url-{brand.id}-{hashlib.sha256(url.encode()).hexdigest()[:24]}",
            target_identifier=url,
            observed_at=datetime.now(timezone.utc),
            raw_payload={"provider": "virustotal_v3", "url": url, "report": report},
            normalized_attributes={
                "provider": "virustotal_v3", "malicious_engines": malicious,
                "suspicious_engines": suspicious,
                "harmless_engines": int(stats.get("harmless", 0) or 0),
                "reputation": attributes.get("reputation"),
                "threat_categories": attributes.get("categories") or {},
                "source_finding_id": str(candidate.id),
            },
        ))
        # Respect public API quotas: keep each sync small and sequential.
    return ingested


def collect_telegram(
    session: Session,
    tenant_id,
    brand: Brand,
    connector: Connector,
    bot_token: str,
) -> list[Any]:
    """Collect updates visible to this authorized bot; no channel search/joining."""
    if not bot_token or bot_token.startswith(("test_", "mock_")):
        raise ConnectorSourceError("A real Telegram bot token is required; mock tokens cannot run a live sync.")
    try:
        response = httpx.get(
            f"https://api.telegram.org/bot{bot_token}/getUpdates",
            params={"limit": 100, "timeout": 0, "allowed_updates": json.dumps(["message", "channel_post"])},
            timeout=15.0,
        )
        if response.status_code != 200:
            raise ConnectorSourceError(f"Telegram Bot API returned HTTP {response.status_code}.")
        payload = response.json()
        if not payload.get("ok"):
            raise ConnectorSourceError("Telegram rejected getUpdates for this bot token.")
    except ConnectorSourceError:
        raise
    except httpx.HTTPError as exc:
        raise ConnectorSourceError("Telegram Bot API collection failed due to a network error. Check the provider status and bot token.") from exc

    terms = [term.casefold() for term in _canonical_brand_terms(session, brand)]
    ingested = []
    for update in payload.get("result", []):
        message = update.get("channel_post") or update.get("message") or {}
        text = message.get("text") or message.get("caption") or ""
        if not text or not any(term in text.casefold() for term in terms):
            continue
        chat = message.get("chat") or {}
        username = chat.get("username")
        chat_id = str(chat.get("id", "unknown"))
        external_id = f"tg-{connector.id}-{brand.id}-update-{update.get('update_id')}"
        observed_at = datetime.fromtimestamp(message.get("date", time.time()), tz=timezone.utc)
        target = f"https://t.me/{username}/{message.get('message_id')}" if username else f"telegram-chat:{chat_id}/{message.get('message_id')}"
        ingested.append(_ingest(
            session, tenant_id, brand, connector,
            surface="telegram", source_kind="messaging",
            external_id=external_id, target_identifier=target,
            observed_at=observed_at,
            raw_payload={"provider": "telegram_bot_api", "update": update},
            normalized_attributes={"provider": "telegram_bot_api", "brand_term_match": True, "chat_title": chat.get("title"), "chat_username": username},
        ))
    return ingested


def google_play_access_token(service_account_json: str) -> str:
    """Exchange a Google service-account assertion for an Android Publisher token."""
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
        account = json.loads(service_account_json)
        email = account["client_email"]
        private_key = serialization.load_pem_private_key(account["private_key"].encode(), password=None)
    except Exception as exc:
        raise ConnectorSourceError("Google Play credentials must be a valid service-account JSON with client_email and private_key.") from exc

    now = int(time.time())
    encode = lambda value: base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")
    header = encode(json.dumps({"alg": "RS256", "typ": "JWT"}, separators=(",", ":")).encode())
    claims = encode(json.dumps({
        "iss": email,
        "scope": "https://www.googleapis.com/auth/androidpublisher",
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now,
        "exp": now + 3600,
    }, separators=(",", ":")).encode())
    signing_input = f"{header}.{claims}".encode("ascii")
    signature = private_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    assertion = f"{header}.{claims}.{encode(signature)}"
    try:
        response = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion},
            timeout=15.0,
        )
        response.raise_for_status()
        return response.json()["access_token"]
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise ConnectorSourceError(f"Google OAuth token exchange failed: {exc}") from exc


def collect_google_play(
    session: Session,
    tenant_id,
    brand: Brand,
    connector: Connector,
    service_account_json: str,
) -> list[Any]:
    """Fetch recent reviews for package IDs explicitly enrolled by the brand."""
    packages = [asset.canonical_value for asset in _brand_assets(session, brand) if asset.asset_type in {"mobile_app", "mobile_app_pkg"}]
    if not packages:
        return []
    token = google_play_access_token(service_account_json)
    ingested = []
    for package in packages[:5]:
        try:
            response = httpx.get(
                f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{quote(package, safe='')}/reviews",
                params={"maxResults": 100}, headers={"authorization": f"Bearer {token}"}, timeout=15.0,
            )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise ConnectorSourceError(f"Google Play reviews API failed for {package}: {exc}") from exc
        for review in payload.get("reviews", []):
            comments = review.get("comments") or []
            text = " ".join((comment.get("userComment") or {}).get("text", "") for comment in comments).strip()
            if not text:
                continue
            folded = text.casefold()
            if not any(term in folded for term in ("fake", "scam", "fraud", "otp", "stole", "phishing", "impersonat")):
                continue
            user_comment = (comments[-1].get("userComment") or {}) if comments else {}
            timestamp = user_comment.get("lastModified", {}).get("seconds")
            observed_at = datetime.fromtimestamp(int(timestamp), tz=timezone.utc) if timestamp else datetime.now(timezone.utc)
            review_id = review.get("reviewId")
            ingested.append(_ingest(
                session, tenant_id, brand, connector,
                surface="google_play", source_kind="mobile_app_review",
                external_id=f"play-review-{brand.id}-{package}-{review_id}",
                target_identifier=f"https://play.google.com/store/apps/details?id={package}",
                observed_at=observed_at,
                raw_payload={"provider": "google_play_android_publisher", "package_name": package, "review": review},
                normalized_attributes={"provider": "google_play_android_publisher", "review_text": text, "review_rating": user_comment.get("starRating"), "review_id": review_id},
            ))
    return ingested
