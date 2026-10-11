import hashlib
import hmac
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


def verify_webhook_signature(payload: bytes, signature_header: str, secret: Optional[str] = None) -> bool:
    """Verify Meta / Instagram X-Hub-Signature-256 header."""
    settings = get_settings()
    app_secret = secret or settings.meta_app_secret
    if not app_secret:
        logger.warning("Webhook verification rejected: meta_app_secret is not configured.")
        return False

    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected_hash = signature_header.split("sha256=")[-1]
    calculated = hmac.new(app_secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_hash, calculated)


async def get_instagram_user_metadata(user_id: str, access_token: Optional[str] = None) -> Dict[str, Any]:
    """Fetch authorized Instagram Business account metadata via Graph API."""
    token = access_token or get_settings().meta_page_access_token
    if not token:
        return {
            "source": "meta_graph_api_mock",
            "is_live_api": False,
            "user_id": user_id,
            "username": f"user_{user_id}",
            "name": "Simulated Instagram Account",
            "followers_count": 140,
            "is_verified": False,
            "note": "Local mock metadata. Configure META_PAGE_ACCESS_TOKEN for live Graph API sync.",
        }

    try:
        url = f"{GRAPH_API_BASE}/{user_id}"
        params = {
            "fields": "id,username,name,followers_count,biography,profile_picture_url",
            "access_token": token,
        }
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                data["source"] = "instagram_graph_api_live"
                data["is_live_api"] = True
                return data
            else:
                logger.warning(f"Meta Graph API error {resp.status_code}: {resp.text}")
                return {"error": resp.text, "status_code": resp.status_code}
    except Exception as e:
        logger.warning(f"Error calling Meta Graph API: {e}")
        return {"error": str(e), "is_live_api": False}


def normalize_meta_webhook_event(entry: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert an inbound Instagram webhook entry into normalized ASTRA sighting format."""
    normalized_sightings = []
    changes = entry.get("changes", [])
    for change in changes:
        value = change.get("value", {})
        sender_id = value.get("from", {}).get("id") or value.get("sender_id") or "actor_meta"
        sender_name = value.get("from", {}).get("username") or "unknown_handle"
        text = value.get("text") or value.get("message") or ""

        normalized_sightings.append({
            "surface": "instagram",
            "raw_ref": f"ig_event_{value.get('id', 'temp')}",
            "source_type": "meta_webhook",
            "normalized_payload": {
                "content": text,
                "sender": {
                    "id": str(sender_id),
                    "username": sender_name,
                    "platform": "instagram",
                },
                "field": change.get("field"),
                "created_time": value.get("created_time"),
            },
        })
    return normalized_sightings
