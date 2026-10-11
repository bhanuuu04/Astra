"""Record simulated actor separately from approval.

Revision ID: 0004_response_simulation_identity
Revises: 0003_add_users_and_memberships
Create Date: 2026-10-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_response_simulation_identity"
down_revision: Union[str, None] = "0003_add_users_and_memberships"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("response_actions", sa.Column("simulated_by", sa.String(length=160), nullable=True))


def downgrade() -> None:
    op.drop_column("response_actions", "simulated_by")
