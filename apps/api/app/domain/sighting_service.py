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
