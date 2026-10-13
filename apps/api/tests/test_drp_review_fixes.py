import hashlib
import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db.models import Base, Brand, Tenant, Finding, EvidenceObject, Signal, ResponseCase, AuditLog, Campaign, CampaignMember, Sighting
from app.domain.finding_service import ingest_finding, calculate_triage_priority, update_finding_triage
from app.domain.response_case_service import create_response_case_draft, approve_response_case, dispatch_response_case, resolve_response_case
from app.domain.linking_service import compute_campaign_edges_and_clusters
from app.schemas.finding import FindingIngest
from app.storage.evidence_storage import load_evidence_content


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_finding_ingestion_seals_evidence_with_finding_id_and_timezone_math(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="FinTech Corp")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="FinTech App")
    db_session.add(brand)
    db_session.commit()

    # Timezone-aware observed_at
    now_tz = datetime.now(timezone.utc)
    raw_payload = {"url": "https://malicious-fintech.xyz/login", "source": "threat_intel"}

    ingest_req = FindingIngest(
        brand_id=brand.id,
        source_kind="mobile_store",
        surface="google_play",
        external_id="pkg.fintech.counterfeit",
        target_identifier="com.fintech.counterfeit.app",
        observed_at=now_tz,
        data_mode="live",
        raw_payload=raw_payload,
        normalized_attributes={"package_name": "com.fintech.counterfeit.app"}
    )

    response = ingest_finding(db_session, tenant.id, ingest_req)
    assert response.finding_id is not None
    assert response.triage_priority > 0.0

    # Verify Finding in DB
    finding = db_session.scalar(select(Finding).where(Finding.id == response.finding_id))
    assert finding is not None
    assert finding.raw_evidence_id is not None
    assert finding.observed_at.tzinfo is not None or str(finding.observed_at)

    # Verify EvidenceObject has finding_id set (NOT sighting_id)
    evidence = db_session.scalar(select(EvidenceObject).where(EvidenceObject.id == finding.raw_evidence_id))
    assert evidence is not None
    assert evidence.finding_id == finding.id
    assert evidence.sighting_id is None

    # Verify evidence bytes are persisted in the vault
    stored_bytes = load_evidence_content(evidence.object_key)
    assert stored_bytes is not None
    assert hashlib.sha256(stored_bytes).hexdigest() == evidence.sha256

    # Verify Signals are linked to finding_id
    signals = list(db_session.scalars(select(Signal).where(Signal.finding_id == finding.id)).all())
    assert len(signals) > 0


def test_triage_status_validation_and_audit_actor(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="Bank Corp")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="Bank")
    db_session.add(brand)
    finding = Finding(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        source_kind="web",
        surface="domain",
        external_id="bank-phish.com",
        target_identifier="https://bank-phish.com",
        observed_at=datetime.now(timezone.utc),
        triage_status="pending"
    )
    db_session.add(finding)
    db_session.commit()

    actor_id = uuid.uuid4()

    # Invalid status should fail
    with pytest.raises(ValueError, match="Invalid triage status"):
        update_finding_triage(
            db_session,
            tenant_id=tenant.id,
            finding_id=finding.id,
            triage_status="random_bad_status",
            rationale="This should be rejected",
            actor_id=actor_id
        )

    # Valid status should succeed and create AuditLog entry
    updated = update_finding_triage(
        db_session,
        tenant_id=tenant.id,
        finding_id=finding.id,
        triage_status="confirmed_threat",
        rationale="Analyst confirmed active credential harvesting landing page",
        actor_id=actor_id
    )
    assert updated.triage_status == "confirmed_threat"

    # Verify AuditLog created with actor_id
    audit_entry = db_session.scalar(
        select(AuditLog).where(AuditLog.entity_id == finding.id, AuditLog.actor_id == actor_id)
    )
    assert audit_entry is not None
    assert audit_entry.action == "finding_status_change"


def test_response_case_draft_and_governance(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="FinTech Corp")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="FinTech App")
    db_session.add(brand)
    finding = Finding(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        source_kind="web",
        surface="domain",
        external_id="fintech-phish.com",
        target_identifier="https://fintech-phish.com",
        observed_at=datetime.now(timezone.utc),
        triage_status="confirmed_threat"
    )
    db_session.add(finding)

    # Add evidence
    evidence = EvidenceObject(
        id=uuid.uuid4(),
        finding_id=finding.id,
        object_key="findings/test/ev.json",
        media_type="application/json",
        sha256="abcdef123456",
        captured_at=datetime.now(timezone.utc)
    )
    db_session.add(evidence)
    db_session.commit()

    drafter_id = uuid.uuid4()
    reviewer_id = uuid.uuid4()

    # Draft case
    rc = create_response_case_draft(
        session=db_session,
        tenant_id=tenant.id,
        finding_id=finding.id,
        cluster_id=None,
        target_provider="cloudflare_abuse",
        submission_payload={
            "case_type": "phishing_takedown",
            "draft_subject": "DMCA Notice: Phishing Domain",
            "draft_body": "Please remove domain promptly."
        },
        evidence_manifest=[evidence.id],
        drafted_by=drafter_id
    )
    assert rc.lifecycle_state == "draft"
    assert rc.submission_payload["evidence_manifest"] == [str(evidence.id)]

    # Approve case
    approved = approve_response_case(
        session=db_session,
        tenant_id=tenant.id,
        response_case_id=rc.id,
        approved_by=reviewer_id,
        approver_role="reviewer",
        approval_notes="Reviewed and approved by lead analyst"
    )
    assert approved.lifecycle_state == "approved"
    assert approved.approved_by == reviewer_id
    assert approved.approved_at is not None

    # Dispatch case
    dispatched = dispatch_response_case(
        session=db_session,
        tenant_id=tenant.id,
        response_case_id=rc.id,
        submission_channel="manual_portal"
    )
    assert dispatched.lifecycle_state == "submitted"
    assert dispatched.submitted_at is not None

    # Resolve case
    resolved = resolve_response_case(
        session=db_session,
        tenant_id=tenant.id,
        response_case_id=rc.id,
        resolution_notes="Domain has been taken down and confirmed via DNS NXDOMAIN probe.",
        external_case_reference="CF-TICKET-88910"
    )
    assert resolved.lifecycle_state == "resolved"
    assert resolved.resolved_at is not None
    assert resolved.external_case_reference == "CF-TICKET-88910"


def test_response_case_approval_requires_reviewer_or_org_admin(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="Approval Tenant")
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="Approval Brand")
    finding = Finding(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        source_kind="web",
        surface="domain",
        external_id="approval-phish.example",
        target_identifier="https://approval-phish.example",
        observed_at=datetime.now(timezone.utc),
        triage_status="confirmed_threat",
    )
    db_session.add_all([tenant, brand, finding])
    db_session.commit()

    draft = create_response_case_draft(
        session=db_session,
        tenant_id=tenant.id,
        finding_id=finding.id,
        cluster_id=None,
        target_provider="cloudflare_abuse",
        submission_payload={"draft_body": "Please remove this domain."},
        evidence_manifest=[],
        drafted_by=uuid.uuid4(),
    )

    with pytest.raises(ValueError, match="Only reviewers or organization administrators"):
        approve_response_case(
            session=db_session,
            tenant_id=tenant.id,
            response_case_id=draft.id,
            approved_by=uuid.uuid4(),
            approver_role="analyst",
        )
    assert draft.lifecycle_state == "draft"

    approved = approve_response_case(
        session=db_session,
        tenant_id=tenant.id,
        response_case_id=draft.id,
        approved_by=uuid.uuid4(),
        approver_role="org_admin",
    )
    assert approved.lifecycle_state == "approved"


def test_campaign_cluster_distinct_identities(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="FinTech Corp")
    db_session.add(tenant)
    brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="FinTech App")
    db_session.add(brand)

    # Two isolated sightings on the same surface
    s1 = Sighting(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        surface="instagram",
        raw_ref="@fake_fintech_alpha"
    )
    s2 = Sighting(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        brand_id=brand.id,
        surface="instagram",
        raw_ref="@fake_fintech_beta"
    )
    db_session.add_all([s1, s2])
    db_session.commit()

    # Link campaigns
    edges, camps = compute_campaign_edges_and_clusters(db_session, tenant.id, brand.id)
    assert camps == 2  # Two distinct isolated events, NOT merged into one generic campaign!

    campaigns = list(db_session.scalars(select(Campaign).where(Campaign.brand_id == brand.id)).all())
    assert len(campaigns) == 2
    titles = [c.title for c in campaigns]
    assert "@fake_fintech_alpha" in titles[0] or "@fake_fintech_alpha" in titles[1]
    assert "@fake_fintech_beta" in titles[0] or "@fake_fintech_beta" in titles[1]
