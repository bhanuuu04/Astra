"""Add governance and connector sync state.

Revision ID: 0008_governance_sync
Revises: 0007_users_clerk
Create Date: 2026-10-12
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0008_governance_sync"
down_revision: Union[str, None] = "0007_users_clerk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    connector_cols = [c["name"] for c in inspector.get_columns("connectors")]

    if "last_sync_attempt_at" not in connector_cols:
        op.add_column("connectors", sa.Column("last_sync_attempt_at", sa.DateTime(timezone=True), nullable=True))
    if "sync_state" not in connector_cols:
        op.add_column("connectors", sa.Column("sync_state", sa.JSON(), nullable=False, server_default=sa.text("'{}'")))

    if "brand_claims" not in existing_tables:
        op.create_table(
            "brand_claims",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("tenant_id", sa.Uuid(), nullable=False),
            sa.Column("brand_id", sa.Uuid(), nullable=False),
            sa.Column("official_domain", sa.String(length=253), nullable=False),
            sa.Column("applicant_email", sa.String(length=255), nullable=False),
            sa.Column("email_domain_match", sa.Boolean(), nullable=False),
            sa.Column("legal_entity_name", sa.String(length=255), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False),
            sa.Column("incumbent_brand_id", sa.Uuid(), nullable=True),
            sa.Column("reviewed_by", sa.Uuid(), nullable=True),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("review_notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["brand_id"], ["brands.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["incumbent_brand_id"], ["brands.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("brand_id"),
        )
        op.create_index("ix_brand_claims_tenant_id", "brand_claims", ["tenant_id"])
        op.create_index("ix_brand_claims_brand_id", "brand_claims", ["brand_id"])
        op.create_index("ix_brand_claims_official_domain", "brand_claims", ["official_domain"])

    if "brand_claim_documents" not in existing_tables:
        op.create_table(
            "brand_claim_documents",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("claim_id", sa.Uuid(), nullable=False),
            sa.Column("document_type", sa.String(length=64), nullable=False),
            sa.Column("original_filename", sa.String(length=255), nullable=False),
            sa.Column("content_type", sa.String(length=128), nullable=False),
            sa.Column("object_key", sa.String(length=512), nullable=False),
            sa.Column("sha256", sa.String(length=64), nullable=False),
            sa.Column("review_status", sa.String(length=32), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["claim_id"], ["brand_claims.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("object_key"),
        )
        op.create_index("ix_brand_claim_documents_claim_id", "brand_claim_documents", ["claim_id"])

    if "governance_notices" not in existing_tables:
        op.create_table(
            "governance_notices",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("tenant_id", sa.Uuid(), nullable=False),
            sa.Column("claim_id", sa.Uuid(), nullable=True),
            sa.Column("notice_type", sa.String(length=48), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["claim_id"], ["brand_claims.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_governance_notices_tenant_id", "governance_notices", ["tenant_id"])
        op.create_index("ix_governance_notices_claim_id", "governance_notices", ["claim_id"])


def downgrade() -> None:
    op.drop_table("governance_notices")
    op.drop_table("brand_claim_documents")
    op.drop_table("brand_claims")
    op.drop_column("connectors", "sync_state")
    op.drop_column("connectors", "last_sync_attempt_at")
