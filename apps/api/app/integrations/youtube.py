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

    if not key or key.startswith(("test_", "mock_")):
        raise ValueError("A real YouTube Data API key is required; ASTRA does not return simulated search results from the live scan endpoint.")

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
                logger.warning(f"YouTube API returned status {resp.status_code}.")
                raise ValueError(f"YouTube Data API request failed with status {resp.status_code}.")
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        logger.warning("Error querying YouTube API; no simulated results returned.")
        raise ValueError("YouTube Data API request failed due to a network error. Check provider status and API credentials.") from e
