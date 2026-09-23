"""Add product selling unit.

Revision ID: e1f2a3b4c5d6
Revises: e6f7a8b9c0d1
Create Date: 2026-09-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "e1f2a3b4c5d6"
down_revision = "e6f7a8b9c0d1"
branch_labels = None
depends_on = None


def upgrade():
    # A server default safely backfills every existing product and lets an
    # older application process continue inserting products during a rollout.
    op.add_column(
        "products",
        sa.Column(
            "order_unit",
            sa.String(length=20),
            nullable=False,
            server_default="each",
        ),
    )


def downgrade():
    op.drop_column("products", "order_unit")
