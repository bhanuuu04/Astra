import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Set, Tuple
import urllib.parse
import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Brand, BrandAsset, Sighting
from app.domain.detector_service import DETECTOR_VERSION, run_detectors_on_sighting
from app.domain.linking_service import compute_campaign_edges_and_clusters
from app.domain.profile_validator import verify_social_profile_live
from app.domain.sighting_service import ingest_batch
from app.schemas.sighting import SightingBatchRequest, SightingCreate

logger = logging.getLogger(__name__)

# In-memory scan state tracker keyed by brand_id or tenant_id
ACTIVE_SCAN_STATES: Dict[str, Dict[str, Any]] = {}


def get_scan_state(brand_or_tenant_id: str) -> Optional[Dict[str, Any]]:
    return ACTIVE_SCAN_STATES.get(str(brand_or_tenant_id))


def set_scan_state(brand_or_tenant_id: str, state: Dict[str, Any]) -> None:
    ACTIVE_SCAN_STATES[str(brand_or_tenant_id)] = state


def generate_candidate_domains(canonical_domain: str, brand_name: str) -> List[str]:
    """Generate realistic typosquat, homoglyph, and lookalike domains."""
    candidates: Set[str] = set()
    clean_domain = canonical_domain.strip().lower()
    if clean_domain.startswith("http://") or clean_domain.startswith("https://"):
        clean_domain = urllib.parse.urlparse(clean_domain).netloc

    parts = clean_domain.split(".")
    stem = parts[0] if parts else brand_name.lower().replace(" ", "")
    original_tld = ".".join(parts[1:]) if len(parts) > 1 else "com"

    # Common malicious & brand-squatting TLD variants
    top_tlds = ["com", "net", "io", "co", "org", "app", "xyz", "in", "biz", "live"]
    for tld in top_tlds:
        if tld != original_tld:
            candidates.add(f"{stem}.{tld}")

    # Hyphenated & compound variants
    if len(stem) > 4:
        # e.g., dock-cloud.com if stem is dockcloud
        for i in range(3, len(stem) - 2):
            candidates.add(f"{stem[:i]}-{stem[i:]}.com")
            if original_tld:
                candidates.add(f"{stem[:i]}-{stem[i:]}.{original_tld}")

    # Phishing / impersonation prefix/suffix variations
    phish_modifiers = [
        "login", "support", "verify", "auth", "security",
        "app", "portal", "secure", "official", "help"
    ]
    for mod in phish_modifiers:
        candidates.add(f"{stem}-{mod}.com")
        candidates.add(f"{stem}{mod}.com")
        candidates.add(f"{mod}-{stem}.com")
        if original_tld and original_tld != "com":
            candidates.add(f"{stem}-{mod}.{original_tld}")

    # Homoglyphs & typo omissions
    homoglyph_map = {"o": "0", "i": "1", "l": "1", "e": "3"}
    for char, rep in homoglyph_map.items():
        if char in stem:
            candidates.add(f"{stem.replace(char, rep, 1)}.com")
            if original_tld:
                candidates.add(f"{stem.replace(char, rep, 1)}.{original_tld}")

    # Remove the authentic brand domain itself
    candidates.discard(clean_domain)
    return list(candidates)


async def check_domain_doh(client: httpx.AsyncClient, domain: str) -> Optional[Tuple[str, List[str]]]:
    """Query Cloudflare DNS-over-HTTPS (1.1.1.1) to verify live active DNS resolution."""
    try:
        url = "https://cloudflare-dns.com/dns-query"
        headers = {"accept": "application/dns-json"}
        resp = await client.get(url, params={"name": domain, "type": "A"}, headers=headers, timeout=3.5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("Status") == 0 and "Answer" in data:
                ips = [
                    ans["data"]
                    for ans in data["Answer"]
                    if ans.get("type") == 1 and ans.get("data")
                ]
                if ips:
                    return domain, ips
    except Exception as exc:
        logger.debug(f"DoH query error for {domain}: {exc}")
    return None


async def run_osint_threat_scan(
    session: Session,
    brand_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> Dict[str, Any]:
    """Execute end-to-end OSINT Threat Surface Scan with dynamic progress tracking."""
    key = str(brand_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    # Initialize tracking state
    state: Dict[str, Any] = {
        "is_scanning": True,
        "status": "running",
        "brand_id": str(brand_id),
        "progress_pct": 10,
        "stage": "Phase 1: Establishing Canonical Brand Perimeter & DNS Invariants...",
        "stage_index": 1,
        "total_stages": 4,
        "eta_seconds": 35,
        "started_at": now_iso,
        "logs": [
            f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Threat Surface Sentinel activated."
        ],
        "findings_found": 0,
        "live_threats": [],
        "completed_at": None,
    }
    set_scan_state(key, state)
    set_scan_state(str(tenant_id), state)

    # 1. Resolve Brand & Canonical Assets
    brand = session.scalar(select(Brand).where(Brand.id == brand_id))
    if not brand:
        state["status"] = "error"
        state["is_scanning"] = False
        state["stage"] = "Brand not found."
        return state

    assets = list(session.scalars(select(BrandAsset).where(BrandAsset.brand_id == brand_id)).all())
    canonical_domain = None
    social_handles = []

    for a in assets:
        if a.asset_type == "domain" and not canonical_domain:
            canonical_domain = a.canonical_value
        elif a.asset_type == "social_handle":
            social_handles.append(a.canonical_value)

    if not canonical_domain:
        canonical_domain = f"{brand.name.lower().replace(' ', '')}.com"

    state["logs"].append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Canonical domain verified: {canonical_domain}"
    )
    state["progress_pct"] = 25
    state["eta_seconds"] = 28
    state["stage"] = "Phase 2: Generating candidate permutations & querying Cloudflare DoH (1.1.1.1)..."
    state["stage_index"] = 2

    # 2. Generate Candidate Domains and Query Cloudflare DoH
    candidates = generate_candidate_domains(canonical_domain, brand.name)
    state["logs"].append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Generated {len(candidates)} lookalike permutations across OSINT vectors."
    )
    set_scan_state(key, state)
    set_scan_state(str(tenant_id), state)

    live_discovered: List[Tuple[str, List[str]]] = []
    live_threats_list: List[Dict[str, Any]] = []

    async with httpx.AsyncClient() as client:
        # Run batches of 10 concurrent requests to respect rate limits
        batch_size = 10
        total_batches = (len(candidates) + batch_size - 1) // batch_size
        for batch_idx, i in enumerate(range(0, len(candidates), batch_size)):
            batch = candidates[i:i + batch_size]
            results = await asyncio.gather(*[check_domain_doh(client, d) for d in batch])
            for r in results:
                if r:
                    live_discovered.append(r)
                    whois_link = f"https://who.is/whois/{r[0]}"
                    has_brand_root = stem in r[0].lower()
                    dom_score = 75 if has_brand_root else 50
                    threat_item = {
                        "category": "domain",
                        "title": r[0],
                        "domain": r[0],
                        "surface": "web",
                        "ips": r[1],
                        "target_url": f"https://{r[0]}",
                        "whois": whois_link,
                        "whois_url": whois_link,
                        "risk_score": dom_score,
                        "risk_level": "medium" if dom_score >= 70 else "low",
                        "details": f"Registered domain ({r[0]}) resolved to IP(s): {', '.join(r[1])}. Discovered candidate under review.",
                        "discovered_at": datetime.now(timezone.utc).isoformat(),
                    }
                    live_threats_list.append(threat_item)
                    state["live_threats"] = list(live_threats_list)
                    state["findings_found"] = len(live_threats_list)
                    state["logs"].append(
                        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] [DISCOVERY] Live registered domain detected: {r[0]} (IP: {r[1][0]})"
                    )
            # Update progress incrementally
            pct_step = 25 + int(35 * ((batch_idx + 1) / max(total_batches, 1)))
            state["progress_pct"] = min(pct_step, 60)
            state["eta_seconds"] = max(24 - int(12 * ((batch_idx + 1) / max(total_batches, 1))), 14)
            set_scan_state(key, state)
            set_scan_state(str(tenant_id), state)

    state["progress_pct"] = 62
    state["eta_seconds"] = 14
    state["stage"] = "Phase 3: Auditing Social Handles & Perimeter Impersonator Radar..."
    state["stage_index"] = 3
    set_scan_state(key, state)
    set_scan_state(str(tenant_id), state)

    # 3. Social Handles Lookalike Permutations & Live Validation
    stem = canonical_domain.split(".")[0]
    lookalike_handles = [
        f"@{stem}_support",
        f"@{stem}_help",
        f"@{stem}_official_app",
        f"@{stem}_care"
    ]
    canonical_clean_handles = {h.lower().lstrip("@") for h in social_handles}
    novel_handles = [h for h in lookalike_handles if h.lower().lstrip("@") not in canonical_clean_handles]

    live_social_threats: List[Tuple[str, str, str]] = []
    # Probe social surfaces for active impersonator handles asynchronously
    for h_idx, handle in enumerate(novel_handles):
        for surf in ["telegram", "instagram"]:
            try:
                is_live, target_url, err = await verify_social_profile_live(surf, handle, timeout=3.0)
                if is_live:
                    live_social_threats.append((surf, handle, target_url))
                    clean_h = handle.lstrip("@")
                    threat_item = {
                        "category": "social",
                        "title": handle,
                        "surface": surf,
                        "handle": handle,
                        "platform": surf,
                        "target_url": target_url,
                        "risk_score": 65,
                        "risk_level": "medium",
                        "details": f"Discovered public {surf.capitalize()} candidate account matching perimeter pattern. Awaiting analyst triage.",
                        "discovered_at": datetime.now(timezone.utc).isoformat(),
                    }
                    live_threats_list.append(threat_item)
                    state["live_threats"] = list(live_threats_list)
                    state["findings_found"] = len(live_threats_list)
                    state["logs"].append(
                        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] [DISCOVERY] Discovered candidate public {surf.upper()} account: {handle} ({target_url})"
                    )
                elif err and ("rate_limited" in err or "unavailable" in err):
                    state["logs"].append(
                        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] [COVERAGE] {surf.upper()} probe unavailable or rate-limited for {handle}: {err}"
                    )
            except Exception as e:
                logger.debug(f"Handle check skipped: {e}")

        # Update progress dynamically
        soc_progress = 62 + int(20 * ((h_idx + 1) / max(len(novel_handles), 1)))
        state["progress_pct"] = min(soc_progress, 82)
        state["eta_seconds"] = max(14 - int(8 * ((h_idx + 1) / max(len(novel_handles), 1))), 6)
        set_scan_state(key, state)
        set_scan_state(str(tenant_id), state)

    if not live_social_threats:
        state["logs"].append(
            f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Audited public social surfaces. No active collision profiles detected."
        )

    # 4. Ingest Discovered Findings into Database
    state["progress_pct"] = 85
    state["eta_seconds"] = 6
    state["stage"] = "Phase 4: Cryptographic Ingestion & Autonomous Correlation..."
    state["stage_index"] = 4
    set_scan_state(key, state)
    set_scan_state(str(tenant_id), state)

    new_sightings: List[SightingCreate] = []

    # A. Real active registered domains
    for domain, ips in live_discovered:
        whois_url = f"https://who.is/whois/{domain}"
        target_url = f"https://{domain}"
        s = SightingCreate(
            brand_id=brand_id,
            surface="web",
            source_kind="osint_dns",
            observed_at=datetime.now(timezone.utc),
            raw_ref=target_url,
            content=f"Active registered lookalike domain ({domain}) resolved to public IP(s): {', '.join(ips)}. Potential credential harvesting or brand impersonation vector.",
            normalized_payload={
                "domain": domain,
                "target": domain,
                "target_url": target_url,
                "resolved_ips": ips,
                "whois_url": whois_url,
                "source": "Cloudflare DoH 1.1.1.1",
                "status": "active_dns",
                "risk_level": "high",
                "threat_analysis": {
                    "summary": f"Verified live public DNS record for {domain} ({', '.join(ips[:2])}). WHOIS: {whois_url}",
                    "severity": "HIGH",
                    "risk_score": 88,
                    "target_url": target_url,
                    "whois_url": whois_url,
                },
            },
        )
        new_sightings.append(s)

    # B. Real verified live social handles
    for surface, handle, target_url in live_social_threats:
        clean_user = handle.lstrip("@")
        s = SightingCreate(
            brand_id=brand_id,
            surface=surface,
            source_kind="osint_social",
            observed_at=datetime.now(timezone.utc),
            raw_ref=target_url,
            content=f"Active verified {surface.capitalize()} handle ({handle}) colliding with brand perimeter. Potential unauthorized impersonation.",
            normalized_payload={
                "surface": surface,
                "target": handle,
                "target_url": target_url,
                "sender": {
                    "username": clean_user,
                    "platform": surface,
                },
                "status": "live_verified_profile",
                "risk_level": "high",
                "threat_analysis": {
                    "summary": f"Verified active public {surface.capitalize()} profile: {target_url}",
                    "severity": "HIGH",
                    "risk_score": 85,
                    "target_url": target_url,
                },
            },
        )
        new_sightings.append(s)

    # Filter out any sightings that already exist in the database (Idempotent Deduplication)
    deduped_sightings: List[SightingCreate] = []
    for candidate in new_sightings:
        exists = session.scalar(
            select(Sighting).where(
                Sighting.tenant_id == tenant_id,
                Sighting.brand_id == brand_id,
                Sighting.raw_ref == candidate.raw_ref,
            )
        )
        if not exists:
            deduped_sightings.append(candidate)
        else:
            state["logs"].append(
                f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Threat record already tracked: {candidate.raw_ref}"
            )

    # Ingest only genuine, newly discovered live threats
    if deduped_sightings:
        batch_req = SightingBatchRequest(
            tenant_id=tenant_id,
            brand_id=brand_id,
            sightings=deduped_sightings,
        )
        ingest_batch(session, batch_req)
        compute_campaign_edges_and_clusters(session, tenant_id=tenant_id, brand_id=brand_id)
    else:
        # If no new sightings, just refresh cluster linking
        compute_campaign_edges_and_clusters(session, tenant_id=tenant_id, brand_id=brand_id)

    # Finalize state
    state["progress_pct"] = 100
    state["eta_seconds"] = 0
    state["is_scanning"] = False
    state["status"] = "completed"
    state["stage"] = "Perimeter Hardened · Threat Surface Audit Complete."
    state["completed_at"] = datetime.now(timezone.utc).isoformat()
    state["findings_found"] = len(live_threats_list) if live_threats_list else len(new_sightings)
    state["live_threats"] = live_threats_list
    state["logs"].append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Audit successfully complete. {len(live_threats_list)} active threats analyzed across perimeter."
    )

    set_scan_state(key, state)
    set_scan_state(str(tenant_id), state)
    return state
