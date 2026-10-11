"""DRP Platform Schema - Phase 0 & 1 Foundation.

Revision ID: 0005_drp_platform_schema
Revises: 0004_response_sim_identity
Create Date: 2026-10-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005_drp_platform_schema"
down_revision: Union[str, None] = "0004_response_sim_identity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create connectors table
    op.create_table(
        "connectors",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("connector_type", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="unconfigured"),
        sa.Column("auth_config_vault_ref", sa.Text(), nullable=True),
        sa.Column("permitted_scopes", postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default="[]"),
        sa.Column("rate_limit_rpm", sa.Integer(), nullable=True, server_default="60"),
        sa.Column("last_health_check_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_successful_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_connectors_tenant_id"), "connectors", ["tenant_id"])

    # 2. Upgrade brand_assets table
    op.add_column("brand_assets", sa.Column("tenant_id", sa.Uuid(), nullable=True))
    op.add_column("brand_assets", sa.Column("verification_status", sa.String(length=32), nullable=False, server_default="unverified"))
    op.add_column("brand_assets", sa.Column("verification_method", sa.String(length=64), nullable=True))
    op.add_column("brand_assets", sa.Column("verified_by", sa.Uuid(), nullable=True))
    op.add_column("brand_assets", sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default="{}"))
    
    # Backfill tenant_id from brand_id
    op.execute("""
        UPDATE brand_assets ba
        SET tenant_id = b.tenant_id
        FROM brands b
        WHERE ba.brand_id = b.id
    """)
    
    op.alter_column("brand_assets", "tenant_id", nullable=False)
    op.alter_column("brand_assets", "asset_type", type_=sa.String(length=64))
    op.alter_column("brand_assets", "canonical_value", type_=sa.Text())
    
    op.create_foreign_key("fk_brand_assets_tenant", "brand_assets", "tenants", ["tenant_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("fk_brand_assets_verified_by", "brand_assets", "users", ["verified_by"], ["id"], ondelete="SET NULL")
    op.create_index(op.f("ix_brand_assets_tenant_id"), "brand_assets", ["tenant_id"])
    
    # Create unique constraint
    op.create_unique_constraint("uq_brand_asset", "brand_assets", ["tenant_id", "brand_id", "asset_type", "canonical_value"])

    # 3. Create findings table (new normalized sightings)
    op.create_table(
        "findings",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("brand_id", sa.Uuid(), nullable=False),
        sa.Column("connector_id", sa.Uuid(), nullable=True),
        sa.Column("source_kind", sa.String(length=64), nullable=False),
        sa.Column("surface", sa.String(length=64), nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("target_identifier", sa.Text(), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("collected_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("data_mode", sa.String(length=32), nullable=False, server_default="live"),
        sa.Column("raw_evidence_id", sa.Uuid(), nullable=True),
        sa.Column("normalized_attributes", postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default="{}"),
        sa.Column("triage_status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("triage_priority", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("assigned_analyst_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["brand_id"], ["brands.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["connector_id"], ["connectors.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["raw_evidence_id"], ["evidence_objects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_analyst_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "surface", "external_id", name="uq_finding_source")
    )
    op.create_index(op.f("ix_findings_tenant_id"), "findings", ["tenant_id"])
    op.create_index(op.f("ix_findings_brand_id"), "findings", ["brand_id"])
    op.create_index(op.f("ix_findings_connector_id"), "findings", ["connector_id"])

    # 4. Create mobile_app_findings table
    op.create_table(
        "mobile_app_findings",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("finding_id", sa.Uuid(), nullable=False),
        sa.Column("package_name", sa.String(length=255), nullable=False),
        sa.Column("app_title", sa.Text(), nullable=False),
        sa.Column("publisher_name", sa.Text(), nullable=True),
        sa.Column("store_source", sa.String(length=64), nullable=False),
        sa.Column("store_url", sa.Text(), nullable=True),
        sa.Column("version_string", sa.String(length=64), nullable=True),
        sa.Column("cert_sha256_fingerprint", sa.String(length=64), nullable=True),
        sa.Column("official_cert_match", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("apk_sha256", sa.String(length=64), nullable=True),
        sa.Column("malware_detections", postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default="{}"),
        sa.Column("permissions_declared", postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["finding_id"], ["findings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_mobile_app_findings_finding_id"), "mobile_app_findings", ["finding_id"])

    # 5. Create campaign_clusters table (new campaign model)
    op.create_table(
        "campaign_clusters",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("brand_id", sa.Uuid(), nullable=False),
        sa.Column("cluster_key", sa.String(length=128), nullable=False),
        sa.Column("display_title", sa.String(length=255), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("calculated_risk", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["brand_id"], ["brands.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_campaign_clusters_tenant_id"), "campaign_clusters", ["tenant_id"])
    op.create_index(op.f("ix_campaign_clusters_brand_id"), "campaign_clusters", ["brand_id"])

    # 6. Rename old campaign_edges to campaign_edges_legacy
    op.rename_table("campaign_edges", "campaign_edges_legacy")

    # 7. Create new campaign_edges table
    op.create_table(
        "campaign_edges",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("cluster_id", sa.Uuid(), nullable=False),
        sa.Column("source_finding_id", sa.Uuid(), nullable=False),
        sa.Column("target_finding_id", sa.Uuid(), nullable=False),
        sa.Column("shared_indicator_type", sa.String(length=64), nullable=False),
        sa.Column("shared_indicator_value", sa.Text(), nullable=False),
        sa.Column("link_confidence", sa.Float(), nullable=False),
        sa.Column("analyst_review_status", sa.String(length=32), nullable=False, server_default="proposed"),
        sa.Column("reviewed_by", sa.Uuid(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["cluster_id"], ["campaign_clusters.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_finding_id"], ["findings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_finding_id"], ["findings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cluster_id", "source_finding_id", "target_finding_id", "shared_indicator_type", name="uq_campaign_edge")
    )
    op.create_index(op.f("ix_campaign_edges_cluster_id"), "campaign_edges", ["cluster_id"])

    # 8. Create response_cases table
    op.create_table(
        "response_cases",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("finding_id", sa.Uuid(), nullable=False),
        sa.Column("cluster_id", sa.Uuid(), nullable=True),
        sa.Column("target_provider", sa.String(length=64), nullable=False),
        sa.Column("lifecycle_state", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("drafted_by", sa.Uuid(), nullable=False),
        sa.Column("approved_by", sa.Uuid(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("submission_channel", sa.String(length=32), nullable=False, server_default="manual_portal"),
        sa.Column("external_case_reference", sa.Text(), nullable=True),
        sa.Column("evidence_manifest_hash", sa.String(length=64), nullable=False),
        sa.Column("submission_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default="{}"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["finding_id"], ["findings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cluster_id"], ["campaign_clusters.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["drafted_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_response_cases_tenant_id"), "response_cases", ["tenant_id"])
    op.create_index(op.f("ix_response_cases_finding_id"), "response_cases", ["finding_id"])

    # 9. Create audit_logs table (enhanced audit trail)
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=False),
        sa.Column("before_state", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("after_state", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_audit_logs_tenant_id"), "audit_logs", ["tenant_id"])


def downgrade() -> None:
    # Drop in reverse order
    op.drop_index(op.f("ix_audit_logs_tenant_id"), table_name="audit_logs")
    op.drop_table("audit_logs")
    
    op.drop_index(op.f("ix_response_cases_finding_id"), table_name="response_cases")
    op.drop_index(op.f("ix_response_cases_tenant_id"), table_name="response_cases")
    op.drop_table("response_cases")
    
    op.drop_index(op.f("ix_campaign_edges_cluster_id"), table_name="campaign_edges")
    op.drop_table("campaign_edges")
    
    # Restore old campaign_edges
    op.rename_table("campaign_edges_legacy", "campaign_edges")
    
    op.drop_index(op.f("ix_campaign_clusters_brand_id"), table_name="campaign_clusters")
    op.drop_index(op.f("ix_campaign_clusters_tenant_id"), table_name="campaign_clusters")
    op.drop_table("campaign_clusters")
    
    op.drop_index(op.f("ix_mobile_app_findings_finding_id"), table_name="mobile_app_findings")
    op.drop_table("mobile_app_findings")
    
    op.drop_index(op.f("ix_findings_connector_id"), table_name="findings")
    op.drop_index(op.f("ix_findings_brand_id"), table_name="findings")
    op.drop_index(op.f("ix_findings_tenant_id"), table_name="findings")
    op.drop_table("findings")
    
    # Revert brand_assets changes
    op.drop_constraint("uq_brand_asset", "brand_assets", type_="unique")
    op.drop_index(op.f("ix_brand_assets_tenant_id"), table_name="brand_assets")
    op.drop_constraint("fk_brand_assets_verified_by", "brand_assets", type_="foreignkey")
    op.drop_constraint("fk_brand_assets_tenant", "brand_assets", type_="foreignkey")
    op.drop_column("brand_assets", "metadata")
    op.drop_column("brand_assets", "verified_by")
    op.drop_column("brand_assets", "verification_method")
    op.drop_column("brand_assets", "verification_status")
    op.drop_column("brand_assets", "tenant_id")
    op.alter_column("brand_assets", "canonical_value", type_=sa.String(length=255))
    op.alter_column("brand_assets", "asset_type", type_=sa.String(length=32))
    
    op.drop_index(op.f("ix_connectors_tenant_id"), table_name="connectors")
    op.drop_table("connectors")
