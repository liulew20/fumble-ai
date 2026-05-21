"""add new outcome enum values

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-05-21

"""
import sqlalchemy as sa
from alembic import op

revision = 'a1b2c3d4e5f6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ALTER TYPE ADD VALUE cannot run inside a transaction block in PostgreSQL
    conn = op.get_bind()
    conn = conn.execution_options(isolation_level="AUTOCOMMIT")
    conn.execute(sa.text("ALTER TYPE outcomeenum ADD VALUE IF NOT EXISTS 'dating'"))
    conn.execute(sa.text("ALTER TYPE outcomeenum ADD VALUE IF NOT EXISTS 'failed'"))
    conn.execute(sa.text("ALTER TYPE outcomeenum ADD VALUE IF NOT EXISTS 'netflix_and_chill'"))


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; downgrade is a no-op
    pass
