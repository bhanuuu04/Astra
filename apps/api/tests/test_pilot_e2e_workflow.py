import hashlib
import time
import uuid
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import ROLE_ANALYST, ROLE_ORG_ADMIN, create_access_token
from app.db.models import (
    AnalystDecision,
    AuditEvent,
    Base,
    Brand,
    BrandAsset,
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
from app.storage.evidence_storage import (
    load_evidence_content,
    verify_evidence_integrity,
    verify_signed_evidence_token,
)


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


def test_complete_enterprise_pilot_workflow(client: TestClient, db_session: Session):
    """End-to-End Enterprise Pilot Validation:

    Simulates the complete fintech design partner lifecycle for NilaPay:
    1. Tenant & Brand DNA enrollment (official assets)
    2. Authorized ingestion of suspected social impersonator
    3. Cryptographic evidence persistence & verification
    4. Deterministic analysis run & signal generation
    5. Campaign graph correlation via shared UPI pivot
    6. Human-in-the-loop analyst review decision & audit trail
    7. Multi-recipient response draft generation with SHA-256 evidence manifest
    """
    tenant_id = uuid.uuid4()
    tenant = Tenant(id=tenant_id, name="NilaPay Pilot Organization")
    db_session.add(tenant)
    admin_user = User(id=uuid.uuid4(), email="admin@nilapay.com", full_name="Pilot Admin")
    analyst_user = User(id=uuid.uuid4(), email="analyst@nilapay.com", full_name="Pilot Analyst")
    db_session.add_all([admin_user, analyst_user])
    db_session.add_all([
        TenantMembership(id=uuid.uuid4(), tenant_id=tenant_id, user_id=admin_user.id, role=ROLE_ORG_ADMIN),
        TenantMembership(id=uuid.uuid4(), tenant_id=tenant_id, user_id=analyst_user.id, role=ROLE_ANALYST),
    ])
    db_session.commit()

    admin_token = create_access_token(tenant_id, role=ROLE_ORG_ADMIN, actor="admin@nilapay.com")
    analyst_token = create_access_token(tenant_id, role=ROLE_ANALYST, actor="analyst@nilapay.com")

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # ---------------------------------------------------------
    # STEP 1: Enroll Brand DNA (NilaPay Official Identity)
    # ---------------------------------------------------------
    brand_resp = client.post(
        "/api/v1/brands",
        json={"name": "NilaPay Financial Services", "status": "active"},
        headers=admin_headers,
    )
    assert brand_resp.status_code == 201
    brand_data = brand_resp.json()
    brand_id = brand_data["id"]

    # Enroll Official Domain asset
    domain_asset = client.post(
        f"/api/v1/brands/{brand_id}/assets",
        json={"asset_type": "domain", "canonical_value": "nilapay.com"},
        headers=admin_headers,
    )
    assert domain_asset.status_code == 201

    # Enroll Official Instagram handle
    handle_asset = client.post(
        f"/api/v1/brands/{brand_id}/assets",
        json={"asset_type": "handle", "canonical_value": "nilapay_official"},
        headers=admin_headers,
    )
    assert handle_asset.status_code == 201

    # ---------------------------------------------------------
    # STEP 2: Ingest Suspected Impersonation Finding via Contract
    # ---------------------------------------------------------
    finding_text = (
        "URGENT ALERT: Your NilaPay account has been frozen due to KYC non-compliance. "
        "Pay unfreeze fee of 500 INR immediately to fraudster@okhdfcbank or call +919876543210."
    )
    ingest_payload = {
        "brand_id": brand_id,
        "sightings": [
            {
                "surface": "instagram",
                "source_kind": "direct_message",
                "content": finding_text,
                "sender": {"username": "nilapay_kyc_unfreeze_support"},
                "raw_ref": "@nilapay_kyc_unfreeze_support",
                "media_type": "text/plain",
            }
        ],
    }

    ingest_resp = client.post("/api/v1/sightings:batch", json=ingest_payload, headers=analyst_headers)
    assert ingest_resp.status_code == 201
    ingest_data = ingest_resp.json()
    assert ingest_data["ingested_count"] == 1
    sighting_id = ingest_data["sighting_ids"][0]

    # ---------------------------------------------------------
    # STEP 3: Verify Durable Evidence Vault & Cryptographic Hash
    # ---------------------------------------------------------
    evidence_resp = client.get(f"/api/v1/sightings/{sighting_id}/evidence", headers=analyst_headers)
    assert evidence_resp.status_code == 200
    evidence_list = evidence_resp.json()
    assert len(evidence_list) == 1
    evidence_item = evidence_list[0]

    assert evidence_item["verified_integrity"] is True
    assert evidence_item["sha256"] == hashlib.sha256(finding_text.encode("utf-8")).hexdigest()
    assert finding_text in evidence_item["content"]

    # ---------------------------------------------------------
    # STEP 4: Run Deterministic Detectors & Generate Signals
    # ---------------------------------------------------------
    job_resp = client.post(
        "/api/v1/analysis-jobs",
        json={"brand_id": brand_id, "sighting_ids": [sighting_id]},
        headers=analyst_headers,
    )
    assert job_resp.status_code == 201
    job_data = job_resp.json()
    assert job_data["status"] == "completed"
    assert job_data["signals_generated"] > 0
    run_id = job_data["run_id"]

    # Verify explainable signals
    signals_resp = client.get(f"/api/v1/analysis-jobs/{run_id}/signals", headers=analyst_headers)
    assert signals_resp.status_code == 200
    signals = signals_resp.json()
    assert len(signals) > 0
    detector_keys = [s["detector_key"] for s in signals]
    assert "brand_impersonation" in detector_keys or "urgency_lure_pattern" in detector_keys

    # ---------------------------------------------------------
    # STEP 5: Verify Campaign Graph Correlation
    # ---------------------------------------------------------
    campaigns_resp = client.get(f"/api/v1/campaigns?brand_id={brand_id}", headers=analyst_headers)
    assert campaigns_resp.status_code == 200
    campaigns = campaigns_resp.json()
    assert len(campaigns) >= 1
    campaign = campaigns[0]
    campaign_id = campaign["id"]

    # Inspect campaign details & members
    detail_resp = client.get(f"/api/v1/campaigns/{campaign_id}", headers=analyst_headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["campaign"]["member_count"] >= 1
    assert len(detail_data["members"]) >= 1

    # ---------------------------------------------------------
    # STEP 6: Analyst Evaluates & Records Auditable Decision
    # ---------------------------------------------------------
    decision_resp = client.post(
        f"/api/v1/campaigns/{campaign_id}/decisions",
        json={
            "decision": "accept",
            "reason": "Confirmed extortion attempt impersonating NilaPay with fraudulent UPI rail.",
        },
        headers=analyst_headers,
    )
    assert decision_resp.status_code == 200
    assert decision_resp.json()["status"] == "confirmed"

    # Verify AuditEvent was persisted
    audit_events = list(
        db_session.scalars(
            select(AuditEvent).where(
                AuditEvent.tenant_id == tenant_id,
                AuditEvent.entity_id == str(campaign_id),
            )
        ).all()
    )
    assert len(audit_events) >= 1
    assert audit_events[0].actor == "analyst@nilapay.com"
    assert audit_events[0].safe_metadata["decision"] == "accept"

    # ---------------------------------------------------------
    # STEP 7: Generate Multi-Recipient Response Drafts with Evidence Manifest
    # ---------------------------------------------------------
    draft_resp = client.post(
        f"/api/v1/campaigns/{campaign_id}/response-drafts",
        headers=analyst_headers,
    )
    assert draft_resp.status_code == 201
    draft_data = draft_resp.json()
    assert draft_data["campaign_id"] == campaign_id
    assert len(draft_data["drafts"]) >= 1
    assert "manifest" in draft_data
    assert len(draft_data["manifest"]) >= 1
    assert len(draft_data["manifest"][0]["sha256"]) == 64  # Valid SHA-256 evidence manifest

    # Simulate platform response action
    actions = list(
        db_session.scalars(
            select(ResponseAction).where(ResponseAction.campaign_id == uuid.UUID(campaign_id))
        ).all()
    )
    assert len(actions) >= 1
    action_id = actions[0].id

    sim_resp = client.post(
        f"/api/v1/actions/{action_id}/simulate",
        json={"notes": "Pre-flight dry run before platform escalation"},
        headers=analyst_headers,
    )
    assert sim_resp.status_code == 200
    assert sim_resp.json()["status"] == "simulated"
    assert sim_resp.json()["simulated_by"] == "analyst@nilapay.com"
    assert "approved_by" not in sim_resp.json()
    # A dry-run does not mean a real takedown or mitigation happened.
    assert db_session.get(Campaign, uuid.UUID(campaign_id)).status == "confirmed"
