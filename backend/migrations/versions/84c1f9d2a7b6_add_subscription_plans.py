"""Add subscription plans

Revision ID: 84c1f9d2a7b6
Revises: 7f3a2c9e2b1d
Create Date: 2026-02-04 00:00:00.000000

"""

import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "84c1f9d2a7b6"
down_revision = "7f3a2c9e2b1d"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "subscription_plans",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("audience", sa.String(length=20), nullable=False),
        sa.Column("days_per_month", sa.Integer(), nullable=False),
        sa.Column("price_plat_du_jour", sa.Integer(), nullable=False),
        sa.Column("price_with_salad", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "audience",
            "days_per_month",
            name="uq_subscription_plans_audience_days",
        ),
    )

    subscription_plans = sa.table(
        "subscription_plans",
        sa.column("id", sa.String),
        sa.column("audience", sa.String),
        sa.column("days_per_month", sa.Integer),
        sa.column("price_plat_du_jour", sa.Integer),
        sa.column("price_with_salad", sa.Integer),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )

    now = datetime.utcnow()
    op.bulk_insert(
        subscription_plans,
        [
            {
                "id": str(uuid.uuid4()),
                "audience": "person",
                "days_per_month": 20,
                "price_plat_du_jour": 160,
                "price_with_salad": 190,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "audience": "person",
                "days_per_month": 24,
                "price_plat_du_jour": 192,
                "price_with_salad": 228,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "audience": "family",
                "days_per_month": 8,
                "price_plat_du_jour": 192,
                "price_with_salad": 224,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "audience": "family",
                "days_per_month": 12,
                "price_plat_du_jour": 288,
                "price_with_salad": 336,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "audience": "family",
                "days_per_month": 16,
                "price_plat_du_jour": 384,
                "price_with_salad": 448,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "audience": "family",
                "days_per_month": 20,
                "price_plat_du_jour": 480,
                "price_with_salad": 554,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "audience": "family",
                "days_per_month": 24,
                "price_plat_du_jour": 576,
                "price_with_salad": 665,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade():
    op.drop_table("subscription_plans")

