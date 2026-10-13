from typing import Any, Dict, List, Optional
import urllib.parse

from app.db.models import Brand, BrandAsset, Sighting
from app.detectors.rules import (
    CREDENTIAL_HARVEST_TRIGGERS,
    HIGH_RISK_TLDS,
    ROGUE_APP_TRIGGERS,
    URGENCY_TRIGGERS,
    URL_SHORTENERS,
    calculate_similarity,
    detect_lookalike_variations,
    extract_crypto_wallets,
    extract_urls,
    normalize_homoglyphs,
)

DETECTOR_VERSION = "1.0.0"


def run_detectors_on_sighting(
    sighting: Sighting,
    brand: Brand,
    brand_assets: List[BrandAsset],
) -> List[Dict[str, Any]]:
    """
    Executes the versioned detector suite against authoritative Brand DNA.
    Returns a list of candidate Signal dictionaries.
    """
    signals: List[Dict[str, Any]] = []

    payload = sighting.normalized_payload or {}
    content = payload.get("content", "")
    sender = payload.get("sender") or {}
    content_lower = content.lower()

    # Pre-extract Brand DNA parameters
    brand_name = brand.name
    normalized_brand_name = normalize_homoglyphs(brand_name)
    official_domains = [a.canonical_value.lower() for a in brand_assets if a.asset_type in ("domain", "web_domain")]
    
    # Support both canonical "social_handle" and legacy "handle", with platform awareness
    official_social_assets = []
    for a in brand_assets:
        if a.asset_type in ("handle", "social_handle"):
            raw_val = a.canonical_value.lower()
            platform = None
            if ":" in raw_val:
                platform, handle = raw_val.split(":", 1)
            else:
                handle = raw_val.lstrip("@")
                if a.asset_metadata and isinstance(a.asset_metadata, dict):
                    platform = a.asset_metadata.get("platform")
            official_social_assets.append({
                "platform": platform.lower().replace("x_twitter", "twitter") if platform else None,
                "handle": handle.strip().lower().lstrip("@"),
                "asset": a,
            })
    
    # Support both canonical "mobile_app_pkg" and legacy "mobile_app"
    official_apps = [a.canonical_value.lower() for a in brand_assets if a.asset_type in ("mobile_app", "mobile_app_pkg")]
    protected_executives = [a.canonical_value for a in brand_assets if a.asset_type == "executive"]

    # -------------------------------------------------------------------------
    # 1. Brand Impersonation & Homoglyphs
    # -------------------------------------------------------------------------
    username = sender.get("username", "")
    display_name = sender.get("displayName", "")
    normalized_user = normalize_homoglyphs(username)
    normalized_display = normalize_homoglyphs(display_name)
    clean_user = username.strip().lower().lstrip("@")
    sighting_surface = (sighting.surface or payload.get("surface") or "").lower().replace("x_twitter", "twitter")

    # Platform-aware exact identity match for official accounts
    matched_official_social = None
    if clean_user:
        for item in official_social_assets:
            if item["handle"] == clean_user:
                # If platform is restricted on the asset, verify sighting is on the same platform
                if item["platform"] and sighting_surface:
                    if item["platform"] in sighting_surface or sighting_surface in item["platform"]:
                        matched_official_social = item
                        break
                else:
                    matched_official_social = item
                    break

    if matched_official_social:
        signals.append({
            "detector_key": "official_asset_match",
            "detector_version": DETECTOR_VERSION,
            "score": 0.0,
            "threshold": 0.65,
            "explanation": (
                f"Candidate username '@{username}' matches verified official brand account "
                f"({matched_official_social['asset'].canonical_value}). Excluded from brand impersonation."
            ),
            "evidence_ids": [f"official:@{username}"],
            "feature_values": {
                "is_official_asset": True,
                "asset_type": "social_handle",
                "matched_handle": clean_user,
                "surface": sighting_surface,
            },
        })
    elif username or display_name:
        # Run rigorous lookalike variation analysis (swaps, added words, spacing, benign decoys)
        user_lookalike = detect_lookalike_variations(username, brand_name, content)
        display_lookalike = detect_lookalike_variations(display_name, brand_name, content)
        
        is_benign = user_lookalike.get("is_benign_decoy") or display_lookalike.get("is_benign_decoy")
        detected_variations = list(set(user_lookalike.get("variations", []) + display_lookalike.get("variations", [])))
        matched_added_words = list(set(user_lookalike.get("matched_added_words", []) + display_lookalike.get("matched_added_words", [])))
        
        similarity = max(
            calculate_similarity(normalized_user, normalized_brand_name),
            calculate_similarity(normalized_display, normalized_brand_name),
        )
        brand_tokens = [normalize_homoglyphs(w) for w in brand_name.split() if len(w) >= 3]
        has_direct_name = (
            normalized_brand_name in normalized_user
            or normalized_brand_name in normalized_display
            or any(tok in normalized_user or tok in normalized_display for tok in brand_tokens)
        )

        spoof_keywords = ["support", "help", "desk", "official", "verify", "security", "team"]
        matched_spoofs = [k for k in spoof_keywords if k in username.lower() or k in display_name.lower()]

        if is_benign:
            # Benign decoy guard: legitimate non-infringing business (e.g. Nova Pay Plumbing)
            # Downgrade score to benign level (0.15) to guarantee no false alarms
            signals.append({
                "detector_key": "benign_decoy_guard",
                "detector_version": DETECTOR_VERSION,
                "score": 0.15,
                "threshold": 0.65,
                "explanation": (
                    f"Candidate contains brand token '{brand_name}' but matches benign business pattern "
                    f"({', '.join(user_lookalike.get('details', []) + display_lookalike.get('details', []))}). "
                    f"Suppressed from threat escalation."
                ),
                "evidence_ids": [f"benign:@{username}"],
                "feature_values": {
                    "is_benign_decoy": True,
                    "similarity": similarity,
                    "suppressed": True,
                },
            })
        elif has_direct_name or similarity >= 70 or detected_variations:
            score = 0.95 if (has_direct_name and (matched_spoofs or "ADDED_WORD" in detected_variations)) else 0.85
            if "CHARACTER_SWAP" in detected_variations:
                score = 0.92

            variation_summary = f" [Variations: {', '.join(detected_variations)}]" if detected_variations else ""
            signals.append({
                "detector_key": "brand_impersonation",
                "detector_version": DETECTOR_VERSION,
                "score": score,
                "threshold": 0.65,
                "explanation": (
                    f"Sender mimics brand '{brand_name}' using lookalike pattern{variation_summary} "
                    f"(Username: @{username}, Similarity: {similarity}%)."
                ),
                "evidence_ids": [f"sender:@{username}"],
                "feature_values": {
                    "similarity": similarity,
                    "matched_spoofs": matched_spoofs,
                    "normalized_username": normalized_user,
                    "variations": detected_variations,
                    "matched_added_words": matched_added_words,
                    "is_character_swap": "CHARACTER_SWAP" in detected_variations,
                    "is_spacing_change": "SPACING_CHANGE" in detected_variations,
                    "is_added_word": "ADDED_WORD" in detected_variations,
                },
            })

    # -------------------------------------------------------------------------
    # 2. Executive / VIP Shield
    # -------------------------------------------------------------------------
    for exec_entry in protected_executives:
        # e.g. "Alex Mercer (CISO)" -> "alexmercer"
        exec_name = exec_entry.split("(")[0].strip()
        norm_exec = normalize_homoglyphs(exec_name)
        if norm_exec and (norm_exec in normalized_user or norm_exec in normalized_display):
            signals.append({
                "detector_key": "executive_impersonation",
                "detector_version": DETECTOR_VERSION,
                "score": 0.98,
                "threshold": 0.60,
                "explanation": f"High-confidence VIP impersonation targeting protected leadership: '{exec_entry}'.",
                "evidence_ids": [f"executive:{exec_name}"],
                "feature_values": {"target_executive": exec_entry, "matched_display": display_name},
            })
            break

    # -------------------------------------------------------------------------
    # 3. Deceptive Verification Badges
    # -------------------------------------------------------------------------
    fake_badges = ["✓", "✔", "☑️", "✅", "verified"]
    has_fake_badge = any(b in display_name for b in fake_badges)
    is_verified = bool(sender.get("isVerifiedBadge"))
    if has_fake_badge and not is_verified:
        signals.append({
            "detector_key": "deceptive_verification",
            "detector_version": DETECTOR_VERSION,
            "score": 0.80,
            "threshold": 0.50,
            "explanation": f"Sender employs unicode verification symbols ('{display_name}') to mimic official account status.",
            "evidence_ids": [f"badge_spoof:{display_name}"],
            "feature_values": {"display_name": display_name, "verified_status": is_verified},
        })

    # -------------------------------------------------------------------------
    # 4. Burner / Bot Velocity
    # -------------------------------------------------------------------------
    following = sender.get("followingCount", 0)
    followers = sender.get("followerCount", 0)
    if following > 300 and followers < 30:
        signals.append({
            "detector_key": "burner_account_velocity",
            "detector_version": DETECTOR_VERSION,
            "score": 0.70,
            "threshold": 0.55,
            "explanation": f"Extreme burner bot ratio detected: follows {following} accounts with only {followers} followers.",
            "evidence_ids": [f"ratio:{following}/{followers}"],
            "feature_values": {"following": following, "followers": followers},
        })

    # -------------------------------------------------------------------------
    # 5. Phishing URLs, Lookalike Domains & High-Risk TLDs
    # -------------------------------------------------------------------------
    urls = extract_urls(content)
    for raw_url in urls:
        parsed = urllib.parse.urlparse(raw_url)
        hostname = parsed.netloc.lower()

        is_suspicious_tld = any(hostname.endswith(tld) for tld in HIGH_RISK_TLDS)
        is_shortener = any(short in hostname for short in URL_SHORTENERS)
        is_spoofed_domain = (normalized_brand_name in hostname or "astra" in hostname) and not any(
            d in hostname for d in official_domains
        )

        if is_spoofed_domain or is_suspicious_tld or is_shortener:
            reason = "Lookalike domain impersonating brand" if is_spoofed_domain else "High-risk malicious TLD or masked redirector"
            signals.append({
                "detector_key": "phishing_domain_tld",
                "detector_version": DETECTOR_VERSION,
                "score": 0.92 if is_spoofed_domain else 0.78,
                "threshold": 0.50,
                "explanation": f"{reason}: {raw_url}",
                "evidence_ids": [raw_url],
                "feature_values": {
                    "url": raw_url,
                    "domain": hostname,
                    "is_spoof": is_spoofed_domain,
                    "is_shortener": is_shortener,
                },
            })

    # -------------------------------------------------------------------------
    # 6. Counterfeit Mobile App / Rogue APK
    # -------------------------------------------------------------------------
    matched_official_app = False
    pkg_id = (payload.get("package_name") or payload.get("app_id") or sighting.raw_ref or "").lower()
    if official_apps and pkg_id:
        for off_app in official_apps:
            if off_app and (off_app == pkg_id or off_app in pkg_id or f"id={off_app}" in pkg_id):
                matched_official_app = True
                break

    if matched_official_app:
        signals.append({
            "detector_key": "official_asset_match",
            "detector_version": DETECTOR_VERSION,
            "score": 0.0,
            "threshold": 0.65,
            "explanation": f"Mobile app package matches registered official brand application ({pkg_id}). Excluded from rogue app detection.",
            "evidence_ids": [f"official_app:{pkg_id}"],
            "feature_values": {
                "is_official_asset": True,
                "asset_type": "mobile_app_pkg",
                "matched_package": pkg_id,
            },
        })
    else:
        contains_apk = ".apk" in content_lower or ".ipa" in content_lower
        matched_app_triggers = [t for t in ROGUE_APP_TRIGGERS if t in content_lower]
        if contains_apk or len(matched_app_triggers) >= 2:
            signals.append({
                "detector_key": "counterfeit_mobile_app",
                "detector_version": DETECTOR_VERSION,
                "score": 0.96,
                "threshold": 0.60,
                "explanation": "Active distribution of unauthorized mobile application (trojanized APK / update) mimicking official brand software.",
                "evidence_ids": [f"apk_payload:{content[:80]}"],
                "feature_values": {"matched_triggers": matched_app_triggers, "contains_apk": contains_apk},
            })

    # -------------------------------------------------------------------------
    # 7. Social Engineering & Urgency Coercion
    # -------------------------------------------------------------------------
    matched_urgency = [t for t in URGENCY_TRIGGERS if t in content_lower]
    if matched_urgency:
        signals.append({
            "detector_key": "social_engineering_urgency",
            "detector_version": DETECTOR_VERSION,
            "score": 0.75,
            "threshold": 0.50,
            "explanation": f"Coercive urgency detected common in account takeover extortion: {matched_urgency}",
            "evidence_ids": [f"urgency:{', '.join(matched_urgency)}"],
            "feature_values": {"matched_urgency": matched_urgency},
        })

    # -------------------------------------------------------------------------
    # 8. Credential Harvesting & 2FA Theft
    # -------------------------------------------------------------------------
    matched_harvest = [t for t in CREDENTIAL_HARVEST_TRIGGERS if t in content_lower]
    if matched_harvest:
        signals.append({
            "detector_key": "credential_harvesting",
            "detector_version": DETECTOR_VERSION,
            "score": 0.94,
            "threshold": 0.55,
            "explanation": f"Explicit solicitation of credentials or authentication tokens: {matched_harvest}",
            "evidence_ids": [f"harvest_triggers:{', '.join(matched_harvest)}"],
            "feature_values": {"matched_harvest": matched_harvest},
        })

    # -------------------------------------------------------------------------
    # 9. Cryptocurrency Scams & Drainers
    # -------------------------------------------------------------------------
    wallets = extract_crypto_wallets(content)
    if wallets:
        signals.append({
            "detector_key": "cryptocurrency_scam",
            "detector_version": DETECTOR_VERSION,
            "score": 0.88,
            "threshold": 0.50,
            "explanation": f"Unsolicited crypto wallet address injection (financial drainer risk): {wallets}",
            "evidence_ids": wallets,
            "feature_values": {"wallets": wallets},
        })

    return signals
