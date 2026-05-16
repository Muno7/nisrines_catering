"""make priceFamilyCents nullable

Revision ID: c5d6e7f8a9b0
Revises: b2c3d4e5f6a7
Create Date: 2026-04-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'c5d6e7f8a9b0'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('products', 'priceFamilyCents', existing_type=sa.Integer(), nullable=True)
    # Existing zero values represented "no family option"; NULL now carries that
    # meaning so the public API keeps returning the single-price `priceCents` shape.
    op.execute('UPDATE products SET "priceFamilyCents" = NULL WHERE "priceFamilyCents" = 0')


def downgrade():
    op.execute('UPDATE products SET "priceFamilyCents" = 0 WHERE "priceFamilyCents" IS NULL')
    op.alter_column('products', 'priceFamilyCents', existing_type=sa.Integer(), nullable=False)
