"""Add hashed_password to users and create tenant_settings table.

Revision ID: 0006_auth_and_settings
Revises: 0005_drp_platform_schema
Create Date: 2026-10-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006_auth_and_settings"
down_revision: Union[str, None] = "0005_drp_platform_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add hashed_password column to users table
    op.add_column("users", sa.Column("hashed_password", sa.String(length=255), nullable=True))

    # 2. Create tenant_settings table
    op.create_table(
        "tenant_settings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("quarantine_threshold", sa.Integer(), nullable=False, server_default="80"),
        sa.Column("slack_webhook_url", sa.String(length=512), nullable=True),
        sa.Column("alert_critical_only", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("notification_email", sa.String(length=255), nullable=True),
        sa.Column("auto_quarantine_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", name="uq_tenant_settings_tenant_id"),
    )
    op.create_index("ix_tenant_settings_tenant_id", "tenant_settings", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_tenant_settings_tenant_id", table_name="tenant_settings")
    op.drop_table("tenant_settings")
    op.drop_column("users", "hashed_password")
