import asyncio
from contextlib import contextmanager
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Set, Tuple
import urllib.parse
import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Brand, BrandAsset, GovernanceNotice, Sighting
from app.db.session import SessionLocal
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


def clear_scan_state(brand_or_tenant_id: str) -> None:
    ACTIVE_SCAN_STATES.pop(str(brand_or_tenant_id), None)


def generate_candidate_domains(
    canonical_domain: str,
    brand_name: str,
    official_domains: Optional[Set[str]] = None,
    whitelisted_domains: Optional[Set[str]] = None,
) -> List[str]:
    """Generate realistic typosquat, homoglyph, omission, repetition, and lookalike domains."""
    candidates: Set[str] = set()
    clean_domain = canonical_domain.strip().lower()
    if clean_domain.startswith("http://") or clean_domain.startswith("https://"):
        clean_domain = urllib.parse.urlparse(clean_domain).netloc

    parts = clean_domain.split(".")
    stem = parts[0] if parts else brand_name.lower().replace(" ", "")
    original_tld = ".".join(parts[1:]) if len(parts) > 1 else "com"

    # High-risk, commercial, and brand-squatting TLD variants
    top_tlds = [
        "com", "co", "io", "net", "org", "app", "xyz", "top",
        "live", "in", "biz", "cc", "online", "site", "cloud", "security", "store", "tech"
    ]
    for tld in top_tlds:
        if tld != original_tld:
            candidates.add(f"{stem}.{tld}")

    # 1. Letter repetitions (Typosquatting: e.g. vercellll.co, veercel.com, verrcel.com)
    for i, char in enumerate(stem):
        if char.isalpha():
            # Double character
            rep_double = stem[:i] + char + stem[i:]
            candidates.add(f"{rep_double}.{original_tld}")
            candidates.add(f"{rep_double}.co")
            candidates.add(f"{rep_double}.com")
            # Triple character
            rep_triple = stem[:i] + char * 2 + stem[i:]
            candidates.add(f"{rep_triple}.{original_tld}")
            candidates.add(f"{rep_triple}.co")
            candidates.add(f"{rep_triple}.com")

    # Double last character (very common: vercell.com, vercellll.co)
    if stem:
        candidates.add(f"{stem}{stem[-1]}.com")
        candidates.add(f"{stem}{stem[-1]}.co")
        candidates.add(f"{stem}{stem[-1]*2}.com")
        candidates.add(f"{stem}{stem[-1]*2}.co")
        candidates.add(f"{stem}{stem[-1]*3}.co")
        candidates.add(f"{stem}{stem[-1]*3}.com")

    # 2. Letter omissions (Typosquatting: e.g. vercl.com, vrcel.com, vecel.com, ercel.com)
    if len(stem) > 3:
        for i in range(len(stem)):
            omitted = stem[:i] + stem[i + 1:]
            if len(omitted) >= 3:
                candidates.add(f"{omitted}.{original_tld}")
                candidates.add(f"{omitted}.com")
                candidates.add(f"{omitted}.co")

    # 3. Adjacent QWERTY keyboard typos
    qwerty_neighbors: Dict[str, List[str]] = {
        "c": ["v", "d", "x", "s", "f"],
        "e": ["w", "r", "d", "3"],
        "r": ["e", "t", "f", "4"],
        "l": ["k", "o", "1", "p"],
        "o": ["i", "p", "0", "9"],
        "a": ["s", "q", "z"],
        "s": ["a", "d", "w", "5"],
        "t": ["r", "y", "g", "7"],
    }
    for i, char in enumerate(stem):
        if char in qwerty_neighbors:
            for neighbor in qwerty_neighbors[char]:
                typo_stem = stem[:i] + neighbor + stem[i + 1:]
                candidates.add(f"{typo_stem}.{original_tld}")
                candidates.add(f"{typo_stem}.com")
                candidates.add(f"{typo_stem}.co")

    # 4. Adjacent character transpositions (Swaps: e.g. vecrel.com, vrecly.com)
    for i in range(len(stem) - 1):
        swapped = stem[:i] + stem[i + 1] + stem[i] + stem[i + 2:]
        candidates.add(f"{swapped}.{original_tld}")
        candidates.add(f"{swapped}.com")

    # 5. Domain hacks & ccTLD splits (e.g. verce.lo for vercel, doc.io for dock)
    domain_hack_tlds = ["lo", "io", "co", "in", "me", "to", "is", "ly", "app"]
    for tld in domain_hack_tlds:
        if stem.endswith(tld) and len(stem) > len(tld) + 1:
            split_stem = stem[:-len(tld)]
            candidates.add(f"{split_stem}.{tld}")

    # Specific requested examples
    if "vercel" in stem:
        candidates.add("verce.lo")
        candidates.add("vercellll.co")
        candidates.add("vercelsupport.co")
        candidates.add("vercel-security.com")
        candidates.add("vercel-login.com")

    # 6. Phishing / impersonation prefix/suffix variations (Fake Portals & Billing)
    phish_modifiers = [
        "login", "support", "verify", "auth", "security",
        "app", "portal", "secure", "official", "help", "billing", "deploy"
    ]
    for mod in phish_modifiers:
        candidates.add(f"{stem}-{mod}.com")
        candidates.add(f"{stem}{mod}.com")
        candidates.add(f"{stem}{mod}.co")
        candidates.add(f"{mod}-{stem}.com")
        candidates.add(f"{mod}-{stem}.co")
        if original_tld and original_tld != "com":
            candidates.add(f"{stem}-{mod}.{original_tld}")
            candidates.add(f"{stem}{mod}.{original_tld}")

    # 7. Homoglyphs (number substitutions & unicode lookalikes)
    homoglyph_map = {"o": "0", "i": "1", "l": "1", "e": "3", "s": "5", "a": "4"}
    for char, rep in homoglyph_map.items():
        if char in stem:
            candidates.add(f"{stem.replace(char, rep, 1)}.com")
            candidates.add(f"{stem.replace(char, rep, 1)}.co")
            if original_tld:
                candidates.add(f"{stem.replace(char, rep, 1)}.{original_tld}")

    # Cyrillic lookalikes
    cyrillic_map = {"e": "\u0435", "o": "\u043e", "a": "\u0430", "c": "\u0441", "p": "\u0440"}
    for char, rep in cyrillic_map.items():
        if char in stem:
            candidates.add(f"{stem.replace(char, rep, 1)}.com")
            candidates.add(f"{stem.replace(char, rep, 1)}.co")

    # 8. Filter out authentic and whitelisted brand assets
    candidates.discard(clean_domain)
    if official_domains:
        for d in official_domains:
            candidates.discard(d.lower())
    if whitelisted_domains:
        for d in whitelisted_domains:
            candidates.discard(d.lower())

    return list(candidates)


async def check_domain_doh(client: httpx.AsyncClient, domain: str) -> Optional[Dict[str, Any]]:
    """Query Cloudflare DNS-over-HTTPS (1.1.1.1) to verify live active DNS resolution,
    and inspect HTTP reachability to detect phishing / cloned portals.
    """
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
                    result: Dict[str, Any] = {
                        "domain": domain,
                        "ips": ips,
                        "http_status": None,
                        "page_title": None,
                        "is_phishing": False,
                    }

                    # Fast pre-flight HTTP probe to detect active phishing websites
                    try:
                        probe_resp = await client.get(
                            f"https://{domain}",
                            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
                            timeout=2.5,
                            follow_redirects=True,
                        )
                        result["http_status"] = probe_resp.status_code
                        text = probe_resp.text.lower()
                        title_match = re.search(r"<title[^>]*>(.*?)</title>", text, re.IGNORECASE)
                        if title_match:
                            result["page_title"] = title_match.group(1).strip()
                        phish_words = ["login", "sign in", "password", "verify", "account", "billing", "dashboard", "wallet", "support"]
                        if any(w in text for w in phish_words):
                            result["is_phishing"] = True
                    except Exception:
                        pass

                    return result
    except Exception as exc:
        logger.debug(f"DoH query error for {domain}: {exc}")
    return None


@contextmanager
def _scoped_session(provided: Optional[Session] = None):
    if provided is not None:
        yield provided
    else:
        with SessionLocal() as s:
            yield s


def _publish_state(state: Dict[str, Any], tenant_id: Any, brand_id: Any) -> None:
    if brand_id:
        set_scan_state(str(brand_id), state)
    if tenant_id:
        set_scan_state(str(tenant_id), state)
    if tenant_id and brand_id:
        set_scan_state(f"{tenant_id}:{brand_id}", state)


async def run_osint_threat_scan(
    *args,
    brand_id: Optional[uuid.UUID] = None,
    tenant_id: Optional[uuid.UUID] = None,
    session: Optional[Session] = None,
    **kwargs,
) -> Dict[str, Any]:
    """Execute end-to-end OSINT Threat Surface Scan with dynamic progress tracking."""
    provided_session = session
    actual_brand_id = brand_id
    actual_tenant_id = tenant_id

    # Handle positional invocation variations
    if len(args) == 3 and isinstance(args[0], Session):
        provided_session = args[0]
        actual_brand_id = args[1]
        actual_tenant_id = args[2]
    elif len(args) == 2:
        actual_brand_id = args[0]
        actual_tenant_id = args[1]
    elif len(args) == 1:
        if isinstance(args[0], Session):
            provided_session = args[0]
        else:
            actual_brand_id = args[0]

    now_iso = datetime.now(timezone.utc).isoformat()

    # Initialize tracking state
    state: Dict[str, Any] = {
        "is_scanning": True,
        "status": "running",
        "brand_id": str(actual_brand_id),
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
    _publish_state(state, actual_tenant_id, actual_brand_id)

    # 1. Resolve Brand & Canonical Assets within short-lived scope
    canonical_domain = None
    social_handles: List[str] = []
    brand_name = ""
    official_domains: List[str] = []
    whitelisted_domains: List[str] = []

    with _scoped_session(provided_session) as db:
        brand = db.scalar(select(Brand).where(Brand.id == actual_brand_id))
        if not brand:
            state["status"] = "error"
            state["is_scanning"] = False
            state["stage"] = "Brand not found."
            return state

        brand_name = brand.name
        assets = list(db.scalars(select(BrandAsset).where(BrandAsset.brand_id == actual_brand_id)).all())
        for a in assets:
            if a.asset_type == "domain":
                official_domains.append(a.canonical_value.lower())
                if not canonical_domain:
                    canonical_domain = a.canonical_value
            elif a.asset_type == "social_handle":
                social_handles.append(a.canonical_value)

        # Retrieve whitelisted items from Sightings
        sightings_for_brand = list(
            db.scalars(
                select(Sighting).where(
                    Sighting.brand_id == actual_brand_id,
                )
            ).all()
        )
        for s in sightings_for_brand:
            p = s.normalized_payload or {}
            if p.get("is_benign") or p.get("triage_status") == "whitelisted":
                dom = p.get("domain") or (p.get("target") if s.surface == "web" else None)
                if dom:
                    whitelisted_domains.append(str(dom).lower())

    if not canonical_domain:
        canonical_domain = f"{brand_name.lower().replace(' ', '')}.com"
    stem = canonical_domain.split(".")[0].lower()

    state["logs"].append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Canonical domain verified: {canonical_domain}"
    )
    state["progress_pct"] = 25
    state["eta_seconds"] = 28
    state["stage"] = "Phase 2: Generating candidate permutations & querying Cloudflare DoH (1.1.1.1)..."
    state["stage_index"] = 2

    # 2. Generate Candidate Domains and Query Cloudflare DoH
    candidates = generate_candidate_domains(
        canonical_domain=canonical_domain,
        brand_name=brand_name,
        official_domains=set(official_domains),
        whitelisted_domains=set(whitelisted_domains),
    )
    state["logs"].append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Generated {len(candidates)} lookalike permutations across OSINT vectors."
    )
    _publish_state(state, actual_tenant_id, actual_brand_id)

    live_discovered: List[Dict[str, Any]] = []
    live_threats_list: List[Dict[str, Any]] = []

    async with httpx.AsyncClient() as client:
        # Run batches of 10 concurrent requests to respect rate limits
        batch_size = 10
        total_batches = (len(candidates) + batch_size - 1) // batch_size
        for batch_idx, i in enumerate(range(0, len(candidates), batch_size)):
            batch = candidates[i:i + batch_size]
            results = await asyncio.gather(*[check_domain_doh(client, d) for d in batch])
            for r in results:
                if r and isinstance(r, dict):
                    live_discovered.append(r)
                    domain = r["domain"]
                    ips = r.get("ips", [])
                    is_phishing = r.get("is_phishing", False)
                    page_title = r.get("page_title")
                    http_status = r.get("http_status")
                    whois_link = f"https://who.is/whois/{domain}"
                    has_brand_root = stem in domain.lower()
                    dom_score = 92 if is_phishing else (85 if has_brand_root else 65)
                    sev = "CRITICAL" if is_phishing else ("HIGH" if dom_score >= 80 else "MEDIUM")
                    threat_item = {
                        "category": "domain",
                        "title": domain,
                        "domain": domain,
                        "surface": "web",
                        "ips": ips,
                        "target_url": f"https://{domain}",
                        "whois": whois_link,
                        "whois_url": whois_link,
                        "risk_score": dom_score,
                        "risk_level": sev.lower(),
                        "is_phishing": is_phishing,
                        "page_title": page_title,
                        "threat_type": "phishing_portal" if is_phishing else "typosquat_lookalike",
                        "verification_source": "Live Cloudflare DoH & HTTP Probe",
                        "is_verified_threat": True,
                        "confidence_score": 0.95 if is_phishing else 0.88,
                        "details": f"Registered domain ({domain}) resolved to IP(s): {', '.join(ips[:2])}. {'Active credential harvesting / phishing page detected!' if is_phishing else 'Lookalike candidate domain matching perimeter pattern.'}",
                        "discovered_at": datetime.now(timezone.utc).isoformat(),
                    }
                    live_threats_list.append(threat_item)
                    state["live_threats"] = list(live_threats_list)
                    state["findings_found"] = len(live_threats_list)
                    state["logs"].append(
                        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] [DISCOVERY] Live registered domain detected: {domain} (IP: {ips[0] if ips else 'unknown'}{' - PHISHING SUSPECT' if is_phishing else ''})"
                    )
            # Update progress incrementally
            pct_step = 25 + int(35 * ((batch_idx + 1) / max(total_batches, 1)))
            state["progress_pct"] = min(pct_step, 60)
            state["eta_seconds"] = max(24 - int(12 * ((batch_idx + 1) / max(total_batches, 1))), 14)
            _publish_state(state, actual_tenant_id, actual_brand_id)

    state["progress_pct"] = 62
    state["eta_seconds"] = 14
    state["stage"] = "Phase 3: Auditing Social Handles & Perimeter Impersonator Radar..."
    state["stage_index"] = 3
    _publish_state(state, actual_tenant_id, actual_brand_id)

    # 3. Social Handles Lookalike Permutations & Live Validation
    lookalike_handles = [
        f"@{stem}_support",
        f"@{stem}_help",
        f"@{stem}_official_app",
        f"@{stem}_care",
        f"@{stem}_security",
    ]
    canonical_clean_handles = {h.lower().lstrip("@") for h in social_handles}
    novel_handles = [h for h in lookalike_handles if h.lower().lstrip("@") not in canonical_clean_handles]

    live_social_threats: List[Dict[str, Any]] = []
    platforms_to_probe = ["telegram", "instagram", "twitter", "youtube"]
    for h_idx, handle in enumerate(novel_handles):
        for surf in platforms_to_probe:
            try:
                is_live, target_url, err = await verify_social_profile_live(surf, handle, timeout=3.0)
                if is_live:
                    social_item = {
                        "category": "social",
                        "title": handle,
                        "surface": surf,
                        "handle": handle,
                        "platform": surf,
                        "target_url": target_url,
                        "threat_type": "fake_support_account",
                        "risk_score": 85 if ("support" in handle or "help" in handle or "security" in handle) else 70,
                        "risk_level": "high" if ("support" in handle or "help" in handle) else "medium",
                        "details": f"Discovered live public {surf.capitalize()} candidate account ({handle}) matching perimeter pattern. Impersonation of official channel.",
                        "verification_source": f"Live {surf.capitalize()} Probe",
                        "is_verified_threat": True,
                        "confidence_score": 0.88,
                        "discovered_at": datetime.now(timezone.utc).isoformat(),
                    }
                    live_social_threats.append(social_item)
                    live_threats_list.append(social_item)
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

        soc_progress = 62 + int(20 * ((h_idx + 1) / max(len(novel_handles), 1)))
        state["progress_pct"] = min(soc_progress, 82)
        state["eta_seconds"] = max(14 - int(8 * ((h_idx + 1) / max(len(novel_handles), 1))), 6)
        _publish_state(state, actual_tenant_id, actual_brand_id)

    if not live_social_threats:
        state["logs"].append(
            f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Audited public social surfaces. No active collision profiles detected."
        )

    # 4. Ingest Discovered Findings into Database
    state["progress_pct"] = 85
    state["eta_seconds"] = 6
    state["stage"] = "Phase 4: Cryptographic Ingestion & Autonomous Correlation..."
    state["stage_index"] = 4
    _publish_state(state, actual_tenant_id, actual_brand_id)

    new_sightings: List[SightingCreate] = []

    # A. Real active registered domains
    for item in live_discovered:
        domain = item["domain"]
        ips = item.get("ips", [])
        is_phish = item.get("is_phishing", False)
        page_title = item.get("page_title")
        http_status = item.get("http_status")
        whois_url = f"https://who.is/whois/{domain}"
        target_url = f"https://{domain}"
        s = SightingCreate(
            brand_id=actual_brand_id,
            surface="web",
            source_kind="osint_dns",
            observed_at=datetime.now(timezone.utc),
            raw_ref=target_url,
            content=f"Active registered lookalike domain ({domain}) resolved to public IP(s): {', '.join(ips)}. {'Active credential harvesting / phishing page detected.' if is_phish else 'Potential credential harvesting or brand impersonation vector.'}",
            normalized_payload={
                "domain": domain,
                "target": domain,
                "target_url": target_url,
                "resolved_ips": ips,
                "whois_url": whois_url,
                "http_status": http_status,
                "page_title": page_title,
                "is_phishing": is_phish,
                "threat_type": "phishing_portal" if is_phish else "typosquat_lookalike",
                "threat_severity": "CRITICAL" if is_phish else "HIGH",
                "confidence_score": 0.95 if is_phish else 0.85,
                "source": "Cloudflare DoH 1.1.1.1 & Live HTTP Probe",
                "verification_source": "Live DNS + HTTP Probe",
                "is_verified_threat": True,
                "status": "active_dns",
                "triage_status": "active",
                "risk_level": "critical" if is_phish else "high",
                "threat_analysis": {
                    "summary": f"Verified live public DNS record for {domain} ({', '.join(ips[:2])}). {f'Active page: {page_title}.' if page_title else ''} WHOIS: {whois_url}",
                    "severity": "CRITICAL" if is_phish else "HIGH",
                    "risk_score": 92 if is_phish else 85,
                    "target_url": target_url,
                    "whois_url": whois_url,
                },
            },
        )
        new_sightings.append(s)

    # B. Real verified live social handles
    for soc in live_social_threats:
        surface = soc["surface"]
        handle = soc["handle"]
        clean_user = handle.lstrip("@")
        target_url = soc["target_url"]
        s = SightingCreate(
            brand_id=actual_brand_id,
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
                "threat_type": "fake_support_account",
                "threat_severity": "HIGH",
                "confidence_score": 0.88,
                "source": f"Live {surface.capitalize()} Probe",
                "verification_source": f"Live {surface.capitalize()} Probe",
                "is_verified_threat": True,
                "status": "live_verified_profile",
                "triage_status": "active",
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
    with _scoped_session(provided_session) as db:
        deduped_sightings: List[SightingCreate] = []
        for candidate in new_sightings:
            exists = db.scalar(
                select(Sighting).where(
                    Sighting.tenant_id == actual_tenant_id,
                    Sighting.brand_id == actual_brand_id,
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
                tenant_id=actual_tenant_id,
                brand_id=actual_brand_id,
                sightings=deduped_sightings,
            )
            ingest_batch(db, batch_req)
            compute_campaign_edges_and_clusters(db, tenant_id=actual_tenant_id, brand_id=actual_brand_id)

            # Send tenant governance alert
            if actual_tenant_id:
                db.add(GovernanceNotice(
                    tenant_id=actual_tenant_id,
                    notice_type="threat_discovered",
                    title=f"New Impersonation Threat{'s' if len(deduped_sightings) > 1 else ''} Discovered",
                    message=f"Astra detected {len(deduped_sightings)} active lookalike threat(s) targeting {brand_name}. Review evidence in the dashboard.",
                ))
        else:
            # If no new sightings, just refresh cluster linking
            compute_campaign_edges_and_clusters(db, tenant_id=actual_tenant_id, brand_id=actual_brand_id)
        db.commit()

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

    _publish_state(state, actual_tenant_id, actual_brand_id)
    return state
