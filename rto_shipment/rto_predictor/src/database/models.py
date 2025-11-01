"""
PostgreSQL Database Models for RTO Prediction System
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()


class Prediction(Base):
    """Store individual prediction results"""
    __tablename__ = 'predictions'

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Order Information
    order_number = Column(String(100), nullable=False, index=True)
    customer_name = Column(String(200))
    customer_phone = Column(String(20))
    customer_address = Column(Text)
    customer_city = Column(String(100))
    customer_state = Column(String(100))
    pincode = Column(String(10), index=True)

    # Order Details
    payment_mode = Column(String(50))
    courier_name = Column(String(100), index=True)
    weight = Column(Float)
    quantity = Column(Integer)
    invoice_value = Column(Float)
    collectable_amount = Column(Float)

    # Prediction Results
    rto_prediction = Column(Boolean, nullable=False)
    rto_probability = Column(Float, nullable=False)
    risk_level = Column(String(50))
    confidence_score = Column(Float)

    # Metadata
    prediction_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    model_version = Column(String(50))
    processing_time_ms = Column(Float)

    # Additional Data (JSON fields)
    risk_factors = Column(JSON)  # List of risk factors
    recommendations = Column(JSON)  # List of recommendations
    feature_importance = Column(JSON)  # Feature importance scores

    # Actual Outcome (for validation)
    actual_rto = Column(Boolean, nullable=True)
    actual_status = Column(String(100), nullable=True)
    outcome_timestamp = Column(DateTime, nullable=True)

    # Batch Information
    batch_id = Column(String(100), index=True, nullable=True)

    # Indexes for common queries
    __table_args__ = (
        Index('ix_predictions_timestamp_risk', 'prediction_timestamp', 'risk_level'),
        Index('ix_predictions_courier_pincode', 'courier_name', 'pincode'),
    )

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'customer_city': self.customer_city,
            'customer_state': self.customer_state,
            'pincode': self.pincode,
            'payment_mode': self.payment_mode,
            'courier_name': self.courier_name,
            'weight': self.weight,
            'quantity': self.quantity,
            'invoice_value': self.invoice_value,
            'rto_prediction': self.rto_prediction,
            'rto_probability': self.rto_probability,
            'risk_level': self.risk_level,
            'confidence_score': self.confidence_score,
            'prediction_timestamp': self.prediction_timestamp.isoformat() if self.prediction_timestamp else None,
            'model_version': self.model_version,
            'risk_factors': self.risk_factors,
            'recommendations': self.recommendations,
            'actual_rto': self.actual_rto,
            'batch_id': self.batch_id
        }


class ModelMetadata(Base):
    """Store model training metadata"""
    __tablename__ = 'model_metadata'

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Model Information
    model_version = Column(String(50), unique=True, nullable=False)
    model_type = Column(String(100))  # RandomForest, GradientBoosting, etc.
    model_path = Column(String(500))

    # Training Metrics
    training_accuracy = Column(Float)
    test_accuracy = Column(Float)
    precision_score = Column(Float)
    recall_score = Column(Float)
    f1_score = Column(Float)
    roc_auc_score = Column(Float)

    # Training Details
    training_samples = Column(Integer)
    feature_count = Column(Integer)
    training_duration_seconds = Column(Float)
    training_timestamp = Column(DateTime, default=datetime.utcnow)

    # Hyperparameters
    hyperparameters = Column(JSON)

    # Feature Information
    feature_names = Column(JSON)
    feature_importance = Column(JSON)

    # Status
    is_active = Column(Boolean, default=True)
    is_production = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    notes = Column(Text)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'model_version': self.model_version,
            'model_type': self.model_type,
            'training_accuracy': self.training_accuracy,
            'test_accuracy': self.test_accuracy,
            'precision_score': self.precision_score,
            'recall_score': self.recall_score,
            'f1_score': self.f1_score,
            'roc_auc_score': self.roc_auc_score,
            'training_samples': self.training_samples,
            'feature_count': self.feature_count,
            'training_timestamp': self.training_timestamp.isoformat() if self.training_timestamp else None,
            'is_active': self.is_active,
            'is_production': self.is_production,
            'feature_importance': self.feature_importance,
        }


class CourierPerformance(Base):
    """Store courier performance statistics"""
    __tablename__ = 'courier_performance'

    id = Column(Integer, primary_key=True, autoincrement=True)

    courier_name = Column(String(100), nullable=False, index=True)

    # Metrics
    total_deliveries = Column(Integer, default=0)
    successful_deliveries = Column(Integer, default=0)
    rto_count = Column(Integer, default=0)
    success_rate = Column(Float)
    rto_rate = Column(Float)
    avg_delivery_time_hours = Column(Float)

    # Time Period
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Geographic breakdown (JSON)
    city_wise_performance = Column(JSON)
    state_wise_performance = Column(JSON)

    __table_args__ = (
        Index('ix_courier_period', 'courier_name', 'period_start', 'period_end'),
    )

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'courier_name': self.courier_name,
            'total_deliveries': self.total_deliveries,
            'successful_deliveries': self.successful_deliveries,
            'rto_count': self.rto_count,
            'success_rate': self.success_rate,
            'rto_rate': self.rto_rate,
            'avg_delivery_time_hours': self.avg_delivery_time_hours,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }


class PincodeAnalytics(Base):
    """Store pincode-level analytics"""
    __tablename__ = 'pincode_analytics'

    id = Column(Integer, primary_key=True, autoincrement=True)

    pincode = Column(String(10), nullable=False, unique=True, index=True)
    city = Column(String(100))
    state = Column(String(100), index=True)

    # Metrics
    total_orders = Column(Integer, default=0)
    rto_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    rto_rate = Column(Float)
    success_rate = Column(Float)

    # Risk Classification
    risk_level = Column(String(50))  # Low, Medium, High, Critical
    risk_score = Column(Float)

    # Payment Mode Analysis
    cod_orders = Column(Integer, default=0)
    prepaid_orders = Column(Integer, default=0)
    cod_rto_rate = Column(Float)
    prepaid_rto_rate = Column(Float)

    # Courier Performance (JSON)
    courier_breakdown = Column(JSON)

    # Time-based metrics
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'pincode': self.pincode,
            'city': self.city,
            'state': self.state,
            'total_orders': self.total_orders,
            'rto_count': self.rto_count,
            'success_count': self.success_count,
            'rto_rate': self.rto_rate,
            'success_rate': self.success_rate,
            'risk_level': self.risk_level,
            'risk_score': self.risk_score,
            'cod_rto_rate': self.cod_rto_rate,
            'prepaid_rto_rate': self.prepaid_rto_rate,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }


class SystemMetrics(Base):
    """Store system performance metrics"""
    __tablename__ = 'system_metrics'

    id = Column(Integer, primary_key=True, autoincrement=True)

    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Prediction Metrics
    total_predictions = Column(Integer, default=0)
    predictions_per_minute = Column(Float)
    avg_processing_time_ms = Column(Float)

    # System Resources
    cpu_percent = Column(Float)
    memory_usage_mb = Column(Float)
    disk_usage_percent = Column(Float)

    # Model Performance
    model_version = Column(String(50))
    prediction_accuracy = Column(Float)  # If validation data available

    # API Metrics
    api_requests_count = Column(Integer, default=0)
    api_error_count = Column(Integer, default=0)
    api_avg_response_time_ms = Column(Float)

    # Circuit Breaker State
    circuit_breaker_state = Column(String(50))

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'total_predictions': self.total_predictions,
            'predictions_per_minute': self.predictions_per_minute,
            'avg_processing_time_ms': self.avg_processing_time_ms,
            'cpu_percent': self.cpu_percent,
            'memory_usage_mb': self.memory_usage_mb,
            'model_version': self.model_version,
            'prediction_accuracy': self.prediction_accuracy,
            'api_requests_count': self.api_requests_count,
            'api_error_count': self.api_error_count
        }
