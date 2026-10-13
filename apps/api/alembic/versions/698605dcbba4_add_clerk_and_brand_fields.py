"""add_clerk_and_brand_fields

Revision ID: 698605dcbba4
Revises: 0006_auth_and_settings
Create Date: 2026-10-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '698605dcbba4'
down_revision: Union[str, None] = '0006_auth_and_settings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add primary_brand_id to tenants
    op.add_column('tenants', sa.Column('primary_brand_id', sa.Uuid(), nullable=True))

    # Add Clerk and onboarding fields to users
    op.add_column('users', sa.Column('clerk_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('composio_user_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('users', sa.Column('primary_brand_id', sa.Uuid(), nullable=True))
    op.create_index(op.f('ix_users_clerk_id'), 'users', ['clerk_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_clerk_id'), table_name='users')
    op.drop_column('users', 'primary_brand_id')
    op.drop_column('users', 'onboarding_completed')
    op.drop_column('users', 'composio_user_id')
    op.drop_column('users', 'clerk_id')
    op.drop_column('tenants', 'primary_brand_id')
