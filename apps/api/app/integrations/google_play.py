"""Android Publisher API access for customer-owned, enrolled applications."""
from __future__ import annotations

from typing import Any, Optional
from urllib.parse import quote

import httpx

from app.integrations.connector_sources import ConnectorSourceError, google_play_access_token


def inspect_app_listing(
    package_name: str,
    brand_name: str,
    service_account_json: Optional[str] = None,
) -> dict[str, Any]:
    """Fetch actual recent reviews for an app accessible to the configured account.

    The Android Publisher API is scoped to apps a developer account can access;
    it is not a public Play Store search API.
    """
    if not service_account_json:
        raise ConnectorSourceError("Google Play service-account credentials are not configured.")
    token = google_play_access_token(service_account_json)
    try:
        response = httpx.get(
            f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{quote(package_name, safe='')}/reviews",
            params={"maxResults": 100},
            headers={"authorization": f"Bearer {token}"},
            timeout=15.0,
        )
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPError as exc:
        raise ConnectorSourceError(f"Google Play review lookup failed for {package_name}: {exc}") from exc

    reviews = []
    for review in payload.get("reviews", []):
        comments = review.get("comments") or []
        user_comment = (comments[-1].get("userComment") or {}) if comments else {}
        text = user_comment.get("text", "")
        lowered = text.casefold()
        indicators = [word for word in ("fake", "scam", "fraud", "otp", "stole", "phishing", "impersonat") if word in lowered]
        reviews.append({
            "review_id": review.get("reviewId"),
            "text": text,
            "star_rating": user_comment.get("starRating"),
            "language": user_comment.get("reviewerLanguage"),
            "last_modified": user_comment.get("lastModified"),
            "risk_indicators": indicators,
        })

    return {
        "source": "google_play_android_publisher_api",
        "is_live_api": True,
        "package_name": package_name,
        "target_brand": brand_name,
        "reviews_analyzed": len(reviews),
        "reviews": reviews,
        "note": "Reviews are available only for apps the configured Android Publisher account can access; this endpoint does not search public Play listings.",
    }
