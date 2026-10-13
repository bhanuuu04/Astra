"""Add clerk and onboarding fields to users.

Revision ID: 0007_users_clerk
Revises: 0006_auth_and_settings
Create Date: 2026-10-12
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_users_clerk"
down_revision: Union[str, None] = "0006_auth_and_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use inspect/catch in case columns were already added in partial run
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [c["name"] for c in inspector.get_columns("users")]

    if "clerk_id" not in existing_columns:
        op.add_column("users", sa.Column("clerk_id", sa.String(length=255), nullable=True))
    if "composio_user_id" not in existing_columns:
        op.add_column("users", sa.Column("composio_user_id", sa.String(length=255), nullable=True))
    if "onboarding_completed" not in existing_columns:
        op.add_column("users", sa.Column("onboarding_completed", sa.Boolean(), server_default=sa.false(), nullable=False))
    if "primary_brand_id" not in existing_columns:
        op.add_column("users", sa.Column("primary_brand_id", sa.Uuid(), nullable=True))

    existing_tenant_cols = [c["name"] for c in inspector.get_columns("tenants")]
    if "primary_brand_id" not in existing_tenant_cols:
        op.add_column("tenants", sa.Column("primary_brand_id", sa.Uuid(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "primary_brand_id")
    op.drop_column("users", "onboarding_completed")
    op.drop_column("users", "composio_user_id")
    op.drop_column("users", "clerk_id")
