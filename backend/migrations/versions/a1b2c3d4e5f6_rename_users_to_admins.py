"""rename users table to admins

Revision ID: a1b2c3d4e5f6
Revises: 84c1f9d2a7b6
Create Date: 2026-04-03 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '84c1f9d2a7b6'
branch_labels = None
depends_on = None


def upgrade():
    # Keep existing login records while aligning the table name with the
    # admin-only authentication model.
    op.rename_table('users', 'admins')


def downgrade():
    op.rename_table('admins', 'users')
