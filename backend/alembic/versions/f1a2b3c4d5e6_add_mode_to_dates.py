"""add mode to dates

Revision ID: f1a2b3c4d5e6
Revises: d4e5f6a7b8c9
Create Date: 2026-05-21

"""
from alembic import op
import sqlalchemy as sa

revision = 'f1a2b3c4d5e6'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('dates', sa.Column('mode', sa.String(), nullable=False, server_default='pg13'))


def downgrade() -> None:
    op.drop_column('dates', 'mode')
