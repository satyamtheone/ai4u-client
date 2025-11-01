"""Add missing columns to predictions table

Revision ID: 002_missing_columns
Revises: 001_initial
Create Date: 2025-01-01 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_missing_columns'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing customer and order detail columns to predictions table"""

    # Add customer information columns
    op.add_column('predictions', sa.Column('customer_name', sa.String(length=200), nullable=True))
    op.add_column('predictions', sa.Column('customer_phone', sa.String(length=20), nullable=True))
    op.add_column('predictions', sa.Column('customer_address', sa.Text(), nullable=True))
    op.add_column('predictions', sa.Column('customer_city', sa.String(length=100), nullable=True))
    op.add_column('predictions', sa.Column('customer_state', sa.String(length=100), nullable=True))
    op.add_column('predictions', sa.Column('pincode', sa.String(length=10), nullable=True))

    # Add order detail columns
    op.add_column('predictions', sa.Column('payment_mode', sa.String(length=50), nullable=True))
    op.add_column('predictions', sa.Column('courier_name', sa.String(length=100), nullable=True))
    op.add_column('predictions', sa.Column('weight', sa.Float(), nullable=True))
    op.add_column('predictions', sa.Column('quantity', sa.Integer(), nullable=True))
    op.add_column('predictions', sa.Column('invoice_value', sa.Float(), nullable=True))
    op.add_column('predictions', sa.Column('collectable_amount', sa.Float(), nullable=True))

    # Add prediction metadata column
    op.add_column('predictions', sa.Column('confidence_score', sa.Float(), nullable=True))

    # Create indexes
    op.create_index('ix_predictions_pincode', 'predictions', ['pincode'])
    op.create_index('ix_predictions_courier_name', 'predictions', ['courier_name'])


def downgrade() -> None:
    """Remove the added columns"""

    # Drop indexes
    op.drop_index('ix_predictions_courier_name', table_name='predictions')
    op.drop_index('ix_predictions_pincode', table_name='predictions')

    # Drop columns
    op.drop_column('predictions', 'confidence_score')
    op.drop_column('predictions', 'collectable_amount')
    op.drop_column('predictions', 'invoice_value')
    op.drop_column('predictions', 'quantity')
    op.drop_column('predictions', 'weight')
    op.drop_column('predictions', 'courier_name')
    op.drop_column('predictions', 'payment_mode')
    op.drop_column('predictions', 'pincode')
    op.drop_column('predictions', 'customer_state')
    op.drop_column('predictions', 'customer_city')
    op.drop_column('predictions', 'customer_address')
    op.drop_column('predictions', 'customer_phone')
    op.drop_column('predictions', 'customer_name')
