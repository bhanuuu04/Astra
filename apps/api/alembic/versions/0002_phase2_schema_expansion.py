"""Expand schema with Brand Assets, Evidence, Indicators, Signals, Edges, and Decisions.

Revision ID: 0002_phase2_schema_expansion
Revises: 0001_platform_foundation
Create Date: 2026-10-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_phase2_schema_expansion"
down_revision: Union[str, None] = "0001_platform_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Expand sightings and campaigns
    op.add_column("sightings", sa.Column("observed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("sightings", sa.Column("raw_ref", sa.String(length=255), nullable=True))
    op.add_column("sightings", sa.Column("normalized_payload", sa.JSON(), nullable=True))

    op.add_column("campaigns", sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("campaigns", sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True))

    # 2. Brand Assets
    op.create_table(
        "brand_assets",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("brand_id", sa.Uuid(), sa.ForeignKey("brands.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asset_type", sa.String(length=32), nullable=False),
        sa.Column("canonical_value", sa.String(length=255), nullable=False),
        sa.Column("object_key", sa.String(length=255), nullable=True),
        sa.Column("sha256", sa.String(length=64), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_brand_assets_brand_id", "brand_assets", ["brand_id"])

    # 3. Evidence Objects
    op.create_table(
        "evidence_objects",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("sighting_id", sa.Uuid(), sa.ForeignKey("sightings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("object_key", sa.String(length=255), nullable=False),
        sa.Column("media_type", sa.String(length=64), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("source_ref", sa.String(length=255), nullable=True),
        sa.Column("provenance", sa.JSON(), nullable=True),
    )
    op.create_index("ix_evidence_objects_sighting_id", "evidence_objects", ["sighting_id"])
    op.create_index("ix_evidence_objects_sha256", "evidence_objects", ["sha256"])

    # 4. Indicators
    op.create_table(
        "indicators",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("indicator_type", sa.String(length=32), nullable=False),
        sa.Column("canonical_value", sa.String(length=255), nullable=False),
        sa.Column("fingerprint", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "indicator_type", "canonical_value", name="uq_indicators_tenant_type_val"),
    )
    op.create_index("ix_indicators_tenant_id", "indicators", ["tenant_id"])

    # 5. Sighting Indicators
    op.create_table(
        "sighting_indicators",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("sighting_id", sa.Uuid(), sa.ForeignKey("sightings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("indicator_id", sa.Uuid(), sa.ForeignKey("indicators.id", ondelete="CASCADE"), nullable=False),
        sa.Column("extraction_method", sa.String(length=32), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
    )
    op.create_index("ix_sighting_indicators_sighting_id", "sighting_indicators", ["sighting_id"])
    op.create_index("ix_sighting_indicators_indicator_id", "sighting_indicators", ["indicator_id"])

    # 6. Analysis Runs
    op.create_table(
        "analysis_runs",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("brand_id", sa.Uuid(), sa.ForeignKey("brands.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("detector_versions", sa.JSON(), nullable=True),
        sa.Column("thresholds", sa.JSON(), nullable=True),
        sa.Column("formula_snapshot", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_analysis_runs_tenant_id", "analysis_runs", ["tenant_id"])
    op.create_index("ix_analysis_runs_brand_id", "analysis_runs", ["brand_id"])

    # 7. Signals
    op.create_table(
        "signals",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("sighting_id", sa.Uuid(), sa.ForeignKey("sightings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("run_id", sa.Uuid(), sa.ForeignKey("analysis_runs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("detector_key", sa.String(length=64), nullable=False),
        sa.Column("detector_version", sa.String(length=32), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("threshold", sa.Float(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("evidence_ids", sa.JSON(), nullable=True),
        sa.Column("feature_values", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_signals_sighting_id", "signals", ["sighting_id"])
    op.create_index("ix_signals_run_id", "signals", ["run_id"])

    # 8. Campaign Members
    op.create_table(
        "campaign_members",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("campaign_id", sa.Uuid(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sighting_id", sa.Uuid(), sa.ForeignKey("sightings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("membership_reason", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_campaign_members_campaign_id", "campaign_members", ["campaign_id"])
    op.create_index("ix_campaign_members_sighting_id", "campaign_members", ["sighting_id"])

    # 9. Campaign Edges
    op.create_table(
        "campaign_edges",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("campaign_id", sa.Uuid(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_endpoint", sa.String(length=255), nullable=False),
        sa.Column("to_endpoint", sa.String(length=255), nullable=False),
        sa.Column("pivot_type", sa.String(length=32), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("evidence_ids", sa.JSON(), nullable=True),
        sa.Column("review_status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_campaign_edges_campaign_id", "campaign_edges", ["campaign_id"])

    # 10. Analyst Decisions
    op.create_table(
        "analyst_decisions",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("campaign_id", sa.Uuid(), sa.ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True),
        sa.Column("edge_id", sa.Uuid(), sa.ForeignKey("campaign_edges.id", ondelete="SET NULL"), nullable=True),
        sa.Column("actor", sa.String(length=160), nullable=False),
        sa.Column("decision", sa.String(length=32), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_analyst_decisions_tenant_id", "analyst_decisions", ["tenant_id"])
    op.create_index("ix_analyst_decisions_campaign_id", "analyst_decisions", ["campaign_id"])
    op.create_index("ix_analyst_decisions_edge_id", "analyst_decisions", ["edge_id"])

    # 11. Response Actions
    op.create_table(
        "response_actions",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("campaign_id", sa.Uuid(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action_type", sa.String(length=32), nullable=False),
        sa.Column("draft_payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("approved_by", sa.String(length=160), nullable=True),
        sa.Column("simulated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_response_actions_campaign_id", "response_actions", ["campaign_id"])

    # 12. Audit Events
    op.create_table(
        "audit_events",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor", sa.String(length=160), nullable=False),
        sa.Column("request_id", sa.String(length=64), nullable=True),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=32), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=True),
        sa.Column("safe_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_events_tenant_id", "audit_events", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_events_tenant_id", table_name="audit_events")
    op.drop_table("audit_events")

    op.drop_index("ix_response_actions_campaign_id", table_name="response_actions")
    op.drop_table("response_actions")

    op.drop_index("ix_analyst_decisions_edge_id", table_name="analyst_decisions")
    op.drop_index("ix_analyst_decisions_campaign_id", table_name="analyst_decisions")
    op.drop_index("ix_analyst_decisions_tenant_id", table_name="analyst_decisions")
    op.drop_table("analyst_decisions")

    op.drop_index("ix_campaign_edges_campaign_id", table_name="campaign_edges")
    op.drop_table("campaign_edges")

    op.drop_index("ix_campaign_members_sighting_id", table_name="campaign_members")
    op.drop_index("ix_campaign_members_campaign_id", table_name="campaign_members")
    op.drop_table("campaign_members")

    op.drop_index("ix_signals_run_id", table_name="signals")
    op.drop_index("ix_signals_sighting_id", table_name="signals")
    op.drop_table("signals")

    op.drop_index("ix_analysis_runs_brand_id", table_name="analysis_runs")
    op.drop_index("ix_analysis_runs_tenant_id", table_name="analysis_runs")
    op.drop_table("analysis_runs")

    op.drop_index("ix_sighting_indicators_indicator_id", table_name="sighting_indicators")
    op.drop_index("ix_sighting_indicators_sighting_id", table_name="sighting_indicators")
    op.drop_table("sighting_indicators")

    op.drop_index("ix_indicators_tenant_id", table_name="indicators")
    op.drop_table("indicators")

    op.drop_index("ix_evidence_objects_sha256", table_name="evidence_objects")
    op.drop_index("ix_evidence_objects_sighting_id", table_name="evidence_objects")
    op.drop_table("evidence_objects")

    op.drop_index("ix_brand_assets_brand_id", table_name="brand_assets")
    op.drop_table("brand_assets")

    op.drop_column("campaigns", "last_seen_at")
    op.drop_column("campaigns", "first_seen_at")

    op.drop_column("sightings", "normalized_payload")
    op.drop_column("sightings", "raw_ref")
    op.drop_column("sightings", "observed_at")
