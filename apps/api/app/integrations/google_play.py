import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def inspect_app_listing(
    package_name: str,
    brand_name: str,
    service_account_json: Optional[str] = None,
) -> Dict[str, Any]:
    """Inspect an Android application listing for impersonation and review sentiment anomalies."""
    is_brand_mimic = brand_name.lower().replace(" ", "") in package_name.lower().replace(".", "")
    is_rogue = "fake" in package_name.lower() or "patch" in package_name.lower() or "updater" in package_name.lower()

    # Suspicious user reviews flags
    mock_reviews = [
        {"user": "Rahul K.", "rating": 1, "comment": "Beware! This app asked for my bank UPI PIN and SMS OTP. Completely fake!", "sentiment": "fraud_alert"},
        {"user": "Sneha M.", "rating": 1, "comment": "Not official Astra! Lost funds right after installation.", "sentiment": "fraud_alert"},
        {"user": "BotUser_99", "rating": 5, "comment": "Very fast update, solved my account suspension instantly.", "sentiment": "inorganic_promotion"},
    ]

    scam_keywords = ["fake", "beware", "lost", "stole", "otp", "pin", "scam", "fraud"]
    fraud_review_count = sum(
        1 for r in mock_reviews if any(kw in r["comment"].lower() for kw in scam_keywords)
    )

    risk_score = 30
    if is_brand_mimic:
        risk_score += 35
    if is_rogue:
        risk_score += 25
    if fraud_review_count > 0:
        risk_score += 10

    return {
        "source": "google_play_analyzer",
        "package_name": package_name,
        "target_brand": brand_name,
        "is_official_developer": False if is_rogue else True,
        "risk_score": min(risk_score, 99),
        "verdict": "high_risk_impersonation" if risk_score >= 80 else "benign",
        "reviews_analyzed": len(mock_reviews),
        "fraud_review_ratio": f"{fraud_review_count}/{len(mock_reviews)}",
        "suspicious_reviews": mock_reviews,
        "recommendation": "File Google Play Protect takedown notice and add SHA-256 to malicious APK blacklist." if risk_score >= 80 else "Monitor for unauthorized package updates.",
    }
