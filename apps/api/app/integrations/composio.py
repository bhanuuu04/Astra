"""Composio Provider Integration for Live Social Telemetry Sync.

Interacts with Composio API to discover connected accounts, fetch live
messages / events, and transform them into normalized ASTRA sightings.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

import httpx

from app.core.config import get_settings
from app.db.models import Brand, Sighting
from app.schemas.sighting import SightingCreate

logger = logging.getLogger(__name__)

COMPOSIO_BASE_URL = "https://backend.composio.dev"


async def fetch_user_connected_accounts(user_id: Optional[str] = None, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve active connected accounts for a given Composio user_id / entity."""
    key = api_key or get_settings().composio_api_key
    if not key:
        logger.warning("Composio API key is not configured.")
        return []

    headers = {
        "x-api-key": key,
        "Accept": "application/json",
    }

    try:
        url = f"{COMPOSIO_BASE_URL}/api/v3.1/connected_accounts"
        params = {"user_ids": user_id} if user_id else {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items") or data.get("connected_accounts") or []
                return [item for item in items if item.get("status") in ("ACTIVE", "INITIALIZED", "CONNECTED")]
            logger.warning(f"Composio connected_accounts returned {resp.status_code}: {resp.text}")
    except Exception as exc:
        logger.warning(f"Error fetching Composio connected accounts: {exc}")

    return []


async def execute_composio_action(
    action_name: str,
    params: Dict[str, Any],
    connected_account_id: Optional[str] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute an action via Composio Action Execution API (e.g. SEARCH_RECENT_TWEETS, GET_USER_MESSAGES)."""
    key = api_key or get_settings().composio_api_key
    if not key:
        return {"error": "Missing Composio API key"}

    headers = {
        "x-api-key": key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    body: Dict[str, Any] = {"input": params}
    if connected_account_id:
        body["connectedAccountId"] = connected_account_id

    try:
        url = f"{COMPOSIO_BASE_URL}/api/v1/actions/{action_name}/execute"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=body, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 404:
                url_v3 = f"{COMPOSIO_BASE_URL}/api/v3/actions/{action_name}/execute"
                resp_v3 = await client.post(url_v3, json=body, headers=headers)
                if resp_v3.status_code == 200:
                    return resp_v3.json()
            logger.info(f"Composio execute action {action_name} HTTP {resp.status_code}: {resp.text}")
            return {"error": f"HTTP {resp.status_code}", "detail": resp.text}
    except Exception as exc:
        logger.warning(f"Composio execute action error: {exc}")
        return {"error": str(exc)}


async def sync_composio_live_messages(
    user_id: Optional[str] = None,
    brand: Optional[Brand] = None,
    api_key: Optional[str] = None,
) -> List[SightingCreate]:
    """Pull live activity & inbound messages from connected Composio accounts and actions."""
    key = api_key or get_settings().composio_api_key
    if not key:
        return []

    brand_name = brand.name if brand else "Brand"
    brand_id = brand.id if brand else None

    accounts = await fetch_user_connected_accounts(user_id, key)
    discovered_sightings: List[SightingCreate] = []

    # 1. Process active connected accounts
    for acc in accounts:
        toolkit = (acc.get("toolkit") or {}).get("slug") or acc.get("app_unique_id") or "social"
        acc_id = acc.get("id")
        surface = toolkit.lower()
        if "instagram" in surface:
            surface = "instagram"
        elif "twitter" in surface or "x" in surface:
            surface = "twitter"
        elif "linkedin" in surface:
            surface = "linkedin"
        elif "facebook" in surface:
            surface = "facebook"
        elif "youtube" in surface:
            surface = "youtube"

        username = (acc.get("data") or {}).get("username") or (acc.get("params") or {}).get("user_name") or brand_name.lower()
        target_ref = f"composio://{surface}/{acc_id}"

        # Baseline connected stream sighting
        discovered_sightings.append(
            SightingCreate(
                brand_id=brand_id,
                surface=surface,
                source_kind="direct_message",
                observed_at=datetime.now(timezone.utc),
                raw_ref=target_ref,
                content=f"Connected channel security stream active for official @{username} via Composio OAuth broker.",
                normalized_payload={
                    "surface": surface,
                    "connected_account_id": acc_id,
                    "source": "composio_oauth_stream",
                    "status": "monitored_live",
                    "sender": {
                        "username": username,
                        "platform": surface,
                    },
                    "threat_analysis": {
                        "summary": f"Live perimeter channel {surface.upper()} monitored under {brand_name}.",
                        "severity": "LOW",
                        "risk_score": 12,
                        "recommended_action": "active_monitoring",
                    },
                },
            )
        )

        # 2. Attempt fetching recent messages or tweets via Composio action execution
        if surface in ("twitter", "x"):
            search_res = await execute_composio_action(
                "TWITTER_SEARCH_RECENT_TWEETS",
                {"query": f'"{brand_name}" support OR help OR verify', "max_results": 10},
                connected_account_id=acc_id,
                api_key=key,
            )
            raw_tweets = (
                (search_res.get("data") or {}).get("data")
                or search_res.get("tweets")
                or search_res.get("results")
                or []
            )
            if isinstance(raw_tweets, list):
                for tw in raw_tweets:
                    t_text = tw.get("text") or tw.get("content") or ""
                    t_id = tw.get("id") or str(uuid.uuid4())[:8]
                    author_id = tw.get("author_id") or "inbound_user"
                    discovered_sightings.append(
                        SightingCreate(
                            brand_id=brand_id,
                            surface="twitter",
                            source_kind="post",
                            observed_at=datetime.now(timezone.utc),
                            raw_ref=f"https://x.com/i/status/{t_id}",
                            content=t_text,
                            normalized_payload={
                                "surface": "twitter",
                                "tweet_id": t_id,
                                "source": "composio_twitter_sync",
                                "sender": {"username": str(author_id), "platform": "twitter"},
                                "threat_analysis": {
                                    "summary": f"Inbound message referencing {brand_name} captured via Composio live sync.",
                                    "severity": "MEDIUM",
                                    "risk_score": 45,
                                    "recommended_action": "triage",
                                },
                            },
                        )
                    )

    # 3. If no connected accounts yet, query Composio actions directly for public brand mentions
    if not accounts:
        search_res = await execute_composio_action(
            "TWITTER_SEARCH_RECENT_TWEETS",
            {"query": f'"{brand_name}" support OR help OR verify', "max_results": 5},
            api_key=key,
        )
        raw_tweets = (
            (search_res.get("data") or {}).get("data")
            or search_res.get("tweets")
            or search_res.get("results")
            or []
        )
        if isinstance(raw_tweets, list) and raw_tweets:
            for tw in raw_tweets:
                t_text = tw.get("text") or tw.get("content") or ""
                t_id = tw.get("id") or str(uuid.uuid4())[:8]
                author_id = tw.get("author_id") or "inbound_user"
                discovered_sightings.append(
                    SightingCreate(
                        brand_id=brand_id,
                        surface="twitter",
                        source_kind="post",
                        observed_at=datetime.now(timezone.utc),
                        raw_ref=f"https://x.com/i/status/{t_id}",
                        content=t_text,
                        normalized_payload={
                            "surface": "twitter",
                            "tweet_id": t_id,
                            "source": "composio_action_feed",
                            "sender": {"username": str(author_id), "platform": "twitter"},
                            "threat_analysis": {
                                "summary": f"Inbound brand query captured via Composio live radar.",
                                "severity": "MEDIUM",
                                "risk_score": 40,
                                "recommended_action": "triage",
                            },
                        },
                    )
                )

    return discovered_sightings
