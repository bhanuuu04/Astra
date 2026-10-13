from datetime import datetime, timezone
import hashlib
import json
import re
from typing import Any, Dict, List, Optional, Tuple
import urllib.parse
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    EvidenceObject,
    Indicator,
    Sighting,
    SightingIndicator,
)
from app.detectors.rules import extract_crypto_wallets, extract_urls
from app.domain.brand_service import get_or_create_default_tenant
from app.schemas.sighting import SightingBatchRequest, SightingBatchResponse, SightingCreate
from app.storage.evidence_storage import save_evidence_content


def extract_indicators_from_text(content: str, sender: Optional[Dict[str, Any]] = None) -> List[Tuple[str, str]]:
    """Extract (type, canonical_value) pairs from sighting content and sender metadata."""
    found: List[Tuple[str, str]] = []

    # 1. Sender handle
    if sender and sender.get("username"):
        clean_handle = sender["username"].strip().lower().lstrip("@")
        found.append(("handle", clean_handle))

    # 2. URLs & Domains
    urls = extract_urls(content)
    for u in urls:
        found.append(("url", u))
        try:
            parsed = urllib.parse.urlparse(u)
            if parsed.netloc:
                found.append(("domain", parsed.netloc.lower()))
        except Exception:
            pass

    # 3. APK mentions
    apk_matches = re.findall(r'[\w\-.]+\.apk', content, re.IGNORECASE)
    for apk in apk_matches:
        found.append(("apk_package", apk.lower()))

    # 4. Crypto wallets
    wallets = extract_crypto_wallets(content)
    for w in wallets:
        found.append(("crypto_wallet", w))

    # 5. Phone numbers
    phone_matches = re.findall(r'\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}', content)
    for p in phone_matches:
        clean_phone = re.sub(r'[^\d+]', '', p)
        if len(clean_phone) >= 10:
            found.append(("phone", clean_phone))

    # 6. UPI IDs (e.g. user@okhdfcbank, payment@upi)
    upi_matches = re.findall(r'[\w.-]+@[\w.-]+', content)
    for upi in upi_matches:
        if not re.search(r'\.(com|org|net|io|edu|gov|in|live|xyz)$', upi, re.IGNORECASE):
            found.append(("upi", upi.lower()))

    # Deduplicate
    return list(set(found))


def ingest_batch(session: Session, batch: SightingBatchRequest) -> SightingBatchResponse:
    tenant_id = batch.tenant_id
    if not tenant_id:
        tenant = get_or_create_default_tenant(session)
        tenant_id = tenant.id

    from app.db.models import Brand

    brand_id = batch.brand_id
    if brand_id:
        brand = session.scalar(select(Brand).where(Brand.id == brand_id, Brand.tenant_id == tenant_id))
        if not brand:
            raise ValueError(f"Brand {brand_id} not found for tenant")
    else:
        brand = session.scalar(select(Brand).where(Brand.tenant_id == tenant_id).order_by(Brand.created_at.asc()))
        if not brand:
            brand = Brand(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                name="Astra Default Brand",
                status="active"
            )
            session.add(brand)
            session.flush()
        brand_id = brand.id

    created_ids: List[uuid.UUID] = []
    indicators_count = 0

    for item in batch.sightings:
        sighting_id = uuid.uuid4()
        obs_time = item.observed_at or datetime.now(timezone.utc)

        # Build normalized payload
        payload = item.normalized_payload or {}
        raw_text = item.content or item.evidence_text or ""
        if item.content and "content" not in payload:
            payload["content"] = item.content
        if item.sender and "sender" not in payload:
            payload["sender"] = item.sender

        effective_brand_id = brand_id
        if item.brand_id:
            item_brand = session.scalar(select(Brand).where(Brand.id == item.brand_id, Brand.tenant_id == tenant_id))
            if not item_brand:
                raise ValueError(f"Brand {item.brand_id} not found for tenant")
            effective_brand_id = item.brand_id

        sighting = Sighting(
            id=sighting_id,
            tenant_id=tenant_id,
            brand_id=effective_brand_id,
            surface=item.surface,
            source_kind=item.source_kind or "direct_message",
            observed_at=obs_time,
            raw_ref=item.raw_ref,
            normalized_payload=payload,
        )
        session.add(sighting)
        session.flush()
        created_ids.append(sighting_id)

        # Evidence byte capture, SHA-256 hash & persistence
        text_bytes = (raw_text or json.dumps(payload, default=str)).encode("utf-8")
        sha256_hash = hashlib.sha256(text_bytes).hexdigest()
        object_key = f"{tenant_id}/{sighting_id}/{sha256_hash[:16]}.txt"

        # Persist content bytes to storage
        save_evidence_content(object_key, text_bytes)

        evidence_obj = EvidenceObject(
            id=uuid.uuid4(),
            sighting_id=sighting_id,
            object_key=object_key,
            media_type=item.media_type or "text/plain",
            sha256=sha256_hash,
            captured_at=datetime.now(timezone.utc),
            source_ref=item.raw_ref or item.surface,
            provenance={"surface": item.surface, "source_kind": item.source_kind},
        )
        session.add(evidence_obj)

        # Extract and persist indicators
        extracted = extract_indicators_from_text(raw_text, item.sender)
        for ind_type, ind_val in extracted:
            # Check or create indicator
            indicator = session.scalar(
                select(Indicator).where(
                    Indicator.tenant_id == tenant_id,
                    Indicator.indicator_type == ind_type,
                    Indicator.canonical_value == ind_val,
                )
            )
            if not indicator:
                indicator = Indicator(
                    id=uuid.uuid4(),
                    tenant_id=tenant_id,
                    indicator_type=ind_type,
                    canonical_value=ind_val,
                    fingerprint=hashlib.sha256(f"{ind_type}:{ind_val}".encode("utf-8")).hexdigest()[:32],
                )
                session.add(indicator)
                session.flush()

            # Link SightingIndicator
            sighting_ind = SightingIndicator(
                id=uuid.uuid4(),
                sighting_id=sighting_id,
                indicator_id=indicator.id,
                extraction_method="automated_regex",
                confidence=1.0,
            )
            session.add(sighting_ind)
            indicators_count += 1

    session.commit()
    return SightingBatchResponse(
        ingested_count=len(created_ids),
        sighting_ids=created_ids,
        indicators_extracted=indicators_count,
    )


def list_sightings(
    session: Session,
    tenant_id: Optional[uuid.UUID] = None,
    brand_id: Optional[uuid.UUID] = None,
    surface: Optional[str] = None,
    limit: int = 50,
) -> List[Sighting]:
    stmt = select(Sighting)
    if tenant_id:
        stmt = stmt.where(Sighting.tenant_id == tenant_id)
    if brand_id:
        stmt = stmt.where(Sighting.brand_id == brand_id)
    if surface:
        stmt = stmt.where(Sighting.surface == surface)
    return list(session.scalars(stmt.order_by(Sighting.created_at.desc()).limit(limit)).all())


def whitelist_sighting(
    session: Session,
    sighting_id: uuid.UUID,
    tenant_id: uuid.UUID,
    actor: str = "analyst",
    reason: str = "",
) -> Sighting:
    """Claim a discovered threat target as a legitimate, verified brand asset (whitelist)."""
    from sqlalchemy.orm.attributes import flag_modified
    from app.db.models import AnalystDecision, Brand, BrandAsset

    sighting = session.scalar(
        select(Sighting).where(Sighting.id == sighting_id, Sighting.tenant_id == tenant_id)
    )
    if not sighting:
        raise ValueError(f"Sighting {sighting_id} not found for authenticated tenant")

    payload = dict(sighting.normalized_payload or {})
    target = payload.get("target") or payload.get("domain") or sighting.raw_ref or ""
    clean_target = target.strip().lower().lstrip("@")
    surface = (sighting.surface or payload.get("surface") or "web").lower()

    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()

    # Determine asset type
    is_domain = "." in clean_target and "/" not in clean_target and not clean_target.startswith("http")
    if clean_target.startswith("http://") or clean_target.startswith("https://"):
        try:
            parsed = urllib.parse.urlparse(clean_target)
            if parsed.netloc:
                clean_target = parsed.netloc.lower()
                is_domain = True
        except Exception:
            pass

    asset_type = "domain" if (is_domain or "web" in surface or "dns" in surface) else "social_handle"

    # Add or update authoritative BrandAsset so future detectors & scans never flag this target
    existing_asset = session.scalar(
        select(BrandAsset).where(
            BrandAsset.tenant_id == tenant_id,
            BrandAsset.brand_id == sighting.brand_id,
            BrandAsset.asset_type == asset_type,
            BrandAsset.canonical_value == clean_target,
        )
    )
    if not existing_asset:
        new_asset = BrandAsset(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            brand_id=sighting.brand_id,
            asset_type=asset_type,
            canonical_value=clean_target,
            verification_status="verified",
            verification_method="analyst_whitelist",
            verified_at=now_dt,
            asset_metadata={
                "whitelisted_by": actor,
                "reason": reason or "Claimed as legitimate brand asset",
                "whitelisted_at": now_iso,
                "source_sighting_id": str(sighting_id),
            },
        )
        session.add(new_asset)
    else:
        existing_asset.verification_status = "verified"
        existing_asset.verification_method = "analyst_whitelist"
        existing_asset.verified_at = now_dt
        meta = dict(existing_asset.asset_metadata or {})
        meta["whitelisted_by"] = actor
        meta["whitelisted_at"] = now_iso
        meta["reason"] = reason or "Claimed as legitimate brand asset"
        existing_asset.asset_metadata = meta

    # Update Sighting normalized payload
    payload["is_benign"] = True
    payload["isBenign"] = True
    payload["triage_status"] = "whitelisted"
    payload["whitelisted_at"] = now_iso
    payload["whitelisted_by"] = actor
    payload["whitelist_reason"] = reason or "Claimed as legitimate brand asset"

    # Lower threat analysis score to zero
    ta = dict(payload.get("threat_analysis") or {})
    ta["risk_score"] = 0
    ta["severity"] = "BENIGN"
    ta["summary"] = f"Claimed as legitimate brand asset by {actor}: {reason or 'Verified authentic asset'}"
    payload["threat_analysis"] = ta

    sighting.normalized_payload = payload
    flag_modified(sighting, "normalized_payload")

    # Record persistent Analyst Decision
    decision = AnalystDecision(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        actor=actor,
        decision="whitelist",
        reason=reason or f"Target '{clean_target}' claimed as authentic brand asset.",
    )
    session.add(decision)
    session.commit()
    session.refresh(sighting)
    return sighting


def dismiss_sighting(
    session: Session,
    sighting_id: uuid.UUID,
    tenant_id: uuid.UUID,
    actor: str = "analyst",
    reason: str = "",
) -> Sighting:
    """Dismiss a discovered threat finding as a false positive or benign entity."""
    from sqlalchemy.orm.attributes import flag_modified
    from app.db.models import AnalystDecision

    sighting = session.scalar(
        select(Sighting).where(Sighting.id == sighting_id, Sighting.tenant_id == tenant_id)
    )
    if not sighting:
        raise ValueError(f"Sighting {sighting_id} not found for authenticated tenant")

    now_iso = datetime.now(timezone.utc).isoformat()
    payload = dict(sighting.normalized_payload or {})

    payload["is_benign"] = False
    payload["isBenign"] = False
    payload["triage_status"] = "dismissed"
    payload["dismissed_at"] = now_iso
    payload["dismissed_by"] = actor
    payload["dismiss_reason"] = reason or "Dismissed by analyst as false positive"

    ta = dict(payload.get("threat_analysis") or {})
    ta["risk_score"] = 0
    ta["severity"] = "DISMISSED"
    ta["summary"] = f"Dismissed as false positive by {actor}: {reason or 'Non-infringing entity'}"
    payload["threat_analysis"] = ta

    sighting.normalized_payload = payload
    flag_modified(sighting, "normalized_payload")

    decision = AnalystDecision(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        actor=actor,
        decision="false_positive",
        reason=reason or f"Finding {sighting_id} dismissed as false positive.",
    )
    session.add(decision)
    session.commit()
    session.refresh(sighting)
    return sighting


def takedown_sighting(
    session: Session,
    sighting_id: uuid.UUID,
    tenant_id: uuid.UUID,
    actor: str = "analyst",
    user_id: Optional[uuid.UUID] = None,
    target_provider: Optional[str] = None,
    notes: str = "",
) -> Dict[str, Any]:
    """Initiate a formal takedown request or abuse report for an impersonation threat."""
    from sqlalchemy.orm.attributes import flag_modified
    from app.db.models import AnalystDecision, EvidenceObject, ResponseAction

    sighting = session.scalar(
        select(Sighting).where(Sighting.id == sighting_id, Sighting.tenant_id == tenant_id)
    )
    if not sighting:
        raise ValueError(f"Sighting {sighting_id} not found for authenticated tenant")

    now_iso = datetime.now(timezone.utc).isoformat()
    payload = dict(sighting.normalized_payload or {})
    surface = (sighting.surface or payload.get("surface") or "web").lower()

    # Determine default provider if not specified
    if not target_provider:
        if "instagram" in surface or "facebook" in surface:
            target_provider = "meta_takedown"
        elif "twitter" in surface or "x" in surface:
            target_provider = "x_abuse"
        elif "apk" in surface or "app" in surface:
            target_provider = "google_abuse"
        elif "telegram" in surface:
            target_provider = "telegram_abuse"
        else:
            target_provider = "registrar_dmca"

    target_ref = payload.get("target_url") or sighting.raw_ref or payload.get("target") or "Unspecified target"

    # Build response draft payload
    draft_payload = {
        "sighting_id": str(sighting_id),
        "target": target_ref,
        "surface": surface,
        "target_provider": target_provider,
        "reported_at": now_iso,
        "reported_by": actor,
        "notes": notes or f"Automated impersonation takedown dispatched for {target_ref}",
        "evidence_ref": payload.get("whois_url") or payload.get("resolved_ips"),
    }

    # Mark Sighting as confirmed threat with takedown in-flight
    payload["isBenign"] = False
    payload["triage_status"] = "confirmed_threat"
    payload["takedown_requested_at"] = now_iso
    payload["takedown_requested_by"] = actor
    payload["takedown_provider"] = target_provider
    payload["takedown_notes"] = notes or "Takedown in flight"

    ta = dict(payload.get("threat_analysis") or {})
    ta["severity"] = "CRITICAL"
    ta["summary"] = f"Takedown in-flight via {target_provider}. Initiated by {actor}."
    payload["threat_analysis"] = ta

    sighting.normalized_payload = payload
    flag_modified(sighting, "normalized_payload")

    # Record Analyst Decision
    decision = AnalystDecision(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        actor=actor,
        decision="takedown_requested",
        reason=notes or f"Takedown request initiated against {target_ref} via {target_provider}",
    )
    session.add(decision)
    session.commit()
    session.refresh(sighting)

    return {
        "success": True,
        "sighting_id": str(sighting_id),
        "target_provider": target_provider,
        "target": target_ref,
        "status": "takedown_requested",
        "triage_status": "takedown_requested",
        "requested_at": now_iso,
        "requested_by": actor,
    }


def reopen_sighting(
    session: Session,
    sighting_id: uuid.UUID,
    tenant_id: uuid.UUID,
    actor: str = "analyst",
) -> Sighting:
    """Reopen a previously whitelisted or dismissed sighting back to active investigation status."""
    from sqlalchemy.orm.attributes import flag_modified
    from app.db.models import AnalystDecision

    sighting = session.scalar(
        select(Sighting).where(Sighting.id == sighting_id, Sighting.tenant_id == tenant_id)
    )
    if not sighting:
        raise ValueError(f"Sighting {sighting_id} not found for authenticated tenant")

    payload = dict(sighting.normalized_payload or {})
    payload["isBenign"] = False
    payload["is_benign"] = False
    payload["triage_status"] = "active"
    payload.pop("whitelisted_at", None)
    payload.pop("whitelisted_by", None)
    payload.pop("dismissed_at", None)
    payload.pop("dismissed_by", None)

    ta = dict(payload.get("threat_analysis") or {})
    ta["risk_score"] = 85
    ta["severity"] = "HIGH"
    ta["summary"] = f"Reopened for active investigation by {actor}."
    payload["threat_analysis"] = ta

    sighting.normalized_payload = payload
    flag_modified(sighting, "normalized_payload")

    decision = AnalystDecision(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        actor=actor,
        decision="reopen",
        reason=f"Sighting {sighting_id} reopened for investigation.",
    )
    session.add(decision)
    session.commit()
    session.refresh(sighting)
    return sighting

