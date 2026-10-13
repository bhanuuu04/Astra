import uuid
from datetime import datetime, timezone
from unittest.mock import patch
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.security import TenantContext
from app.db.models import (
    Base,
    Brand,
    BrandAsset,
    Finding,
    Sighting,
    Tenant,
)
from app.api.routes.analysis import handle_get_scan_status
from app.detectors.rules import detect_lookalike_variations
from app.domain.brand_service import add_brand_asset
from app.domain.detector_service import run_detectors_on_sighting
from app.domain.finding_service import (
    calculate_triage_priority,
    ingest_finding,
    update_finding_triage,
)
from app.domain.profile_validator import verify_social_profile_live
from app.domain.verification_service import initiate_domain_verification
from app.domain.mobile_app_service import compare_app_listing_against_brand
from app.schemas.brand import BrandAssetCreate
from app.schemas.finding import FindingIngest
from app.schemas.mobile_app import AppListingDiscoveryItem


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session, Session
    session.close()


def test_official_account_exclusion_and_suffix_lookalike(test_db):
    session, _ = test_db
    tenant = Tenant(id=uuid.uuid4(), name="NovaPay Org")
    session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="NovaPay")
    session.add(brand)
    session.commit()

    # Enforce canonical social_handle on twitter
    asset = BrandAsset(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        asset_type="social_handle",
        canonical_value="novapay",
        asset_metadata={"platform": "twitter"},
        verification_status="verified",
    )
    session.add(asset)
    session.commit()

    brand_assets = [asset]

    # 1. Exact official account on Twitter -> must be excluded with official_asset_match
    official_sighting = Sighting(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        surface="twitter",
        raw_ref="@novapay",
        normalized_payload={
            "sender": {"username": "novapay", "displayName": "NovaPay Official"},
            "content": "Official system maintenance update.",
        },
    )
    official_signals = run_detectors_on_sighting(official_sighting, brand, brand_assets)
    keys = [s["detector_key"] for s in official_signals]
    assert "official_asset_match" in keys
    assert "brand_impersonation" not in keys

    # 2. Lookalike suffix candidate (@novapay_support) -> must NOT be excluded; must be flagged
    impersonator_sighting = Sighting(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        surface="twitter",
        raw_ref="@novapay_support",
        normalized_payload={
            "sender": {"username": "novapay_support", "displayName": "NovaPay Help Desk"},
            "content": "DM us your private keys to restore account access.",
        },
    )
    impersonator_signals = run_detectors_on_sighting(impersonator_sighting, brand, brand_assets)
    imp_keys = [s["detector_key"] for s in impersonator_signals]
    assert "official_asset_match" not in imp_keys
    assert "brand_impersonation" in imp_keys
    imp_sig = next(s for s in impersonator_signals if s["detector_key"] == "brand_impersonation")
    assert imp_sig["score"] >= 0.85

    # 3. Same handle on unverified platform (Instagram when only Twitter enrolled) -> not automatically trusted
    other_platform_sighting = Sighting(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        surface="instagram",
        raw_ref="@novapay",
        normalized_payload={
            "sender": {"username": "novapay", "displayName": "NovaPay"},
            "content": "Claim your free airdrop token now.",
        },
    )
    other_signals = run_detectors_on_sighting(other_platform_sighting, brand, brand_assets)
    other_keys = [s["detector_key"] for s in other_signals]
    assert "official_asset_match" not in other_keys


def test_unrelated_support_account_not_flagged():
    # otherbrand_support must NOT trigger lookalike impersonation for NovaPay
    lookalike_res = detect_lookalike_variations(
        candidate="otherbrand_support",
        brand_name="NovaPay",
        content="Contact our customer service team.",
    )
    assert lookalike_res["has_lookalike"] is False
    assert "ADDED_WORD" not in lookalike_res["variations"]


def test_official_app_exclusion_in_triage(test_db):
    session, _ = test_db
    tenant = Tenant(id=uuid.uuid4(), name="NovaPay Org")
    session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="NovaPay")
    session.add(brand)
    session.commit()

    # Register official app package
    official_app = BrandAsset(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        asset_type="mobile_app_pkg",
        canonical_value="com.novapay.official",
        verification_status="verified",
    )
    session.add(official_app)
    session.commit()

    # Enrolled app finding on Google Play -> must receive 0.0 priority
    official_finding = Finding(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        source_kind="mobile_store",
        surface="google_play",
        external_id="pkg-novapay-official",
        target_identifier="https://play.google.com/store/apps/details?id=com.novapay.official",
        observed_at=datetime.now(timezone.utc),
        triage_status="pending",
    )
    priority, signals = calculate_triage_priority(
        session, official_finding, brand, {"package_name": "com.novapay.official"}
    )
    assert priority == 0.0
    assert any(s.detector_key == "official_asset_match" for s in signals)

    # Rogue app finding -> must receive elevated triage priority
    rogue_finding = Finding(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        source_kind="mobile_store",
        surface="google_play",
        external_id="pkg-novapay-fake",
        target_identifier="https://play.google.com/store/apps/details?id=com.novapay.fakeapp",
        observed_at=datetime.now(timezone.utc),
        triage_status="pending",
    )
    rogue_priority, rogue_signals = calculate_triage_priority(
        session, rogue_finding, brand, {"package_name": "com.novapay.fakeapp"}
    )
    assert rogue_priority > 0.20


@pytest.mark.anyio
async def test_rate_limited_and_unavailable_profiles():
    # Mock HTTP 429 response from social provider
    class MockResponse:
        def __init__(self, status_code: int, text: str = ""):
            self.status_code = status_code
            self.text = text

    with patch("httpx.AsyncClient.get", return_value=MockResponse(429, "Rate limit exceeded")):
        is_live, target_url, err = await verify_social_profile_live("twitter", "novapay")
        assert is_live is False
        assert err is not None
        assert "rate_limited" in err

    with patch("httpx.AsyncClient.get", return_value=MockResponse(403, "Forbidden")):
        is_live, target_url, err = await verify_social_profile_live("instagram", "novapay")
        assert is_live is False
        assert err is not None
        assert "unavailable" in err


def test_repeated_finding_ingestion_retains_signals(test_db):
    session, _ = test_db
    tenant = Tenant(id=uuid.uuid4(), name="Test Org")
    session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="FinBank")
    session.add(brand)
    session.commit()

    ingest_payload = FindingIngest(
        brand_id=brand.id,
        source_kind="web",
        surface="google_play",
        external_id="candidate-app-1",
        target_identifier="com.finbank.suspicious.app",
        observed_at=datetime.now(timezone.utc),
        data_mode="live",
        raw_payload={"title": "FinBank Mobile Login"},
        normalized_attributes={"package_name": "com.finbank.suspicious.app"},
    )

    # 1. First ingestion
    first_resp = ingest_finding(session, tenant.id, ingest_payload)
    assert len(first_resp.signals) > 0
    signals_count = len(first_resp.signals)

    # 2. Duplicate ingestion -> must return existing signals via Signal.finding_id
    duplicate_resp = ingest_finding(session, tenant.id, ingest_payload)
    assert duplicate_resp.finding_id == first_resp.finding_id
    assert len(duplicate_resp.signals) == signals_count


def test_fresh_session_reload_retains_triage_and_verification_json(test_db):
    session, SessionMaker = test_db
    tenant = Tenant(id=uuid.uuid4(), name="Audit Org")
    session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="AuditBrand")
    session.add(brand)

    finding = Finding(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        source_kind="web",
        surface="domain",
        external_id="audit-finding-1",
        target_identifier="https://fake-audit.xyz",
        observed_at=datetime.now(timezone.utc),
        triage_status="pending",
        normalized_attributes={"initial_key": "initial_value"},
    )
    session.add(finding)

    asset = BrandAsset(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        asset_type="domain",
        canonical_value="auditbrand.com",
        asset_metadata={"existing_meta": "preserved"},
    )
    session.add(asset)
    session.commit()

    actor_id = uuid.uuid4()
    finding_id = finding.id
    asset_id = asset.id

    # Update triage status
    update_finding_triage(
        session=session,
        tenant_id=tenant.id,
        finding_id=finding_id,
        triage_status="confirmed_threat",
        rationale="Analyst confirmed active credential phishing lure",
        actor_id=actor_id,
    )

    # Initiate domain verification
    token = initiate_domain_verification(session, asset, initiated_by=actor_id)
    session.close()

    # Fresh session reload
    fresh_session = SessionMaker()
    reloaded_finding = fresh_session.scalar(select(Finding).where(Finding.id == finding_id))
    assert reloaded_finding.triage_status == "confirmed_threat"
    assert "triage_history" in reloaded_finding.normalized_attributes
    history = reloaded_finding.normalized_attributes["triage_history"]
    assert len(history) == 1
    assert history[0]["new_status"] == "confirmed_threat"
    assert history[0]["rationale"] == "Analyst confirmed active credential phishing lure"

    reloaded_asset = fresh_session.scalar(select(BrandAsset).where(BrandAsset.id == asset_id))
    assert reloaded_asset.verification_status == "pending_challenge"
    assert reloaded_asset.asset_metadata["challenge_token"] == token
    assert reloaded_asset.asset_metadata["existing_meta"] == "preserved"
    fresh_session.close()


def test_scan_status_cross_tenant_access_denied(test_db):
    session, _ = test_db
    tenant_a = Tenant(id=uuid.uuid4(), name="Tenant A")
    tenant_b = Tenant(id=uuid.uuid4(), name="Tenant B")
    session.add_all([tenant_a, tenant_b])

    brand_a = Brand(id=uuid.uuid4(), tenant_id=tenant_a.id, name="Brand A")
    brand_b = Brand(id=uuid.uuid4(), tenant_id=tenant_b.id, name="Brand B")
    session.add_all([brand_a, brand_b])
    session.commit()

    context_a = TenantContext(
        tenant_id=tenant_a.id,
        tenant_name="Tenant A",
        actor="analyst@tenant-a.com",
        role="analyst",
        user_id=uuid.uuid4(),
    )

    # Tenant A attempts to access scan status of Brand B
    with pytest.raises(HTTPException) as exc_info:
        handle_get_scan_status(
            brand_id=brand_b.id,
            session=session,
            context=context_a,
        )
    assert exc_info.value.status_code == 404
    assert "not found for authenticated tenant" in exc_info.value.detail


def test_app_listing_adapter_and_comparison(test_db):
    session, _ = test_db
    tenant = Tenant(id=uuid.uuid4(), name="NovaPay Inc")
    session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="NovaPay")
    session.add(brand)
    session.commit()

    # Register official app package
    official_app = BrandAsset(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        asset_type="mobile_app_pkg",
        canonical_value="com.novapay.official",
        asset_metadata={"publisher_name": "NovaPay Official Ltd"},
        verification_status="verified",
    )
    session.add(official_app)
    session.commit()

    # 1. Compare official package listing -> must exclude with score 0.0
    official_listing = AppListingDiscoveryItem(
        store="google_play",
        listing_id="com.novapay.official",
        package_name="com.novapay.official",
        app_title="NovaPay - Official Wallet",
        developer_id="dev-123",
        developer_name="NovaPay Official Ltd",
        description="Official wallet application from NovaPay.",
        icon_url="https://play.google.com/icon.png",
        source_url="https://play.google.com/store/apps/details?id=com.novapay.official",
        captured_at=datetime.now(timezone.utc),
    )
    official_result = compare_app_listing_against_brand(session, brand, official_listing)
    assert official_result.is_official_match is True
    assert official_result.measured_risk_score == 0.0
    assert "official_asset_match" in official_result.signals
    assert "Matches verified official app package" in (official_result.exclusion_reason or "")

    # 2. Compare suspicious lookalike listing -> flags measured publisher mismatch & resembling description
    suspicious_listing = AppListingDiscoveryItem(
        store="google_play",
        listing_id="com.novapay.fake.fastcash",
        package_name="com.novapay.fake.fastcash",
        app_title="NovaPay Fast Cash Loan",
        developer_id="dev-unknown",
        developer_name="Shady Developer LLC",
        description="Official app for instant NovaPay loans and verify OTP.",
        icon_url="https://play.google.com/scam_icon.png",
        source_url="https://play.google.com/store/apps/details?id=com.novapay.fake.fastcash",
        captured_at=datetime.now(timezone.utc),
    )
    suspicious_result = compare_app_listing_against_brand(session, brand, suspicious_listing)
    assert suspicious_result.is_official_match is False
    assert suspicious_result.publisher_mismatch is True
    assert suspicious_result.has_resembling_description is True
    assert suspicious_result.title_brand_match is True
    assert suspicious_result.measured_risk_score > 0.5
    assert "publisher_mismatch" in suspicious_result.signals
    assert "resembling_description" in suspicious_result.signals
