from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TenantMembership(Base):
    __tablename__ = "tenant_memberships"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="analyst")  # org_admin, brand_manager, analyst, reviewer, read_only
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("tenant_id", "user_id", name="uq_tenant_user_membership"),
    )


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="enrolling")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Connector(Base):
    __tablename__ = "connectors"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    connector_type: Mapped[str] = mapped_column(String(64), nullable=False)  # meta_graph, google_play, virustotal, telegram_bot, x_twitter
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="unconfigured")  # active, degraded, error, revoked, unconfigured
    auth_config_vault_ref: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Reference to encrypted secret manager
    permitted_scopes: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True, default=[])
    rate_limit_rpm: Mapped[Optional[int]] = mapped_column(nullable=True, default=60)
    last_health_check_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_successful_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BrandAsset(Base):
    __tablename__ = "brand_assets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    brand_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("brands.id", ondelete="CASCADE"), index=True)
    asset_type: Mapped[str] = mapped_column(String(64), nullable=False)  # domain, social_handle, mobile_app_pkg, cert_fingerprint, logo, phone, upi, executive
    canonical_value: Mapped[str] = mapped_column(Text, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(32), nullable=False, default="unverified")  # verified, pending_challenge, unverified
    verification_method: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # dns_txt, oauth_proof, manual_analyst
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    asset_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column("metadata", JSON, nullable=True, default={})
    object_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("tenant_id", "brand_id", "asset_type", "canonical_value", name="uq_brand_asset"),
    )


class Sighting(Base):
    __tablename__ = "sightings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    brand_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("brands.id", ondelete="CASCADE"), index=True)
    surface: Mapped[str] = mapped_column(String(32), nullable=False)  # x_twitter, instagram, telegram, web, apk, linkedin
    source_kind: Mapped[str] = mapped_column(String(32), nullable=False, default="fixture")  # direct_message, post, web_crawl, fixture
    observed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    normalized_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Finding(Base):
    """Normalized findings replacing ad-hoc sightings with enhanced provenance tracking."""
    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    connector_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("connectors.id", ondelete="SET NULL"), nullable=True, index=True)
    source_kind: Mapped[str] = mapped_column(String(64), nullable=False)  # social_profile, mobile_app, web_domain, messaging
    surface: Mapped[str] = mapped_column(String(64), nullable=False)  # instagram, x, google_play, third_party_apk, telegram
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    target_identifier: Mapped[str] = mapped_column(Text, nullable=False)  # @fake_handle, com.scam.app, hxxps://phish.example
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    data_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="live")  # live, synthetic_demo, manual_upload
    raw_evidence_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("evidence_objects.id", ondelete="SET NULL"), nullable=True)
    normalized_attributes: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default={})
    triage_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")  # pending, investigating, confirmed_threat, false_positive, needs_evidence
    triage_priority: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    assigned_analyst_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("tenant_id", "surface", "external_id", name="uq_finding_source"),
    )


class MobileAppFinding(Base):
    """Mobile App Radar forensic details."""
    __tablename__ = "mobile_app_findings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    finding_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    package_name: Mapped[str] = mapped_column(String(255), nullable=False)
    app_title: Mapped[str] = mapped_column(Text, nullable=False)
    publisher_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    store_source: Mapped[str] = mapped_column(String(64), nullable=False)  # google_play, apkmirror, apkpure, direct_download
    store_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    version_string: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    cert_sha256_fingerprint: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    official_cert_match: Mapped[Optional[bool]] = mapped_column(nullable=True, default=False)
    apk_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    malware_detections: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default={})
    permissions_declared: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True, default=[])
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())



class EvidenceObject(Base):
    __tablename__ = "evidence_objects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    sighting_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("sightings.id", ondelete="CASCADE"), index=True)
    object_key: Mapped[str] = mapped_column(String(255), nullable=False)
    media_type: Mapped[str] = mapped_column(String(64), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    source_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    provenance: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)


class Indicator(Base):
    __tablename__ = "indicators"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    indicator_type: Mapped[str] = mapped_column(String(32), nullable=False)  # handle, domain, upi, phone, apk_package, cert_hash, image_hash
    canonical_value: Mapped[str] = mapped_column(String(255), nullable=False)
    fingerprint: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("tenant_id", "indicator_type", "canonical_value", name="uq_indicators_tenant_type_val"),
    )


class SightingIndicator(Base):
    __tablename__ = "sighting_indicators"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    sighting_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("sightings.id", ondelete="CASCADE"), index=True)
    indicator_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("indicators.id", ondelete="CASCADE"), index=True)
    extraction_method: Mapped[str] = mapped_column(String(32), nullable=False, default="regex")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    brand_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("brands.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="completed")  # running, completed, failed
    detector_versions: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    thresholds: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    formula_snapshot: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Signal(Base):
    __tablename__ = "signals"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    sighting_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("sightings.id", ondelete="CASCADE"), index=True)
    run_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("analysis_runs.id", ondelete="SET NULL"), nullable=True, index=True)
    detector_key: Mapped[str] = mapped_column(String(64), nullable=False)
    detector_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    score: Mapped[float] = mapped_column(Float, nullable=False)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_ids: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    feature_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    brand_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("brands.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="proposed")  # proposed, under_review, confirmed, rejected
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    first_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CampaignCluster(Base):
    """Campaign correlation clusters with deterministic cluster keys."""
    __tablename__ = "campaign_clusters"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    cluster_key: Mapped[str] = mapped_column(String(128), nullable=False)  # SHA-256 root indicator hash
    display_title: Mapped[str] = mapped_column(String(255), nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    calculated_risk: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())



class CampaignMember(Base):
    __tablename__ = "campaign_members"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    sighting_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("sightings.id", ondelete="CASCADE"), index=True)
    membership_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CampaignEdge(Base):
    __tablename__ = "campaign_edges"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    cluster_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("campaign_clusters.id", ondelete="CASCADE"), nullable=False, index=True)
    source_finding_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    target_finding_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    shared_indicator_type: Mapped[str] = mapped_column(String(64), nullable=False)  # ip, registrar, cert_fingerprint, payment_id
    shared_indicator_value: Mapped[str] = mapped_column(Text, nullable=False)
    link_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    analyst_review_status: Mapped[str] = mapped_column(String(32), nullable=False, default="proposed")  # accepted, rejected, proposed
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("cluster_id", "source_finding_id", "target_finding_id", "shared_indicator_type", name="uq_campaign_edge"),
    )


# Legacy campaign edge model (kept for backward compatibility during migration)
class CampaignEdgeLegacy(Base):
    __tablename__ = "campaign_edges_legacy"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    from_endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    to_endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    pivot_type: Mapped[str] = mapped_column(String(32), nullable=False)  # upi, phone, domain, logo_hash, apk_package
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    evidence_ids: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    review_status: Mapped[str] = mapped_column(String(32), nullable=False, default="proposed")  # proposed, confirmed, rejected
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ResponseCase(Base):
    """Human-governed response actions with approval workflow."""
    __tablename__ = "response_cases"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    finding_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    cluster_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("campaign_clusters.id", ondelete="SET NULL"), nullable=True)
    target_provider: Mapped[str] = mapped_column(String(64), nullable=False)  # meta_takedown, google_abuse, cloudflare_abuse, registrar_dmca
    lifecycle_state: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")  # draft, pending_approval, approved, submitted, acknowledged, resolved, rejected
    drafted_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_channel: Mapped[str] = mapped_column(String(32), nullable=False, default="manual_portal")  # manual_portal, api_automated, email_legal
    external_case_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_manifest_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    submission_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default={})
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())



class AnalystDecision(Base):
    __tablename__ = "analyst_decisions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    edge_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("campaign_edges.id", ondelete="SET NULL"), nullable=True, index=True)
    actor: Mapped[str] = mapped_column(String(160), nullable=False)
    decision: Mapped[str] = mapped_column(String(32), nullable=False)  # accept, reject, benign, split, confirm_edge, reject_edge
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ResponseAction(Base):
    __tablename__ = "response_actions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    action_type: Mapped[str] = mapped_column(String(32), nullable=False)  # platform_takedown, registrar_takedown, payment_block, customer_warning
    draft_payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")  # draft, approved, simulated, submitted
    approved_by: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    simulated_by: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    simulated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    actor: Mapped[str] = mapped_column(String(160), nullable=False)
    request_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    safe_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    """Enhanced immutable audit log with before/after state tracking."""
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)  # finding_status_change, takedown_approved, connector_added, evidence_exported
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    before_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    after_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

