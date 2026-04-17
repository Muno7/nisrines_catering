"""drop is_active from products

Revision ID: d1e2f3a4b5c6
Revises: c5d6e7f8a9b0
Create Date: 2026-04-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'd1e2f3a4b5c6'
down_revision = 'c5d6e7f8a9b0'
branch_labels = None
depends_on = None


def upgrade():
    # Backfill any legacy rows where status was never set
    op.execute(
        "UPDATE products SET status = CASE WHEN is_active = TRUE THEN 'active' ELSE 'inactive' END "
        "WHERE status IS NULL"
    )
    op.drop_column('products', 'is_active')


def downgrade():
    op.add_column('products', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.execute("UPDATE products SET is_active = CASE WHEN status = 'active' THEN TRUE ELSE FALSE END")