"""Placeholder for missing revision

Revision ID: f2c7f0a4b123
Revises: c4a4b4d0a9d7
Create Date: 2026-02-03 11:15:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'f2c7f0a4b123'
down_revision = 'c4a4b4d0a9d7'
branch_labels = None
depends_on = None


def upgrade():
    # This revision exists only to preserve Alembic history for databases that
    # already reference the missing id; do not delete or squash it casually.
    pass


def downgrade():
    pass
