import uuid
import pytest
from sqlalchemy import select
from starlette.testclient import TestClient

from app.db.models import Brand, BrandAsset, Sighting, Tenant, User
from app.db.session import SessionLocal
from app.domain.threat_scan_service import generate_candidate_domains
from app.main import app


def test_candidate_domain_generation_includes_typosquats_and_excludes_whitelisted():
    canonical = "vercel.com"
    brand_name = "Vercel"
    official = {"vercel.com", "vercel.app"}
    whitelisted = {"vercelsupport.com"}

    candidates = generate_candidate_domains(
        canonical_domain=canonical,
        brand_name=brand_name,
        official_domains=official,
        whitelisted_domains=whitelisted,
    )

    # Must contain various typosquat vectors
    candidate_str = " ".join(candidates)

    # 1. Repetitions (e.g. vercellll.co or vercell.com)
    assert any("vercell" in c or "verr" in c for c in candidates)

    # 2. Phishing modifiers (e.g. vercel-login, vercel-security)
    assert any("login" in c or "security" in c for c in candidates)

    # 3. Domain hacks (e.g. verce.lo or ver.cel)
    assert any(".co" in c or ".net" in c or ".io" in c for c in candidates)

    # 4. Homoglyphs (e.g. v3rcel, verce1)
    assert any("v3rcel" in c or "verce1" in c or "v0" in c for c in candidates)

    # 5. Must NOT contain canonical, official, or whitelisted domains
    assert "vercel.com" not in candidates
    assert "vercel.app" not in candidates
    assert "vercelsupport.com" not in candidates


def test_sighting_triage_lifecycle_whitelist_dismiss_takedown():
    client = TestClient(app)

    with SessionLocal() as session:
        # Create a test tenant and brand
        tenant = session.scalar(select(Tenant).order_by(Tenant.created_at.asc()))
        if not tenant:
            tenant = Tenant(id=uuid.uuid4(), name="Impersonation Test Tenant")
            session.add(tenant)
            session.commit()

        brand = Brand(id=uuid.uuid4(), tenant_id=tenant.id, name="TestBrand", status="active")
        session.add(brand)
        session.flush()

        # Add initial official asset
        session.add(BrandAsset(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            brand_id=brand.id,
            asset_type="domain",
            canonical_value="testbrand.com",
            verification_status="verified",
        ))

        # Add a suspicious sighting
        suspicious_target = "testbrand-security-login.com"
        sighting = Sighting(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            brand_id=brand.id,
            surface="web",
            source_kind="osint_dns",
            raw_ref=f"https://{suspicious_target}",
            normalized_payload={
                "domain": suspicious_target,
                "target": suspicious_target,
                "target_url": f"https://{suspicious_target}",
                "resolved_ips": ["198.51.100.24"],
                "threat_severity": "CRITICAL",
                "is_phishing": True,
            },
        )
        session.add(sighting)
        session.commit()
        sighting_id = str(sighting.id)
        tenant_id = str(tenant.id)
        brand_id = str(brand.id)

    headers = {"X-Tenant-Id": tenant_id, "X-Actor": "security-analyst@test.local"}

    # 1. Takedown request
    resp_takedown = client.post(
        f"/api/v1/sightings/{sighting_id}/takedown",
        json={"target_provider": "Cloudflare Abuse", "notes": "Credential harvester portal"},
        headers=headers,
    )
    assert resp_takedown.status_code == 200, resp_takedown.text
    takedown_data = resp_takedown.json()
    assert takedown_data["triage_status"] == "takedown_requested"

    # 2. Reopen
    resp_reopen = client.post(f"/api/v1/sightings/{sighting_id}/reopen", headers=headers)
    assert resp_reopen.status_code == 200
    assert resp_reopen.json()["triage_status"] == "active"

    # 3. Dismiss
    resp_dismiss = client.post(
        f"/api/v1/sightings/{sighting_id}/dismiss",
        json={"reason": "Testing false positive suppression"},
        headers=headers,
    )
    assert resp_dismiss.status_code == 200
    assert resp_dismiss.json()["triage_status"] == "dismissed"

    # 4. Claim / Whitelist
    resp_whitelist = client.post(
        f"/api/v1/sightings/{sighting_id}/whitelist",
        json={"reason": "Approved microsite for user security verification"},
        headers=headers,
    )
    assert resp_whitelist.status_code == 200
    wl_data = resp_whitelist.json()
    assert wl_data["triage_status"] == "whitelisted"
    assert wl_data["is_benign"] is True

    # 5. Verify database invariants:
    with SessionLocal() as session:
        updated_sighting = session.get(Sighting, uuid.UUID(sighting_id))
        assert updated_sighting is not None
        assert updated_sighting.normalized_payload.get("is_benign") is True
        assert updated_sighting.normalized_payload.get("triage_status") == "whitelisted"

        # Check that BrandAsset was created for this whitelisted domain
        whitelisted_asset = session.scalar(
            select(BrandAsset).where(
                BrandAsset.brand_id == uuid.UUID(brand_id),
                BrandAsset.canonical_value == suspicious_target,
            )
        )
        assert whitelisted_asset is not None
        assert whitelisted_asset.verification_status == "verified"
