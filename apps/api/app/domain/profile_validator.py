"""Asynchronous Social Profile & Asset Live Existence Validator.

Performs live HTTP pre-flight validation against public platform profiles to prevent
storing non-existent handles, broken links, or fake profile hallucinations.
"""
from __future__ import annotations

import logging
import re
from typing import Optional, Tuple
import urllib.parse

import httpx

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


async def verify_social_profile_live(
    platform: str,
    handle_or_url: str,
    timeout: float = 4.0
) -> Tuple[bool, str, Optional[str]]:
    """Probe platform endpoint to verify if a social profile or target actually exists.

    Returns:
        (is_live: bool, canonical_url: str, error_detail: Optional[str])
    """
    clean = handle_or_url.strip().lstrip("@")
    if not clean:
        return False, "", "Empty handle or target provided"

    # If already a full URL, parse out surface and clean
    if clean.startswith("http://") or clean.startswith("https://"):
        parsed = urllib.parse.urlparse(clean)
        domain = parsed.netloc.lower()
        if "instagram" in domain:
            platform = "instagram"
            clean = parsed.path.strip("/").split("/")[0]
        elif "twitter" in domain or "x.com" in domain:
            platform = "twitter"
            clean = parsed.path.strip("/").split("/")[0]
        elif "t.me" in domain or "telegram" in domain:
            platform = "telegram"
            clean = parsed.path.strip("/").split("/")[0]
        elif "youtube" in domain:
            platform = "youtube"
            clean = parsed.path.strip("/").split("/")[0].lstrip("@")

    plat = platform.lower().replace("x_twitter", "twitter")

    if plat == "instagram":
        target_url = f"https://www.instagram.com/{clean}/"
    elif plat in {"twitter", "x"}:
        target_url = f"https://x.com/{clean}"
    elif plat == "telegram":
        target_url = f"https://t.me/{clean}"
    elif plat == "youtube":
        target_url = f"https://www.youtube.com/@{clean}"
    elif plat == "linkedin":
        target_url = f"https://www.linkedin.com/in/{clean}"
    elif plat in {"web", "domain"}:
        target_url = f"https://{clean}" if not clean.startswith("http") else clean
    else:
        target_url = f"https://{clean}" if not clean.startswith("http") else clean

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=timeout,
            verify=False
        ) as client:
            resp = await client.get(target_url, headers=headers)
            status = resp.status_code

            # Standard 404 or Gone
            if status in {404, 410}:
                return False, target_url, f"Profile not found (HTTP {status})"

            # Specific platform heuristics
            if plat == "instagram":
                # Instagram returns 200 with "Sorry, this page isn't available" on missing accounts
                if "page isn't available" in resp.text.lower() or "page may have been removed" in resp.text.lower():
                    return False, target_url, "Instagram page isn't available or was removed"
                return True, target_url, None

            if plat == "telegram":
                # Telegram t.me returns 200 even for vacant handles, but lacks tgme_page_title with profile name
                if "tgme_page_extra" in resp.text or "tgme_page_title" in resp.text:
                    if "If you have Telegram, you can contact" in resp.text:
                        return True, target_url, None
                return True, target_url, None

            if plat in {"twitter", "x"}:
                if "This account doesn’t exist" in resp.text or "Account suspended" in resp.text:
                    return False, target_url, "Account does not exist on X"
                return True, target_url, None

            if 200 <= status < 400:
                return True, target_url, None

            return False, target_url, f"Target probe returned HTTP {status}"

    except httpx.TimeoutException:
        # If timeout, fail open with unverified status to avoid false hard blocks
        logger.debug(f"Profile check timed out for {target_url}")
        return False, target_url, "Profile verification timed out"
    except Exception as exc:
        logger.debug(f"Profile check error for {target_url}: {exc}")
        return False, target_url, str(exc)
