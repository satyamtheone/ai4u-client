"""Initial schema - create all RTO prediction tables

Revision ID: 001_initial
Revises:
Create Date: 2025-01-01 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all RTO prediction tables"""

    # Create predictions table
    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_number', sa.String(length=100), nullable=False),
        sa.Column('prediction_timestamp', sa.DateTime(), nullable=False),
        sa.Column('rto_prediction', sa.Boolean(), nullable=False),
        sa.Column('rto_probability', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(length=50), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('model_version', sa.String(length=50), nullable=True),
        sa.Column('order_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('risk_factors', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('recommendations', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('actual_rto', sa.Boolean(), nullable=True),
        sa.Column('actual_status', sa.String(length=50), nullable=True),
        sa.Column('actual_updated_at', sa.DateTime(), nullable=True),
        sa.Column('batch_id', sa.String(length=100), nullable=True),
        sa.Column('processing_time_ms', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_predictions_order_number', 'predictions', ['order_number'])
    op.create_index('ix_predictions_batch_id', 'predictions', ['batch_id'])
    op.create_index('ix_predictions_prediction_timestamp', 'predictions', ['prediction_timestamp'])
    op.create_index('ix_predictions_risk_level', 'predictions', ['risk_level'])

    # Create model_metadata table
    op.create_table(
        'model_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.Column('model_type', sa.String(length=100), nullable=False),
        sa.Column('training_date', sa.DateTime(), nullable=False),
        sa.Column('training_accuracy', sa.Float(), nullable=False),
        sa.Column('test_accuracy', sa.Float(), nullable=False),
        sa.Column('precision', sa.Float(), nullable=True),
        sa.Column('recall', sa.Float(), nullable=True),
        sa.Column('f1_score', sa.Float(), nullable=True),
        sa.Column('auc_roc', sa.Float(), nullable=True),
        sa.Column('feature_count', sa.Integer(), nullable=True),
        sa.Column('training_samples', sa.Integer(), nullable=True),
        sa.Column('hyperparameters', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('feature_importance', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_model_metadata_model_version', 'model_metadata', ['model_version'])
    op.create_index('ix_model_metadata_is_active', 'model_metadata', ['is_active'])

    # Create courier_performance table
    op.create_table(
        'courier_performance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('courier_name', sa.String(length=100), nullable=False),
        sa.Column('total_deliveries', sa.Integer(), nullable=False),
        sa.Column('successful_deliveries', sa.Integer(), nullable=False),
        sa.Column('rto_count', sa.Integer(), nullable=False),
        sa.Column('rto_rate', sa.Float(), nullable=False),
        sa.Column('avg_delivery_time_days', sa.Float(), nullable=True),
        sa.Column('on_time_delivery_rate', sa.Float(), nullable=True),
        sa.Column('customer_rating', sa.Float(), nullable=True),
        sa.Column('performance_score', sa.Float(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.Column('stats_period_start', sa.DateTime(), nullable=True),
        sa.Column('stats_period_end', sa.DateTime(), nullable=True),
        sa.Column('additional_metrics', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_courier_performance_courier_name', 'courier_performance', ['courier_name'])
    op.create_index('ix_courier_performance_rto_rate', 'courier_performance', ['rto_rate'])

    # Create pincode_analytics table
    op.create_table(
        'pincode_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pincode', sa.String(length=6), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('zone', sa.String(length=50), nullable=True),
        sa.Column('total_orders', sa.Integer(), nullable=False),
        sa.Column('delivered_orders', sa.Integer(), nullable=False),
        sa.Column('rto_orders', sa.Integer(), nullable=False),
        sa.Column('rto_rate', sa.Float(), nullable=False),
        sa.Column('avg_order_value', sa.Float(), nullable=True),
        sa.Column('cod_orders', sa.Integer(), nullable=True),
        sa.Column('prepaid_orders', sa.Integer(), nullable=True),
        sa.Column('risk_category', sa.String(length=50), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.Column('stats_period_start', sa.DateTime(), nullable=True),
        sa.Column('stats_period_end', sa.DateTime(), nullable=True),
        sa.Column('additional_stats', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pincode_analytics_pincode', 'pincode_analytics', ['pincode'])
    op.create_index('ix_pincode_analytics_rto_rate', 'pincode_analytics', ['rto_rate'])
    op.create_index('ix_pincode_analytics_risk_category', 'pincode_analytics', ['risk_category'])

    # Create system_metrics table
    op.create_table(
        'system_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('metric_timestamp', sa.DateTime(), nullable=False),
        sa.Column('total_predictions', sa.Integer(), nullable=False),
        sa.Column('predictions_last_hour', sa.Integer(), nullable=True),
        sa.Column('predictions_last_day', sa.Integer(), nullable=True),
        sa.Column('avg_response_time_ms', sa.Float(), nullable=True),
        sa.Column('error_count', sa.Integer(), nullable=True),
        sa.Column('memory_usage_mb', sa.Float(), nullable=True),
        sa.Column('cpu_usage_percent', sa.Float(), nullable=True),
        sa.Column('model_load_time_seconds', sa.Float(), nullable=True),
        sa.Column('cache_hit_rate', sa.Float(), nullable=True),
        sa.Column('active_connections', sa.Integer(), nullable=True),
        sa.Column('additional_metrics', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_system_metrics_metric_timestamp', 'system_metrics', ['metric_timestamp'])


def downgrade() -> None:
    """Drop all RTO prediction tables"""

    # Drop all indexes first
    op.drop_index('ix_system_metrics_metric_timestamp', table_name='system_metrics')
    op.drop_index('ix_pincode_analytics_risk_category', table_name='pincode_analytics')
    op.drop_index('ix_pincode_analytics_rto_rate', table_name='pincode_analytics')
    op.drop_index('ix_pincode_analytics_pincode', table_name='pincode_analytics')
    op.drop_index('ix_courier_performance_rto_rate', table_name='courier_performance')
    op.drop_index('ix_courier_performance_courier_name', table_name='courier_performance')
    op.drop_index('ix_model_metadata_is_active', table_name='model_metadata')
    op.drop_index('ix_model_metadata_model_version', table_name='model_metadata')
    op.drop_index('ix_predictions_risk_level', table_name='predictions')
    op.drop_index('ix_predictions_prediction_timestamp', table_name='predictions')
    op.drop_index('ix_predictions_batch_id', table_name='predictions')
    op.drop_index('ix_predictions_order_number', table_name='predictions')

    # Drop all tables
    op.drop_table('system_metrics')
    op.drop_table('pincode_analytics')
    op.drop_table('courier_performance')
    op.drop_table('model_metadata')
    op.drop_table('predictions')
