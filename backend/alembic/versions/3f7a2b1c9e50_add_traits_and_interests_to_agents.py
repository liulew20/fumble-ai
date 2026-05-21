"""add traits and interests to agents

Revision ID: 3f7a2b1c9e50
Revises: e113e3d3fb28
Create Date: 2026-05-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '3f7a2b1c9e50'
down_revision: Union[str, Sequence[str], None] = 'e113e3d3fb28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('agents', sa.Column('traits', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('agents', sa.Column('interests', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.drop_column('agents', 'personality')
    op.drop_column('agents', 'owner_id')


def downgrade() -> None:
    op.add_column('agents', sa.Column('owner_id', sa.String(), nullable=True))
    op.add_column('agents', sa.Column('personality', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.drop_column('agents', 'interests')
    op.drop_column('agents', 'traits')
