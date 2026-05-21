"""rename agent_a/b_id to agent_1/2_id and add error to statusenum

Revision ID: c5d6e7f8a9b0
Revises: 3f7a2b1c9e50
Create Date: 2026-05-03 13:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, Sequence[str], None] = '3f7a2b1c9e50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('dates', 'agent_a_id', new_column_name='agent_1_id')
    op.alter_column('dates', 'agent_b_id', new_column_name='agent_2_id')
    # PostgreSQL 12+ allows adding enum values inside a transaction
    op.execute(sa.text("ALTER TYPE statusenum ADD VALUE IF NOT EXISTS 'error'"))


def downgrade() -> None:
    op.alter_column('dates', 'agent_1_id', new_column_name='agent_a_id')
    op.alter_column('dates', 'agent_2_id', new_column_name='agent_b_id')
    # PostgreSQL does not support removing enum values; skipping enum downgrade
