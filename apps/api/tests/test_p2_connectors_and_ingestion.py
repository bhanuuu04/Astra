"""Tests for P2: Connector Management, Cryptographic Secret Vault, and Live Telemetry Ingestion."""
import uuid
from datetime import datetime, timezone
from typing import Generator
import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token
from app.core.secret_vault import (
    decrypt_secret_payload,
    encrypt_secret_payload,
    mask_secret_dict,
)
from app.db.models import Base, Brand, Connector, EvidenceObject, Finding, Tenant, TenantMembership, User
from app.db.session import get_session
from app.main import app

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    with TestingSessionLocal() as session:
        yield session


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_tenant_and_user(db_session: Session):
    """Create test tenant, user, and valid JWT token."""
    tenant = Tenant(name="Acme Corp P2")
    db_session.add(tenant)
    db_session.flush()

    user = User(email=f"analyst_{uuid.uuid4().hex[:6]}@acme.com", full_name="P2 Analyst")
    db_session.add(user)
    db_session.flush()

    membership = TenantMembership(
        tenant_id=tenant.id,
        user_id=user.id,
        role="org_admin"
    )
    db_session.add(membership)
    db_session.commit()

    token = create_access_token(
        tenant_id=tenant.id,
        role="org_admin",
        actor=user.email,
        user_id=user.id,
    )
    return {"tenant": tenant, "user": user, "token": token}


@pytest.fixture
def enrolled_brand(db_session: Session, test_tenant_and_user):
    """Ensure a brand exists for the tenant."""
    tenant = test_tenant_and_user["tenant"]
    brand = Brand(tenant_id=tenant.id, name="AcmePay", status="enrolled")
    db_session.add(brand)
    db_session.commit()
    db_session.refresh(brand)
    return brand


def test_secret_vault_encryption_decryption_and_tampering():
    """Verify that credentials are authenticated and fail-closed against tampering."""
    original_creds = {"api_key": "live_secret_key_998877", "client_secret": "xyz_pass_123"}
    
    # 1. Encryption
    vault_ref = encrypt_secret_payload(original_creds)
    assert vault_ref.startswith("vault:v1:")
    assert "live_secret_key" not in vault_ref

    # 2. Decryption
    decrypted = decrypt_secret_payload(vault_ref)
    assert decrypted == original_creds

    # 3. Tampering detection
    tampered_ref = vault_ref[:-4] + "AAAA"
    with pytest.raises(ValueError, match="tampered"):
        decrypt_secret_payload(tampered_ref)

    # 4. Masking
    masked = mask_secret_dict(original_creds)
    assert masked["api_key"] == "live...8877"
    assert masked["client_secret"] == "xyz_..._123"


def test_create_connector_and_credentials_never_exposed(client, test_tenant_and_user, db_session: Session):
    """Ensure created connector stores credentials in the vault without leaking them in responses."""
    token = test_tenant_and_user["token"]

    create_payload = {
        "connector_type": "virustotal",
        "name": "Production VirusTotal Scanner",
        "auth_config": {"api_key": "test_vt_api_key_secure_456"},
        "rate_limit_rpm": 120
    }

    res = client.post(
        "/api/v1/connectors",
        json=create_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()

    # Verify response schema: secrets and vault reference are NEVER returned
    assert data["connector_type"] == "virustotal"
    assert data["status"] == "unconfigured"
    assert "auth_config" not in data
    assert "auth_config_vault_ref" not in data

    # Verify database state
    connector_id = uuid.UUID(data["id"])
    db_connector = db_session.scalar(select(Connector).where(Connector.id == connector_id))
    assert db_connector is not None
    assert db_connector.auth_config_vault_ref.startswith("vault:v1:")
    
    # Decrypt and verify stored payload
    stored_creds = decrypt_secret_payload(db_connector.auth_config_vault_ref)
    assert stored_creds["api_key"] == "test_vt_api_key_secure_456"


def test_connector_health_check_handshake(client, test_tenant_and_user, monkeypatch):
    """Verify live health check handshake transitions status and updates scopes."""
    token = test_tenant_and_user["token"]

    # 1. Mock credentials must never be reported as a live provider connection.
    create_res = client.post(
        "/api/v1/connectors",
        json={
            "connector_type": "virustotal",
            "name": "Acme VT Feed",
            "auth_config": {"api_key": "test_mock_valid_key"},
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_res.status_code == 201
    connector_id = create_res.json()["id"]

    # 2. Run health check and ensure the mock key is rejected.
    health_res = client.post(
        f"/api/v1/connectors/{connector_id}/health",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["status"] == "error"
    assert "Mock credentials" in health_data["error_message"]

    # A non-mock credential can become active only after a successful provider handshake.
    def provider_response(url, **kwargs):
        if url.startswith("https://www.virustotal.com/api/v3/users/") and "invalid_rejected" not in url:
            return httpx.Response(200, json={"data": {"id": "account"}}, request=httpx.Request("GET", url))
        return httpx.Response(401, json={}, request=httpx.Request("GET", url))

    monkeypatch.setattr("app.domain.connector_service.httpx.get", provider_response)
    live_patch = client.patch(
        f"/api/v1/connectors/{connector_id}",
        json={"auth_config": {"api_key": "vt_live_valid_key"}},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert live_patch.status_code == 200
    live_health = client.post(f"/api/v1/connectors/{connector_id}/health", headers={"Authorization": f"Bearer {token}"})
    assert live_health.status_code == 200
    assert live_health.json()["status"] == "active"
    assert live_health.json()["error_message"] is None

    # 3. Check updated connector detail has acquired scopes
    get_res = client.get(
        f"/api/v1/connectors/{connector_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["status"] == "active"
    assert "url_reputation" in detail["permitted_scopes"]

    # 4. Clear credentials and verify health check sets status to unconfigured
    patch_res = client.patch(
        f"/api/v1/connectors/{connector_id}",
        json={"auth_config": {}},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert patch_res.status_code == 200

    bad_health_res = client.post(
        f"/api/v1/connectors/{connector_id}/health",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bad_health_res.status_code == 200
    assert bad_health_res.json()["status"] == "unconfigured"
    assert "No authentication credentials" in bad_health_res.json()["error_message"]

    # 5. Provide invalid rejected credentials and verify status transitions to error
    patch_bad = client.patch(
        f"/api/v1/connectors/{connector_id}",
        json={"auth_config": {"api_key": "invalid_rejected_key_xyz"}},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert patch_bad.status_code == 200

    err_health_res = client.post(
        f"/api/v1/connectors/{connector_id}/health",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert err_health_res.status_code == 200
    assert err_health_res.json()["status"] == "error"
    assert err_health_res.json()["error_message"] is not None


def test_connector_sync_and_evidence_sealing(client, test_tenant_and_user, enrolled_brand, db_session: Session, monkeypatch):
    """Verify live telemetry collection ingests findings and seals SHA-256 evidence."""
    token = test_tenant_and_user["token"]

    # 1. Create and activate connector
    create_res = client.post(
        "/api/v1/connectors",
        json={
            "connector_type": "virustotal",
            "name": "Live VirusTotal Feed",
            "auth_config": {"api_key": "vt_live_sync_key"},
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    connector_id = create_res.json()["id"]

    # Seed an analyst-submitted URL for VirusTotal enrichment; it is not a discovery feed.
    db_session.add(Finding(
        tenant_id=enrolled_brand.tenant_id,
        brand_id=enrolled_brand.id,
        source_kind="web_domain",
        surface="manual_upload",
        external_id=f"manual-{uuid.uuid4().hex}",
        target_identifier="https://suspicious.example/path",
        observed_at=datetime.now(timezone.utc),
        data_mode="manual_upload",
        normalized_attributes={},
    ))
    db_session.commit()

    def provider_response(url, **kwargs):
        request = httpx.Request("GET", url)
        if "/users/" in url:
            return httpx.Response(200, json={"data": {"id": "account"}}, request=request)
        return httpx.Response(200, json={"data": {"attributes": {
            "last_analysis_stats": {"malicious": 3, "suspicious": 1, "harmless": 4, "undetected": 6},
            "last_analysis_results": {},
        }}}, request=request)

    monkeypatch.setattr("app.domain.connector_service.httpx.get", provider_response)
    monkeypatch.setattr("app.integrations.connector_sources.httpx.get", provider_response)
    # Activate via a successful provider health handshake.
    health_res = client.post(f"/api/v1/connectors/{connector_id}/health", headers={"Authorization": f"Bearer {token}"})
    assert health_res.json()["status"] == "active"

    # 2. Trigger live sync
    sync_res = client.post(
        f"/api/v1/connectors/{connector_id}/sync",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["status"] == "active"
    assert sync_data["synced_findings_count"] > 0
    assert len(sync_data["finding_ids"]) > 0

    first_finding_id = uuid.UUID(sync_data["finding_ids"][0])

    # 3. Verify Finding in database
    finding = db_session.scalar(select(Finding).where(Finding.id == first_finding_id))
    assert finding is not None
    assert finding.connector_id == uuid.UUID(connector_id)
    assert finding.data_mode == "live"
    assert finding.triage_priority > 0.0
    assert finding.raw_evidence_id is not None

    # 4. Verify Evidence Object has cryptographic SHA-256 hash
    evidence = db_session.scalar(select(EvidenceObject).where(EvidenceObject.id == finding.raw_evidence_id))
    assert evidence is not None
    assert len(evidence.sha256) == 64
    assert evidence.media_type == "application/json"


def test_connector_tenant_isolation(client, test_tenant_and_user, db_session: Session):
    """Ensure strict tenant isolation across all connector endpoints."""
    token_a = test_tenant_and_user["token"]

    # Create Tenant B and user
    tenant_b = Tenant(name="Rival Corp")
    db_session.add(tenant_b)
    db_session.flush()

    user_b = User(email="rival@rival.com", full_name="Rival User")
    db_session.add(user_b)
    db_session.flush()

    membership_b = TenantMembership(tenant_id=tenant_b.id, user_id=user_b.id, role="org_admin")
    db_session.add(membership_b)
    db_session.commit()

    token_b = create_access_token(
        tenant_id=tenant_b.id,
        role="org_admin",
        actor=user_b.email,
        user_id=user_b.id,
    )

    # Tenant A creates connector
    create_res = client.post(
        "/api/v1/connectors",
        json={"connector_type": "telegram_bot", "name": "Confidential Bot", "auth_config": {"bot_token": "test_tok"}},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    connector_id = create_res.json()["id"]

    # Tenant B attempts to access Tenant A's connector
    get_res = client.get(f"/api/v1/connectors/{connector_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert get_res.status_code == 404

    health_res = client.post(f"/api/v1/connectors/{connector_id}/health", headers={"Authorization": f"Bearer {token_b}"})
    assert health_res.status_code == 404

    sync_res = client.post(f"/api/v1/connectors/{connector_id}/sync", headers={"Authorization": f"Bearer {token_b}"})
    assert sync_res.status_code == 404

    del_res = client.delete(f"/api/v1/connectors/{connector_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert del_res.status_code == 404

    # Tenant B listing must not contain Tenant A's connector
    list_res = client.get("/api/v1/connectors", headers={"Authorization": f"Bearer {token_b}"})
    assert list_res.status_code == 200
    assert all(c["id"] != connector_id for c in list_res.json()["connectors"])
