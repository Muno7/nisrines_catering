"""Make product category required

Revision ID: e6f7a8b9c0d1
Revises: d1e2f3a4b5c6
Create Date: 2026-05-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "e6f7a8b9c0d1"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    null_count = bind.execute(
        sa.text("SELECT COUNT(*) FROM products WHERE category_id IS NULL")
    ).scalar() or 0

    if null_count:
        fallback_slug = "uncategorized"
        fallback_id = bind.execute(
            sa.text("SELECT id FROM categories WHERE slug = :slug"),
            {"slug": fallback_slug},
        ).scalar()

        if fallback_id is None:
            next_order = bind.execute(
                sa.text("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories")
            ).scalar() or 1
            bind.execute(
                sa.text(
                    "INSERT INTO categories (name, slug, sort_order, active, created_at, updated_at) "
                    "VALUES (:name, :slug, :sort_order, :active, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
                ),
                {
                    "name": "Uncategorized",
                    "slug": fallback_slug,
                    "sort_order": next_order,
                    "active": True,
                },
            )
            fallback_id = bind.execute(
                sa.text("SELECT id FROM categories WHERE slug = :slug"),
                {"slug": fallback_slug},
            ).scalar()

        bind.execute(
            sa.text(
                "UPDATE products SET category_id = :category_id "
                "WHERE category_id IS NULL"
            ),
            {"category_id": fallback_id},
        )

    with op.batch_alter_table("products", schema=None) as batch_op:
        batch_op.alter_column(
            "category_id",
            existing_type=sa.Integer(),
            nullable=False,
        )


def downgrade():
    with op.batch_alter_table("products", schema=None) as batch_op:
        batch_op.alter_column(
            "category_id",
            existing_type=sa.Integer(),
            nullable=True,
        )
