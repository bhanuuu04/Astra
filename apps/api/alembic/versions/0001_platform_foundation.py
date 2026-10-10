"""Create ASTRA platform foundation tables."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_platform_foundation"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "brands",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_brands_tenant_id", "brands", ["tenant_id"])
    op.create_table(
        "sightings",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("brand_id", sa.Uuid(), sa.ForeignKey("brands.id", ondelete="CASCADE"), nullable=False),
        sa.Column("surface", sa.String(length=32), nullable=False),
        sa.Column("source_kind", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_sightings_tenant_id", "sightings", ["tenant_id"])
    op.create_index("ix_sightings_brand_id", "sightings", ["brand_id"])
    op.create_table(
        "campaigns",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("brand_id", sa.Uuid(), sa.ForeignKey("brands.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("risk_score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_campaigns_tenant_id", "campaigns", ["tenant_id"])
    op.create_index("ix_campaigns_brand_id", "campaigns", ["brand_id"])


def downgrade() -> None:
    op.drop_index("ix_campaigns_brand_id", table_name="campaigns")
    op.drop_index("ix_campaigns_tenant_id", table_name="campaigns")
    op.drop_table("campaigns")
    op.drop_index("ix_sightings_brand_id", table_name="sightings")
    op.drop_index("ix_sightings_tenant_id", table_name="sightings")
    op.drop_table("sightings")
    op.drop_index("ix_brands_tenant_id", table_name="brands")
    op.drop_table("brands")
    op.drop_table("tenants")
