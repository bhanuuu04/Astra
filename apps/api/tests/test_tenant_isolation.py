import uuid
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from datetime import timedelta
import jwt
from app.core.config import get_settings
from app.core.security import ROLE_ANALYST, ROLE_ORG_ADMIN, ROLE_READ_ONLY, create_access_token
from app.db.models import (
    Base,
    Brand,
    Campaign,
    EvidenceObject,
    ResponseAction,
    Sighting,
    Tenant,
    TenantMembership,
    User,
)
from app.db.session import get_session
from app.main import app


# Set up shared in-memory SQLite database for tenant isolation test suite
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
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
def tenants_setup(db_session: Session):
    tenant_a_id = uuid.uuid4()
    tenant_b_id = uuid.uuid4()

    tenant_a = Tenant(id=tenant_a_id, name="Tenant Alpha (NilaPay)")
    tenant_b = Tenant(id=tenant_b_id, name="Tenant Beta (Competitor Corp)")
    db_session.add_all([tenant_a, tenant_b])

    # Enroll brand for Tenant A
    brand_a = Brand(id=uuid.uuid4(), tenant_id=tenant_a_id, name="NilaPay Official", status="active")
    # Enroll brand for Tenant B
    brand_b = Brand(id=uuid.uuid4(), tenant_id=tenant_b_id, name="Competitor Brand", status="active")
    db_session.add_all([brand_a, brand_b])

    analyst_email = f"analyst-{tenant_a_id}@tenant.org"
    admin_email = f"admin-{tenant_a_id}@tenant.org"
    auditor_email = f"auditor-{tenant_a_id}@tenant.org"
    analyst_user = User(id=uuid.uuid4(), email=analyst_email, full_name="Tenant Analyst")
    admin_user = User(id=uuid.uuid4(), email=admin_email, full_name="Tenant Admin")
    auditor_user = User(id=uuid.uuid4(), email=auditor_email, full_name="Tenant Auditor")
    db_session.add_all([analyst_user, admin_user, auditor_user])
    db_session.add_all([
        TenantMembership(id=uuid.uuid4(), tenant_id=tenant_a_id, user_id=analyst_user.id, role=ROLE_ANALYST),
        TenantMembership(id=uuid.uuid4(), tenant_id=tenant_a_id, user_id=admin_user.id, role=ROLE_ORG_ADMIN),
        TenantMembership(id=uuid.uuid4(), tenant_id=tenant_a_id, user_id=auditor_user.id, role=ROLE_READ_ONLY),
    ])

    # Add Sighting & Evidence for Tenant B
    sighting_b_id = uuid.uuid4()
    sighting_b = Sighting(
        id=sighting_b_id,
        tenant_id=tenant_b_id,
        brand_id=brand_b.id,
        surface="instagram",
        source_kind="direct_message",
        raw_ref="@fake_competitor_support",
        normalized_payload={"content": "Competitor fake support lure"},
    )
    evidence_b = EvidenceObject(
        id=uuid.uuid4(),
        sighting_id=sighting_b_id,
        object_key=f"{tenant_b_id}/{sighting_b_id}/evidence_sample.txt",
        media_type="text/plain",
        sha256="b" * 64,
        source_ref="https://instagram.com/p/123",
    )
    db_session.add_all([sighting_b, evidence_b])

    # Add Campaign & Action for Tenant B
    campaign_b_id = uuid.uuid4()
    campaign_b = Campaign(
        id=campaign_b_id,
        tenant_id=tenant_b_id,
        brand_id=brand_b.id,
        title="Operation Beta Threat Cluster",
        status="proposed",
        risk_score=85.0,
    )
    action_b_id = uuid.uuid4()
    action_b = ResponseAction(
        id=action_b_id,
        campaign_id=campaign_b_id,
        action_type="platform_takedown",
        draft_payload={"target": "@fake_competitor_support"},
        status="draft",
    )
    db_session.add_all([campaign_b, action_b])
    db_session.commit()

    return {
        "tenant_a_id": tenant_a_id,
        "tenant_b_id": tenant_b_id,
        "brand_a": brand_a,
        "brand_b": brand_b,
        "sighting_b": sighting_b,
        "evidence_b": evidence_b,
        "campaign_b": campaign_b,
        "action_b": action_b,
    }


def make_auth_header(tenant_id: uuid.UUID, role: str = ROLE_ANALYST, actor: str | None = None) -> dict:
    actor = actor or f"analyst-{tenant_id}@tenant.org"
    token = create_access_token(tenant_id=tenant_id, role=role, actor=actor)
    return {"Authorization": f"Bearer {token}"}


def test_tenant_context_header_spoofing_prevented(client: TestClient, tenants_setup):
    """Verify that an analyst for Tenant A cannot spoof X-Tenant-ID to access Tenant B."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    tenant_b_id = tenants_setup["tenant_b_id"]

    headers = make_auth_header(tenant_a_id, role=ROLE_ANALYST)
    headers["X-Tenant-ID"] = str(tenant_b_id)

    # Calling any endpoint while trying to switch tenants must be rejected with 403 Forbidden
    response = client.get("/api/v1/overview", headers=headers)
    assert response.status_code == 403
    assert "Cross-tenant access prohibited" in response.json()["detail"]


def test_tenant_a_cannot_read_tenant_b_brand(client: TestClient, tenants_setup):
    """Verify that Tenant A cannot retrieve Tenant B's brand details (OWASP BOLA)."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    brand_b_id = tenants_setup["brand_b"].id

    headers = make_auth_header(tenant_a_id)
    response = client.get(f"/api/v1/brands/{brand_b_id}", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Brand not found"


def test_tenant_a_cannot_list_tenant_b_sightings(client: TestClient, tenants_setup):
    """Verify that Tenant A's sightings queue does not leak Tenant B's sightings."""
    tenant_a_id = tenants_setup["tenant_a_id"]

    headers = make_auth_header(tenant_a_id)
    response = client.get("/api/v1/sightings", headers=headers)
    assert response.status_code == 200
    sightings = response.json()
    # Tenant A has 0 sightings, must not see Tenant B's sighting
    assert len(sightings) == 0


def test_tenant_a_cannot_read_tenant_b_sighting_evidence(client: TestClient, tenants_setup):
    """Verify that Tenant A cannot retrieve Tenant B's captured evidence."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    sighting_b_id = tenants_setup["sighting_b"].id

    headers = make_auth_header(tenant_a_id)
    response = client.get(f"/api/v1/sightings/{sighting_b_id}/evidence", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Sighting not found"


def test_tenant_a_cannot_inject_sighting_into_tenant_b_brand(client: TestClient, tenants_setup):
    """Verify that batch ingest rejects referencing a brand owned by another tenant."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    brand_b_id = tenants_setup["brand_b"].id

    headers = make_auth_header(tenant_a_id)
    payload = {
        "brand_id": str(brand_b_id),
        "sightings": [
            {
                "surface": "instagram",
                "source_kind": "direct_message",
                "content": "Malicious attempt to associate sighting with foreign tenant brand",
            }
        ],
    }

    response = client.post("/api/v1/sightings:batch", json=payload, headers=headers)
    assert response.status_code == 404
    assert "not found for tenant" in response.json()["detail"]


def test_tenant_a_cannot_view_or_decide_tenant_b_campaign(client: TestClient, tenants_setup):
    """Verify that Tenant A cannot access or submit decisions on Tenant B's campaign."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    campaign_b_id = tenants_setup["campaign_b"].id

    headers = make_auth_header(tenant_a_id)

    # 1. GET campaign
    get_resp = client.get(f"/api/v1/campaigns/{campaign_b_id}", headers=headers)
    assert get_resp.status_code == 404

    # 2. POST campaign decision
    decision_resp = client.post(
        f"/api/v1/campaigns/{campaign_b_id}/decisions",
        json={"decision": "reject", "reason": "Unauthorized malicious review attempt"},
        headers=headers,
    )
    assert decision_resp.status_code == 404


def test_tenant_a_cannot_simulate_tenant_b_response_action(client: TestClient, tenants_setup):
    """Verify that Tenant A cannot simulate or trigger Tenant B's response actions."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    action_b_id = tenants_setup["action_b"].id

    headers = make_auth_header(tenant_a_id)
    response = client.post(
        f"/api/v1/actions/{action_b_id}/simulate",
        json={"notes": "Unauthorized simulation attempt"},
        headers=headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Response action not found"


def test_demo_reset_disabled_by_default(client: TestClient, tenants_setup, monkeypatch):
    """Verify that /api/v1/demo/reset is disabled and rejects callers."""
    from app.core.config import get_settings
    get_settings.cache_clear()
    monkeypatch.setenv("ALLOW_DEMO_RESET", "false")
    try:
        tenant_a_id = tenants_setup["tenant_a_id"]
        admin_headers = make_auth_header(tenant_a_id, role=ROLE_ORG_ADMIN, actor=f"admin-{tenant_a_id}@tenant.org")

        response = client.post("/api/v1/demo/reset", headers=admin_headers)
        assert response.status_code == 403
        assert "Demo environment reset is disabled" in response.json()["detail"]
    finally:
        get_settings.cache_clear()


def test_unverified_raw_bearer_token_rejected_401(client: TestClient, tenants_setup):
    """P0 Security Test: Unsigned/raw token strings must be strictly rejected with 401."""
    tenant_a_id = tenants_setup["tenant_a_id"]

    # Attacker tries old raw string claiming org_admin
    attacker_raw_token = f"tenant:{tenant_a_id}:role:org_admin:actor:attacker@evil.com"
    response = client.get("/api/v1/overview", headers={"Authorization": f"Bearer {attacker_raw_token}"})
    assert response.status_code == 401
    assert "Invalid authentication token signature" in response.json()["detail"]


def test_forged_jwt_with_wrong_secret_rejected_401(client: TestClient, tenants_setup):
    """P0 Security Test: Attacker forging JWT signed with arbitrary secret key is rejected with 401."""
    tenant_a_id = tenants_setup["tenant_a_id"]

    forged_payload = {
        "iss": "astra-enterprise",
        "sub": "attacker@evil.com",
        "tenant_id": str(tenant_a_id),
        "role": ROLE_ORG_ADMIN,
        "actor": "attacker@evil.com",
        "exp": 9999999999,
    }
    forged_token = jwt.encode(forged_payload, "completely_wrong_secret_key_exceeding_32_bytes!", algorithm="HS256")
    response = client.get("/api/v1/overview", headers={"Authorization": f"Bearer {forged_token}"})
    assert response.status_code == 401
    assert "Invalid authentication token signature" in response.json()["detail"]


def test_expired_jwt_rejected_401(client: TestClient, tenants_setup):
    """P0 Security Test: Expired access token is rejected with 401."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    expired_token = create_access_token(tenant_a_id, expires_delta=timedelta(seconds=-10))

    response = client.get("/api/v1/overview", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    assert "Authentication token has expired" in response.json()["detail"]


def test_read_only_role_rejected_on_mutating_endpoints_403(client: TestClient, tenants_setup):
    """P0 Security Test: Read-only user can inspect data but cannot perform mutating operations."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    brand_a_id = tenants_setup["brand_a"].id
    campaign_b_id = tenants_setup["campaign_b"].id
    action_b_id = tenants_setup["action_b"].id

    ro_headers = make_auth_header(tenant_a_id, role=ROLE_READ_ONLY, actor=f"auditor-{tenant_a_id}@tenant.org")

    # 1. Read-only user CAN read
    get_brand_resp = client.get(f"/api/v1/brands/{brand_a_id}", headers=ro_headers)
    assert get_brand_resp.status_code == 200

    # 2. Read-only user CANNOT create brand
    create_brand_resp = client.post(
        "/api/v1/brands",
        json={"name": "Forbidden Brand Creation", "status": "active"},
        headers=ro_headers,
    )
    assert create_brand_resp.status_code == 403
    assert "Read-only role cannot perform mutating operations" in create_brand_resp.json()["detail"]

    # 3. Read-only user CANNOT add brand asset
    add_asset_resp = client.post(
        f"/api/v1/brands/{brand_a_id}/assets",
        json={"asset_type": "domain", "canonical_value": "forbidden.com"},
        headers=ro_headers,
    )
    assert add_asset_resp.status_code == 403

    # 4. Read-only user CANNOT ingest sightings
    ingest_resp = client.post(
        "/api/v1/sightings:batch",
        json={
            "brand_id": str(brand_a_id),
            "sightings": [{"surface": "web", "source_kind": "crawl", "content": "test"}],
        },
        headers=ro_headers,
    )
    assert ingest_resp.status_code == 403

    # 5. Read-only user CANNOT run analysis jobs
    analysis_resp = client.post(
        "/api/v1/analysis-jobs",
        json={"brand_id": str(brand_a_id)},
        headers=ro_headers,
    )
    assert analysis_resp.status_code == 403


def test_jwt_role_cannot_provision_tenant_membership(client: TestClient, db_session: Session, tenants_setup):
    """A valid JWT cannot invent a user, tenant membership, or elevated role."""
    tenant_a_id = tenants_setup["tenant_a_id"]
    analyst_email = "lead_analyst@nilapay.com"

    unprovisioned = make_auth_header(tenant_a_id, role=ROLE_ORG_ADMIN, actor=analyst_email)
    denied = client.get("/api/v1/overview", headers=unprovisioned)
    assert denied.status_code == 401
    assert db_session.query(User).filter(User.email == analyst_email).first() is None

    provisioned_user = User(id=uuid.uuid4(), email=analyst_email, full_name="Lead Analyst", is_active=True)
    db_session.add(provisioned_user)
    db_session.flush()
    db_session.add(TenantMembership(
        id=uuid.uuid4(), tenant_id=tenant_a_id, user_id=provisioned_user.id, role=ROLE_ANALYST
    ))
    db_session.commit()

    # The JWT claims org_admin, but the persisted membership remains authoritative.
    resp = client.post("/api/v1/demo/reset", headers=unprovisioned)
    assert resp.status_code == 403
    assert "Administrative authorization required" in resp.json()["detail"]
