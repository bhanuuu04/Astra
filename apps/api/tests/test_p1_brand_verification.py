import uuid
from datetime import datetime, timezone
from unittest.mock import patch
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db.models import Base, Brand, BrandAsset, Tenant
from app.domain.brand_service import add_brand_asset, create_brand, get_brand_asset, delete_brand_asset
from app.domain.verification_service import (
    get_expected_txt_record,
    initiate_domain_verification,
    verify_asset_manual,
    verify_domain_ownership,
)
from app.schemas.brand import BrandAssetCreate, BrandCreate


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_domain_dns_txt_challenge_initiation(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="FinTech Global")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="FinTech App")
    db_session.add(brand)
    db_session.commit()

    asset_in = BrandAssetCreate(
        asset_type="domain",
        canonical_value="fintechglobal.com",
    )
    asset = add_brand_asset(db_session, brand.id, asset_in)
    assert asset.verification_status == "unverified"
    assert asset.verification_method is None

    analyst_id = uuid.uuid4()
    token = initiate_domain_verification(db_session, asset, initiated_by=analyst_id)

    assert token is not None
    assert len(token) >= 32
    expected_record = get_expected_txt_record(token)
    assert expected_record.startswith("astra-verification=")
    assert token in expected_record

    # Verify status transitioned to pending_challenge
    db_session.refresh(asset)
    assert asset.verification_status == "pending_challenge"
    assert asset.verification_method == "dns_txt"
    assert asset.asset_metadata["challenge_token"] == token
    assert asset.asset_metadata["challenge_initiated_by"] == str(analyst_id)


def test_domain_dns_txt_verification_success_and_failure(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="FinTech Global")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="FinTech App")
    db_session.add(brand)
    db_session.commit()

    asset = add_brand_asset(
        db_session,
        brand.id,
        BrandAssetCreate(asset_type="domain", canonical_value="mysecurebank.io"),
    )
    analyst_id = uuid.uuid4()
    token = initiate_domain_verification(db_session, asset, initiated_by=analyst_id)

    # 1. Failure scenario: DNS probe does not find the TXT record
    with patch("app.domain.verification_service.check_txt_record", return_value=(False, "TXT record not found")):
        success, err = verify_domain_ownership(db_session, asset, verified_by=analyst_id)
        assert success is False
        assert "TXT record not found" in err
        db_session.refresh(asset)
        assert asset.verification_status == "pending_challenge"  # remains pending

    # 2. Success scenario: DNS probe finds the matching TXT record
    with patch("app.domain.verification_service.check_txt_record", return_value=(True, None)):
        success, err = verify_domain_ownership(db_session, asset, verified_by=analyst_id)
        assert success is True
        assert err is None
        db_session.refresh(asset)
        assert asset.verification_status == "verified"
        assert asset.verification_method == "dns_txt"
        assert asset.verified_by == analyst_id
        assert asset.verified_at is not None


def test_mobile_app_package_and_signing_cert_metadata(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="Mobile Corp")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="Mobile Brand")
    db_session.add(brand)
    db_session.commit()

    cert_sha256 = "14:28:AB:39:74:90:DE:88:51:F2:C9:83:B1:05:44:E2:31:AA:99:41:BC:02:44:81:AA:FF:01:23:45:67:89:AB"
    asset_in = BrandAssetCreate(
        asset_type="mobile_app_pkg",
        canonical_value="com.mobilecorp.securebanking",
        metadata={"cert_fingerprint": cert_sha256},
    )
    asset = add_brand_asset(db_session, brand.id, asset_in)

    assert asset.asset_type == "mobile_app_pkg"
    assert asset.canonical_value == "com.mobilecorp.securebanking"
    assert asset.asset_metadata["cert_fingerprint"] == cert_sha256
    assert asset.verification_status == "unverified"


def test_analyst_manual_attestation_verification(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="Gov Banking")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="Gov Bank")
    db_session.add(brand)
    db_session.commit()

    asset = add_brand_asset(
        db_session,
        brand.id,
        BrandAssetCreate(asset_type="domain", canonical_value="treasury.internal.gov"),
    )
    analyst_id = uuid.uuid4()

    # Empty reason should raise ValueError
    with pytest.raises(ValueError, match="reason"):
        verify_asset_manual(db_session, asset, verified_by=analyst_id, reason="   ")

    # Valid attestation
    verify_asset_manual(
        db_session,
        asset,
        verified_by=analyst_id,
        reason="Verified via internal government certificate authority and signed SOX registry.",
    )
    db_session.refresh(asset)
    assert asset.verification_status == "verified"
    assert asset.verification_method == "manual_analyst"
    assert asset.verified_by == analyst_id
    assert "internal government certificate" in asset.asset_metadata["manual_verification_reason"]


def test_delete_brand_asset(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="Test Tenant")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="Test Brand")
    db_session.add(brand)
    db_session.commit()

    asset = add_brand_asset(
        db_session,
        brand.id,
        BrandAssetCreate(asset_type="handle", canonical_value="instagram:test_handle"),
    )
    assert get_brand_asset(db_session, brand.id, asset.id) is not None

    deleted = delete_brand_asset(db_session, brand.id, asset.id)
    assert deleted is True
    assert get_brand_asset(db_session, brand.id, asset.id) is None
