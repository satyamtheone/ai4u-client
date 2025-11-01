"""Fix created_at and updated_at columns with defaults

Revision ID: 003_fix_timestamps
Revises: 002_missing_columns
Create Date: 2025-01-01 12:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = '003_fix_timestamps'
down_revision: Union[str, None] = '002_missing_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Set default values for created_at and updated_at columns"""

    # Add default for created_at if it doesn't have one
    op.alter_column('predictions', 'created_at',
                    existing_type=sa.DateTime(),
                    server_default=sa.text('CURRENT_TIMESTAMP'),
                    nullable=False)

    # Add default for updated_at if it doesn't have one
    op.alter_column('predictions', 'updated_at',
                    existing_type=sa.DateTime(),
                    server_default=sa.text('CURRENT_TIMESTAMP'),
                    nullable=False)


def downgrade() -> None:
    """Remove defaults from created_at and updated_at"""

    op.alter_column('predictions', 'created_at',
                    existing_type=sa.DateTime(),
                    server_default=None,
                    nullable=False)

    op.alter_column('predictions', 'updated_at',
                    existing_type=sa.DateTime(),
                    server_default=None,
                    nullable=False)
