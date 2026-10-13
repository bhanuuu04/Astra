"""Ownership, evidence, and dispute lifecycle for enrolled brands."""
from __future__ import annotations

import hashlib
import re
import uuid
from datetime import datetime, timezone
from urllib.parse import urlsplit

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.secret_vault import derive_vault_key
from app.db.models import Brand, BrandAsset, BrandClaim, BrandClaimDocument, GovernanceNotice
from app.domain.audit_service import log_audit_event
from app.storage.evidence_storage import load_evidence_content, save_evidence_content

MAX_KYB_DOCUMENT_BYTES = 12 * 1024 * 1024
ALLOWED_KYB_TYPES = {
    "application/pdf": (".pdf",),
    "image/jpeg": (".jpg", ".jpeg"),
    "image/png": (".png",),
}


def normalize_domain_name(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        raise ValueError("An official domain is required for brand ownership verification.")
    if "://" in raw:
        parsed = urlsplit(raw)
        raw = parsed.hostname or ""
    else:
        raw = raw.split("/", 1)[0].split(":", 1)[0]
    raw = raw.rstrip(".").lower().removeprefix("www.")
    try:
        domain = raw.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValueError("Enter a valid internationalized domain name.") from exc
    if len(domain) > 253 or "." not in domain or any(
        not label or len(label) > 63 or not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", label)
        for label in domain.split(".")
    ):
        raise ValueError("Enter a valid public domain such as example.com.")
    return domain


def _email_matches_domain(email: str, domain: str) -> bool:
    parts = email.strip().lower().rsplit("@", 1)
    if len(parts) != 2 or not parts[0]:
        return False
    email_domain = parts[1].rstrip(".")
    return email_domain == domain or email_domain.endswith(f".{domain}")


def _notice(session: Session, tenant_id: uuid.UUID, claim_id: uuid.UUID, notice_type: str, title: str, message: str) -> None:
    session.add(GovernanceNotice(
        id=uuid.uuid4(), tenant_id=tenant_id, claim_id=claim_id,
        notice_type=notice_type, title=title, message=message,
    ))


def create_brand_claim(
    session: Session,
    brand: Brand,
    applicant_email: str,
    legal_entity_name: str | None,
    actor_id: uuid.UUID,
) -> BrandClaim:
    domain_asset = session.scalar(select(BrandAsset).where(
        BrandAsset.brand_id == brand.id,
        BrandAsset.asset_type.in_(("domain", "web_domain")),
    ).order_by(BrandAsset.created_at.asc()))
    if not domain_asset:
        raise ValueError("Add an official domain to start the ownership verification workflow.")

    domain = normalize_domain_name(domain_asset.canonical_value)
    domain_asset.canonical_value = domain
    email_match = _email_matches_domain(applicant_email, domain)
    claim = BrandClaim(
        id=uuid.uuid4(), tenant_id=brand.tenant_id, brand_id=brand.id,
        official_domain=domain, applicant_email=applicant_email.strip().lower(),
        email_domain_match=email_match,
        legal_entity_name=(legal_entity_name or "").strip() or None,
        status="pending_domain",
    )
    session.add(claim)
    session.flush()

    # Any prior tenant claim on this exact domain starts a dispute. Do not reveal
    # the incumbent tenant's identity to the claimant through this response.
    competing_assets = session.scalars(select(BrandAsset).where(
        BrandAsset.asset_type.in_(("domain", "web_domain")),
        BrandAsset.tenant_id != brand.tenant_id,
    )).all()
    incumbent_asset = next((asset for asset in competing_assets if _safe_normalize(asset.canonical_value) == domain), None)
    if incumbent_asset:
        claim.status = "disputed"
        claim.incumbent_brand_id = incumbent_asset.brand_id
        brand.status = "claim_disputed"
        _notice(
            session, incumbent_asset.tenant_id, claim.id, "brand_claim_conflict",
            "Ownership claim requires review",
            f"Another tenant submitted an ownership claim for {domain}. Your existing brand remains active while a platform reviewer reviews the evidence.",
        )
        _notice(
            session, brand.tenant_id, claim.id, "brand_claim_conflict",
            "Brand ownership claim is under dispute",
            f"The domain {domain} is already claimed in ASTRA. This brand remains inactive while a platform reviewer reviews the ownership evidence.",
        )
    else:
        brand.status = "pending_verification"
        _notice(
            session, brand.tenant_id, claim.id, "brand_claim_started",
            "Verify ownership to activate monitoring",
            "Add the ASTRA DNS TXT challenge to the official domain. If your organization email does not match the domain, upload legal proof for reviewer approval.",
        )

    session.commit()
    session.refresh(claim)
    log_audit_event(
        session=session, tenant_id=brand.tenant_id, actor_id=actor_id,
        action="brand_claim_created", entity_type="brand_claim", entity_id=claim.id,
        after_state={"brand_id": str(brand.id), "domain": domain, "status": claim.status, "email_domain_match": email_match},
    )
    session.commit()
    return claim


def _safe_normalize(value: str) -> str | None:
    try:
        return normalize_domain_name(value)
    except ValueError:
        return None


def update_claim_after_domain_verification(session: Session, brand_id: uuid.UUID, actor_id: uuid.UUID) -> None:
    claim = session.scalar(select(BrandClaim).where(BrandClaim.brand_id == brand_id))
    if not claim or claim.status == "disputed":
        return
    brand = session.get(Brand, brand_id)
    if not brand:
        return
    if claim.email_domain_match:
        claim.status = "approved"
        brand.status = "active"
        _notice(session, claim.tenant_id, claim.id, "brand_claim_approved", "Brand ownership verified", f"DNS ownership for {claim.official_domain} is verified. Brand monitoring is enabled.")
    else:
        claim.status = "pending_documents"
        brand.status = "pending_compliance"
        _notice(session, claim.tenant_id, claim.id, "brand_documents_required", "Legal proof required", "DNS control is verified, but the account email does not match the brand domain. Upload an incorporation, GST, or trademark document for review before monitoring starts.")
    session.commit()
    log_audit_event(
        session=session, tenant_id=claim.tenant_id, actor_id=actor_id,
        action="brand_claim_dns_verified", entity_type="brand_claim", entity_id=claim.id,
        after_state={"status": claim.status, "brand_status": brand.status},
    )
    session.commit()


def encrypt_kyb_document(document: bytes) -> bytes:
    from cryptography.fernet import Fernet
    return Fernet(derive_vault_key()).encrypt(document)


def decrypt_kyb_document(document: bytes) -> bytes:
    from cryptography.fernet import Fernet
    return Fernet(derive_vault_key()).decrypt(document)


def store_kyb_document(
    session: Session,
    claim: BrandClaim,
    document_type: str,
    filename: str,
    content_type: str,
    raw_bytes: bytes,
) -> BrandClaimDocument:
    if document_type not in {"incorporation_certificate", "gst_registration", "trademark_certificate", "other_legal_proof"}:
        raise ValueError("Choose a supported legal proof document type.")
    if not raw_bytes or len(raw_bytes) > MAX_KYB_DOCUMENT_BYTES:
        raise ValueError("Legal proof must be between 1 byte and 12 MB.")
    allowed_extensions = ALLOWED_KYB_TYPES.get(content_type)
    clean_name = (filename or "document").replace("\\", "/").split("/")[-1][:255]
    if not allowed_extensions or not clean_name.lower().endswith(allowed_extensions):
        raise ValueError("Upload a PDF, JPEG, or PNG legal document.")
    if content_type == "application/pdf" and not raw_bytes.startswith(b"%PDF-"):
        raise ValueError("The uploaded file does not look like a valid PDF.")
    if content_type == "image/png" and not raw_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("The uploaded file does not look like a valid PNG.")
    if content_type == "image/jpeg" and not raw_bytes.startswith(b"\xff\xd8\xff"):
        raise ValueError("The uploaded file does not look like a valid JPEG.")

    digest = hashlib.sha256(raw_bytes).hexdigest()
    object_key = f"kyb/{claim.tenant_id}/{claim.id}/{uuid.uuid4().hex}.enc"
    save_evidence_content(object_key, encrypt_kyb_document(raw_bytes))
    record = BrandClaimDocument(
        id=uuid.uuid4(), claim_id=claim.id, document_type=document_type,
        original_filename=clean_name, content_type=content_type,
        object_key=object_key, sha256=digest, review_status="pending_review",
    )
    session.add(record)
    if claim.status != "disputed":
        claim.status = "pending_review"
    brand = session.get(Brand, claim.brand_id)
    if brand and brand.status != "claim_disputed":
        brand.status = "pending_review"
    session.commit()
    session.refresh(record)
    return record


def adjudicate_brand_claim(
    session: Session,
    claim: BrandClaim,
    action: str,
    reviewer_id: uuid.UUID,
    notes: str,
) -> None:
    if action not in {"approve", "reject"}:
        raise ValueError("Review action must be approve or reject.")
    if action == "approve":
        domain_asset = session.scalar(select(BrandAsset).where(
            BrandAsset.brand_id == claim.brand_id,
            BrandAsset.asset_type.in_(("domain", "web_domain")),
        ))
        has_docs = session.scalar(select(BrandClaimDocument.id).where(
            BrandClaimDocument.claim_id == claim.id,
            BrandClaimDocument.review_status == "pending_review",
        ).limit(1)) is not None
        if not has_docs and not (domain_asset and domain_asset.verification_status == "verified" and claim.email_domain_match):
            raise ValueError("Approval needs a verified DNS domain and matching organization email, or an uploaded legal proof document.")

    claim.reviewed_by = reviewer_id
    claim.reviewed_at = datetime.now(timezone.utc)
    claim.review_notes = notes.strip()
    brand = session.get(Brand, claim.brand_id)
    documents = session.scalars(select(BrandClaimDocument).where(BrandClaimDocument.claim_id == claim.id)).all()
    if action == "reject":
        claim.status = "rejected"
        if brand:
            brand.status = "rejected"
        for document in documents:
            document.review_status = "rejected"
        _notice(session, claim.tenant_id, claim.id, "brand_claim_rejected", "Brand ownership claim rejected", "A platform reviewer could not approve the ownership claim. Contact your administrator for the review reason.")
    else:
        claim.status = "approved"
        if brand:
            brand.status = "active"
        for document in documents:
            document.review_status = "approved"
        domain_asset = session.scalar(select(BrandAsset).where(
            BrandAsset.brand_id == claim.brand_id,
            BrandAsset.asset_type.in_(("domain", "web_domain")),
        ))
        if domain_asset:
            domain_asset.verification_status = "verified"
            domain_asset.verification_method = "legal_document_review" if documents else "dns_txt"
            domain_asset.verified_at = datetime.now(timezone.utc)
            domain_asset.verified_by = reviewer_id
        if claim.incumbent_brand_id:
            incumbent = session.get(Brand, claim.incumbent_brand_id)
            incumbent_claim = session.scalar(select(BrandClaim).where(BrandClaim.brand_id == claim.incumbent_brand_id))
            incumbent_asset = session.scalar(select(BrandAsset).where(
                BrandAsset.brand_id == claim.incumbent_brand_id,
                BrandAsset.asset_type.in_(("domain", "web_domain")),
            ))
            if incumbent:
                incumbent.status = "ownership_review"
            if incumbent_claim:
                incumbent_claim.status = "rejected"
                incumbent_claim.reviewed_by = reviewer_id
                incumbent_claim.reviewed_at = datetime.now(timezone.utc)
                incumbent_claim.review_notes = "Ownership reassigned by platform adjudication."
            if incumbent_asset:
                incumbent_asset.verification_status = "unverified"
                incumbent_asset.verification_method = None
                incumbent_asset.verified_at = None
                incumbent_asset.verified_by = None
                _notice(session, incumbent_asset.tenant_id, claim.id, "brand_claim_lost", "Domain ownership decision updated", "A platform review reassigned the domain claim. Related monitoring is paused pending a new ownership review.")
        _notice(session, claim.tenant_id, claim.id, "brand_claim_approved", "Brand ownership approved", "The ownership claim is approved and authorized monitoring can begin.")

    session.commit()
    log_audit_event(
        session=session, tenant_id=claim.tenant_id, actor_id=reviewer_id,
        action="brand_claim_approved" if action == "approve" else "brand_claim_rejected",
        entity_type="brand_claim", entity_id=claim.id,
        after_state={"status": claim.status, "review_notes": notes.strip()},
    )
    session.commit()


def mark_notice_read(session: Session, notice: GovernanceNotice) -> None:
    notice.read_at = datetime.now(timezone.utc)
    session.commit()


def read_kyb_document(object_key: str) -> bytes:
    encrypted = load_evidence_content(object_key)
    if encrypted is None:
        raise FileNotFoundError("The stored legal document is missing.")
    return decrypt_kyb_document(encrypted)

