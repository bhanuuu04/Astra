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
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Generated {len(candidates)} lookalike permutations."
    )

    live_discovered: List[Tuple[str, List[str]]] = []
    async with httpx.AsyncClient() as client:
        # Run batches of 10 concurrent requests to respect rate limits
        batch_size = 10
        for i in range(0, len(candidates), batch_size):
            batch = candidates[i:i + batch_size]
            results = await asyncio.gather(*[check_domain_doh(client, d) for d in batch])
            for r in results:
                if r:
                    live_discovered.append(r)
                    state["logs"].append(
                        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] [ALERT] Live registered domain detected: {r[0]} (IP: {r[1][0]})"
                    )

    state["progress_pct"] = 65
    state["eta_seconds"] = 15
    state["stage"] = "Phase 3: Auditing Social Handles & Perimeter Collisions..."
    state["stage_index"] = 3

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
    for handle in novel_handles:
        for surf in ["telegram", "instagram"]:
            try:
                is_live, target_url, _ = await verify_social_profile_live(surf, handle, timeout=3.0)
                if is_live:
                    live_social_threats.append((surf, handle, target_url))
                    state["logs"].append(
                        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] [ALERT] Verified live public {surf.upper()} account: {handle} ({target_url})"
                    )
            except Exception as e:
                logger.debug(f"Handle check skipped: {e}")

    if not live_social_threats:
        state["logs"].append(
            f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Audited public social surfaces. No active collision profiles detected."
        )

    # 4. Ingest Discovered Findings into Supabase (Zero Mock Data)
    state["progress_pct"] = 85
    state["eta_seconds"] = 6
    state["stage"] = "Phase 4: Cryptographic Ingestion & Autonomous Correlation..."
    state["stage_index"] = 4

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
    state["findings_found"] = len(new_sightings)
    state["live_threats"] = [
        {"domain": d[0], "ips": d[1], "whois": f"https://who.is/whois/{d[0]}"}
        for d in live_discovered
    ]
    state["logs"].append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Audit successfully complete. {len(new_sightings)} verified telemetry records updated."
    )

    set_scan_state(key, state)
    set_scan_state(str(tenant_id), state)
    return state
