"""Add Arabic name to products

Revision ID: c4a4b4d0a9d7
Revises: d9a5a4cb73f7
Create Date: 2026-01-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4a4b4d0a9d7'
down_revision = 'd9a5a4cb73f7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.add_column(sa.Column('name_ar', sa.String(length=255), nullable=True))


def downgrade():
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.drop_column('name_ar')

