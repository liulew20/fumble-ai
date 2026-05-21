"""add avatar column to agents

Revision ID: d4e5f6a7b8c9
Revises: c5d6e7f8a9b0
Create Date: 2026-05-18 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c5d6e7f8a9b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('agents', sa.Column('avatar', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('agents', 'avatar')
