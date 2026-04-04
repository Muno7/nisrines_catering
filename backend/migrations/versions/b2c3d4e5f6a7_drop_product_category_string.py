"""drop redundant product category string column

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-04 00:00:00.000000

"""
from alembic import op


revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('products') as batch_op:
        batch_op.drop_column('category')


def downgrade():
    import sqlalchemy as sa
    with op.batch_alter_table('products') as batch_op:
        batch_op.add_column(sa.Column('category', sa.String(100), nullable=True))
