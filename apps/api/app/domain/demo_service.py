import json
from pathlib import Path
from typing import Any, Dict
import uuid

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models import (
    AnalysisRun,
    AnalystDecision,
    AuditEvent,
    Brand,
    BrandAsset,
    Campaign,
    CampaignEdgeLegacy as CampaignEdge,
    CampaignMember,
    EvidenceObject,
    Indicator,
    ResponseAction,
    Sighting,
    SightingIndicator,
    Signal,
    Tenant,
)
from app.domain.brand_service import add_brand_asset
from app.domain.sighting_service import ingest_batch
from app.schemas.brand import BrandAssetCreate
from app.schemas.demo import DemoResetResponse
from app.schemas.sighting import SightingBatchRequest, SightingCreate

DEMO_TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def load_fixtures_file() -> Dict[str, Any]:
    # Try looking in app/seed/fixtures.json or packages/fixture-contract/fixtures.json
    paths = [
        Path(__file__).resolve().parent.parent / "seed" / "fixtures.json",
        Path(__file__).resolve().parent.parent.parent.parent / "packages" / "fixture-contract" / "fixtures.json",
    ]
    for p in paths:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
    return {}


def reset_demo_environment(session: Session) -> DemoResetResponse:
    fixtures = load_fixtures_file()

    # 1. Clean up existing demo data
    session.execute(delete(AuditEvent).where(AuditEvent.tenant_id == DEMO_TENANT_ID))
    session.execute(delete(AnalystDecision).where(AnalystDecision.tenant_id == DEMO_TENANT_ID))
    session.execute(delete(Indicator).where(Indicator.tenant_id == DEMO_TENANT_ID))
    session.execute(delete(AnalysisRun).where(AnalysisRun.tenant_id == DEMO_TENANT_ID))
    session.execute(delete(Campaign).where(Campaign.tenant_id == DEMO_TENANT_ID))
    session.execute(delete(Sighting).where(Sighting.tenant_id == DEMO_TENANT_ID))
    session.execute(delete(Brand).where(Brand.tenant_id == DEMO_TENANT_ID))
    session.execute(delete(Tenant).where(Tenant.id == DEMO_TENANT_ID))
    session.flush()

    # 2. Re-create Demo Tenant
    tenant = Tenant(id=DEMO_TENANT_ID, name="Astra Security Demo SOC")
    session.add(tenant)
    session.flush()

    # 3. Seed Brand DNA
    brand_data = fixtures.get("brand", {})
    brand_id = uuid.uuid4()
    brand_name = brand_data.get("name") or brand_data.get("brandName", "NilaPay")
    brand = Brand(
        id=brand_id,
        tenant_id=DEMO_TENANT_ID,
        name=brand_name,
        status="active",
    )
    session.add(brand)
    session.flush()

    assets_count = 0
    # Domains
    for domain in brand_data.get("officialDomains", []):
        add_brand_asset(session, brand_id, BrandAssetCreate(asset_type="domain", canonical_value=domain))
        assets_count += 1

    # Handles
    for handle_item in brand_data.get("officialHandles", []):
        handle_val = f"{handle_item.get('platform')}:{handle_item.get('handle')}"
        add_brand_asset(session, brand_id, BrandAssetCreate(asset_type="handle", canonical_value=handle_val))
        assets_count += 1

    # Mobile apps
    for app_item in brand_data.get("officialMobileApps", []):
        app_val = f"{app_item.get('platform')}:{app_item.get('packageName') or app_item.get('identifier')}"
        add_brand_asset(session, brand_id, BrandAssetCreate(asset_type="mobile_app", canonical_value=app_val))
        assets_count += 1

    # Executives
    for exec_item in brand_data.get("protectedExecutives", []):
        exec_val = f"{exec_item.get('name')} ({exec_item.get('role')})"
        add_brand_asset(session, brand_id, BrandAssetCreate(asset_type="executive", canonical_value=exec_val))
        assets_count += 1

    # Phone
    if brand_data.get("supportPhone"):
        add_brand_asset(session, brand_id, BrandAssetCreate(asset_type="phone", canonical_value=brand_data["supportPhone"]))
        assets_count += 1

    # UPI IDs
    for upi in brand_data.get("upiIds", []):
        add_brand_asset(session, brand_id, BrandAssetCreate(asset_type="upi_id", canonical_value=upi))
        assets_count += 1

    # 4. Ingest Seed Sightings
    sightings_data = fixtures.get("sightings", [])
    batch_sightings: list[SightingCreate] = []

    for s in sightings_data:
        batch_sightings.append(
            SightingCreate(
                brand_id=brand_id,
                surface=s.get("surface", "web"),
                source_kind=s.get("sourceKind", "direct_message"),
                content=s.get("content", ""),
                sender=s.get("sender"),
                raw_ref=s.get("id"),
                normalized_payload={
                    "expectedCategory": s.get("expectedCategory"),
                    "expectedSeverity": s.get("expectedSeverity"),
                    "isBenign": s.get("isBenign", False),
                    "expectedCampaign": s.get("expectedCampaign"),
                    "sharedPivots": s.get("sharedPivots", []),
                },
                evidence_text=s.get("content", ""),
            )
        )

    batch_resp = ingest_batch(
        session,
        SightingBatchRequest(
            tenant_id=DEMO_TENANT_ID,
            brand_id=brand_id,
            sightings=batch_sightings,
        ),
    )

    # 5. Create Seed Campaign for Malicious Sighting
    campaign_title = "NilaPay KYC Scam Campaign — Multi-surface"
    expected_camps = fixtures.get("expectedCampaigns", [])
    if expected_camps:
        campaign_title = expected_camps[0].get("title", campaign_title)

    campaign = Campaign(
        id=uuid.uuid4(),
        tenant_id=DEMO_TENANT_ID,
        brand_id=brand_id,
        title=campaign_title,
        status="proposed",
        risk_score=94.0,
    )
    session.add(campaign)
    session.flush()

    # Link member sightings (the 4 malicious ones)
    if batch_resp.sighting_ids:
        for s_id in batch_resp.sighting_ids[:4]:  # First 4 are malicious
            member = CampaignMember(
                id=uuid.uuid4(),
                campaign_id=campaign.id,
                sighting_id=s_id,
                membership_reason="Shared threat vector & brand impersonation",
            )
            session.add(member)

    # 6. Seed CampaignEdges from fixtures
    if expected_camps and expected_camps[0].get("edges"):
        edges_data = expected_camps[0]["edges"]
        # Map sighting index/id to actual sighting UUIDs if available
        sighting_id_map = {}
        for idx, s in enumerate(sightings_data):
            if idx < len(batch_resp.sighting_ids):
                sighting_id_map[s.get("id")] = str(batch_resp.sighting_ids[idx])

        for edge in edges_data:
            from_ep = sighting_id_map.get(edge.get("fromSightingId"), edge.get("fromSightingId", "node_1"))
            to_ep = sighting_id_map.get(edge.get("toSightingId"), edge.get("toSightingId", "node_2"))
            c_edge = CampaignEdge(
                id=uuid.uuid4(),
                campaign_id=campaign.id,
                from_endpoint=from_ep,
                to_endpoint=to_ep,
                pivot_type=edge.get("pivotType", "indicator"),
                confidence=float(edge.get("confidence", 0.9)),
                evidence_ids=[edge.get("reason", "Shared indicator pivot")],
                review_status="proposed",
            )
            session.add(c_edge)

    # Add Audit log
    audit = AuditEvent(
        id=uuid.uuid4(),
        tenant_id=DEMO_TENANT_ID,
        actor="system_demo_seeder",
        event_type="demo.environment_reset",
        entity_type="tenant",
        entity_id=str(DEMO_TENANT_ID),
        safe_metadata={"seeded_sightings": len(batch_sightings), "brand": brand_name},
    )
    session.add(audit)
    session.commit()

    evidence_count = len(batch_sightings)
    rogue_apps_count = len(fixtures.get("rogueApps", []))

    return DemoResetResponse(
        success=True,
        message="Demo environment successfully reset with deterministic fixtures.",
        tenant_id=DEMO_TENANT_ID,
        brand_id=brand_id,
        brand_name=brand_name,
        assets_seeded=assets_count,
        sightings_seeded=len(batch_sightings),
        indicators_seeded=batch_resp.indicators_extracted,
        evidence_seeded=evidence_count,
        rogue_apps_seeded=rogue_apps_count,
    )
