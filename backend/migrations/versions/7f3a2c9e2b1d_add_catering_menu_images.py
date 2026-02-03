"""Add catering menu images

Revision ID: 7f3a2c9e2b1d
Revises: c4a4b4d0a9d7
Create Date: 2026-02-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7f3a2c9e2b1d'
down_revision = 'f2c7f0a4b123'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'catering_menu_images',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('image', sa.Text(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('catering_menu_images')
