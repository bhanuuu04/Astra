import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


async def search_brand_impersonation(
    brand_name: str,
    query_suffix: str = "support customer care update",
    max_results: int = 5,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Search YouTube for potential brand impersonation videos or deceptive channels."""
    key = api_key or get_settings().youtube_api_key
    query = f"{brand_name} {query_suffix}".strip()

    if not key:
        return _mock_youtube_results(brand_name, query)

    try:
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "order": "relevance",
            "key": key,
        }
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(YOUTUBE_SEARCH_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                items = []
                for item in data.get("items", []):
                    snippet = item.get("snippet", {})
                    video_id = item.get("id", {}).get("videoId")
                    desc = snippet.get("description", "")
                    
                    # Extract indicators like telegram links, phone numbers, or suspicious links in description
                    telegram_matches = re.findall(r't\.me/[a-zA-Z0-9_+]+', desc)
                    phone_matches = re.findall(r'\+?\d{10,12}', desc)
                    
                    risk_score = 40
                    if telegram_matches:
                        risk_score += 30
                    if phone_matches:
                        risk_score += 20

                    items.append({
                        "video_id": video_id,
                        "url": f"https://www.youtube.com/watch?v={video_id}" if video_id else "",
                        "title": snippet.get("title"),
                        "channel_title": snippet.get("channelTitle"),
                        "channel_id": snippet.get("channelId"),
                        "published_at": snippet.get("publishedAt"),
                        "description": desc,
                        "indicators": {
                            "telegrams": telegram_matches,
                            "phones": phone_matches,
                        },
                        "risk_score": min(risk_score, 99),
                    })
                return {
                    "source": "youtube_data_api_v3",
                    "is_live_api": True,
                    "query": query,
                    "total_found": len(items),
                    "items": items,
                }
            else:
                logger.warning(f"YouTube API returned {resp.status_code}: {resp.text}")
                return _mock_youtube_results(brand_name, query)
    except Exception as e:
        logger.warning(f"Error querying YouTube API: {e}")
        return _mock_youtube_results(brand_name, query)


def _mock_youtube_results(brand_name: str, query: str) -> Dict[str, Any]:
    """Realistic demonstration telemetry when YOUTUBE_API_KEY is not configured."""
    return {
        "source": "youtube_telemetry_simulator",
        "is_live_api": False,
        "query": query,
        "total_found": 2,
        "items": [
            {
                "video_id": "v_fake_ast01",
                "url": "https://www.youtube.com/watch?v=v_fake_ast01",
                "title": f"URGENT: How to verify your {brand_name} account without suspension (2026 Tutorial)",
                "channel_title": f"{brand_name} Official Support Global",
                "channel_id": "UC_fake_brand_help",
                "published_at": "2026-04-10T08:12:00Z",
                "description": f"Download the compliance update APK from https://astra-mobile-update.top or contact WhatsApp support: +91 98765 43210. Join our official Telegram: t.me/astra_support_bot",
                "indicators": {
                    "telegrams": ["t.me/astra_support_bot"],
                    "phones": ["+919876543210"],
                    "domains": ["astra-mobile-update.top"],
                },
                "risk_score": 92,
            },
            {
                "video_id": "v_fake_ast02",
                "url": "https://www.youtube.com/watch?v=v_fake_ast02",
                "title": f"{brand_name} Airdrop Claim Guide (Instant Deposit)",
                "channel_title": "Crypto Security Fast Desk",
                "channel_id": "UC_crypto_drainer",
                "published_at": "2026-04-09T14:30:00Z",
                "description": "Send test deposit to fraudster@okhdfcbank to unlock enterprise tier tokens.",
                "indicators": {
                    "telegrams": [],
                    "phones": [],
                    "upis": ["fraudster@okhdfcbank"],
                },
                "risk_score": 88,
            },
        ],
        "note": "Simulator data active (Provide YOUTUBE_API_KEY in .env for live Google Cloud queries).",
    }
