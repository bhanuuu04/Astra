from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple


def calculate_sighting_risk_score(
    signals: List[Dict[str, Any]],
    observed_at: datetime | None = None,
    reach_estimate: int = 100,
) -> Tuple[float, Dict[str, float]]:
    """
    Computes explainable risk score according to the engineering plan formula:
    risk = 100 * (0.35 * identity + 0.30 * harm + 0.20 * exposure + 0.15 * freshness)
    Returns (composite_score, feature_breakdown).
    """
    # 1. Identity Component (0.0 to 1.0)
    identity_signals = [s for s in signals if s.get("detector_key") in (
        "brand_impersonation", "executive_impersonation", "deceptive_verification"
    )]
    if identity_signals:
        identity_score = max(s["score"] for s in identity_signals)
    else:
        identity_score = 0.0

    # 2. Harm Component (0.0 to 1.0)
    harm_signals = [s for s in signals if s.get("detector_key") in (
        "counterfeit_mobile_app", "credential_harvesting", "cryptocurrency_scam", "phishing_domain_tld"
    )]
    if harm_signals:
        harm_score = max(s["score"] for s in harm_signals)
    else:
        harm_score = 0.1 if signals else 0.0

    # 3. Exposure Component (0.0 to 1.0)
    if reach_estimate >= 5000:
        exposure_score = 1.0
    elif reach_estimate >= 1000:
        exposure_score = 0.7
    elif reach_estimate >= 100:
        exposure_score = 0.4
    else:
        exposure_score = 0.2

    # 4. Freshness Component (0.0 to 1.0) - Exponential decay
    if observed_at:
        if observed_at.tzinfo is None:
            observed_at = observed_at.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        diff_hours = max(0.0, (now - observed_at).total_seconds() / 3600.0)
        if diff_hours < 24:
            freshness_score = 1.0
        elif diff_hours < 72:
            freshness_score = 0.75
        elif diff_hours < 168:  # 7 days
            freshness_score = 0.50
        else:
            freshness_score = 0.25
    else:
        freshness_score = 0.9

    composite = 100.0 * (
        (0.35 * identity_score) +
        (0.30 * harm_score) +
        (0.20 * exposure_score) +
        (0.15 * freshness_score)
    )

    score_val = min(100.0, max(0.0, round(composite, 1)))

    features = {
        "identity_similarity": round(identity_score, 2),
        "harm_weight": round(harm_score, 2),
        "exposure": round(exposure_score, 2),
        "freshness": round(freshness_score, 2),
    }

    return score_val, features
