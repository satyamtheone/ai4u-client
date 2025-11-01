"""
Database Service Layer for RTO Prediction System
Handles all database operations with PostgreSQL
"""

from sqlalchemy import create_engine, and_, or_, desc, func
from sqlalchemy.orm import sessionmaker, Session, scoped_session
from sqlalchemy.pool import NullPool, QueuePool
from contextlib import contextmanager
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
import os

from src.database.models import (
    Base, Prediction, ModelMetadata, CourierPerformance,
    PincodeAnalytics, SystemMetrics
)

logger = logging.getLogger(__name__)


class DatabaseService:
    """
    Centralized database service for all database operations
    Thread-safe with connection pooling
    """

    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        """Singleton pattern to ensure only one database connection pool"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, database_url: Optional[str] = None):
        """Initialize database connection"""

        # Only initialize once
        if self._initialized:
            return

        # Get database URL from environment or parameter
        self.database_url = database_url or os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/rto_predictions'
        )

        try:
            # Create engine with connection pooling
            self.engine = create_engine(
                self.database_url,
                pool_pre_ping=True,  # Verify connections before using
                pool_size=10,  # Max connections in pool
                max_overflow=20,  # Additional connections when pool is full
                pool_recycle=3600,  # Recycle connections after 1 hour
                echo=False  # Set to True for SQL debugging
            )

            # Create session factory
            self.SessionLocal = scoped_session(
                sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            )

            # Create tables if they don't exist
            self.create_tables()

            logger.info("Database service initialized successfully")
            self._initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    def create_tables(self):
        """Create all tables in the database"""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created/verified successfully")
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            raise

    def drop_tables(self):
        """Drop all tables (use with caution!)"""
        Base.metadata.drop_all(bind=self.engine)
        logger.warning("All database tables dropped")

    @contextmanager
    def get_session(self) -> Session:
        """
        Context manager for database sessions
        Automatically commits on success, rolls back on error
        """
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()

    # =========================================================================
    # PREDICTION CRUD OPERATIONS
    # =========================================================================

    def save_prediction(self, prediction_data: Dict[str, Any], batch_id: Optional[str] = None) -> int:
        """
        Save a single prediction to database

        Args:
            prediction_data: Dictionary containing prediction details
            batch_id: Optional batch identifier

        Returns:
            ID of the saved prediction
        """
        with self.get_session() as session:
            prediction = Prediction(
                order_number=prediction_data.get('order_number'),
                customer_name=prediction_data.get('customer_name'),
                customer_phone=prediction_data.get('customer_phone'),
                customer_address=prediction_data.get('customer_address'),
                customer_city=prediction_data.get('customer_city'),
                customer_state=prediction_data.get('customer_state'),
                pincode=prediction_data.get('pincode'),
                payment_mode=prediction_data.get('payment_mode'),
                courier_name=prediction_data.get('courier_name'),
                weight=prediction_data.get('weight'),
                quantity=prediction_data.get('quantity'),
                invoice_value=prediction_data.get('invoice_value'),
                collectable_amount=prediction_data.get('collectable_amount'),
                rto_prediction=prediction_data.get('rto_prediction'),
                rto_probability=prediction_data.get('rto_probability'),
                risk_level=prediction_data.get('risk_level'),
                confidence_score=prediction_data.get('confidence_score'),
                model_version=prediction_data.get('model_version'),
                processing_time_ms=prediction_data.get('processing_time_ms'),
                risk_factors=prediction_data.get('risk_factors'),
                recommendations=prediction_data.get('recommendations'),
                feature_importance=prediction_data.get('feature_importance'),
                batch_id=batch_id
            )

            session.add(prediction)
            session.flush()  # Get the ID without committing
            return prediction.id

    def save_batch_predictions(self, predictions: List[Dict[str, Any]], batch_id: str) -> int:
        """
        Save multiple predictions in a single transaction

        Args:
            predictions: List of prediction dictionaries
            batch_id: Batch identifier

        Returns:
            Number of predictions saved
        """
        with self.get_session() as session:
            prediction_objects = []

            for pred_data in predictions:
                prediction = Prediction(
                    order_number=pred_data.get('order_number'),
                    customer_name=pred_data.get('customer_name'),
                    customer_phone=pred_data.get('customer_phone'),
                    customer_city=pred_data.get('customer_city'),
                    customer_state=pred_data.get('customer_state'),
                    pincode=pred_data.get('pincode'),
                    payment_mode=pred_data.get('payment_mode'),
                    courier_name=pred_data.get('courier_name'),
                    weight=pred_data.get('weight'),
                    quantity=pred_data.get('quantity'),
                    invoice_value=pred_data.get('invoice_value'),
                    rto_prediction=pred_data.get('rto_prediction'),
                    rto_probability=pred_data.get('rto_probability'),
                    risk_level=pred_data.get('risk_level'),
                    model_version=pred_data.get('model_version'),
                    risk_factors=pred_data.get('risk_factors'),
                    recommendations=pred_data.get('recommendations'),
                    batch_id=batch_id
                )
                prediction_objects.append(prediction)

            session.bulk_save_objects(prediction_objects)
            return len(prediction_objects)

    def get_predictions(
        self,
        limit: int = 100,
        offset: int = 0,
        order_number: Optional[str] = None,
        risk_level: Optional[str] = None,
        courier_name: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Query predictions with filters"""
        with self.get_session() as session:
            query = session.query(Prediction)

            # Apply filters
            if order_number:
                query = query.filter(Prediction.order_number == order_number)
            if risk_level:
                query = query.filter(Prediction.risk_level == risk_level)
            if courier_name:
                query = query.filter(Prediction.courier_name == courier_name)
            if start_date:
                query = query.filter(Prediction.prediction_timestamp >= start_date)
            if end_date:
                query = query.filter(Prediction.prediction_timestamp <= end_date)

            # Order by timestamp descending
            query = query.order_by(desc(Prediction.prediction_timestamp))

            # Apply pagination
            query = query.limit(limit).offset(offset)

            # Execute and convert to dicts
            predictions = query.all()
            return [pred.to_dict() for pred in predictions]

    def get_prediction_by_order_number(self, order_number: str) -> Optional[Dict[str, Any]]:
        """Get latest prediction for an order"""
        with self.get_session() as session:
            prediction = session.query(Prediction).filter(
                Prediction.order_number == order_number
            ).order_by(desc(Prediction.prediction_timestamp)).first()

            return prediction.to_dict() if prediction else None

    def update_actual_outcome(self, order_number: str, actual_rto: bool, actual_status: str):
        """Update prediction with actual outcome for validation"""
        with self.get_session() as session:
            prediction = session.query(Prediction).filter(
                Prediction.order_number == order_number
            ).first()

            if prediction:
                prediction.actual_rto = actual_rto
                prediction.actual_status = actual_status
                prediction.outcome_timestamp = datetime.utcnow()

    # =========================================================================
    # MODEL METADATA OPERATIONS
    # =========================================================================

    def save_model_metadata(self, model_data: Dict[str, Any]) -> int:
        """Save model training metadata"""
        with self.get_session() as session:
            # Deactivate previous production model
            if model_data.get('is_production', False):
                session.query(ModelMetadata).filter(
                    ModelMetadata.is_production == True
                ).update({'is_production': False})

            model = ModelMetadata(
                model_version=model_data.get('model_version'),
                model_type=model_data.get('model_type'),
                model_path=model_data.get('model_path'),
                training_accuracy=model_data.get('training_accuracy'),
                test_accuracy=model_data.get('test_accuracy'),
                precision_score=model_data.get('precision_score'),
                recall_score=model_data.get('recall_score'),
                f1_score=model_data.get('f1_score'),
                roc_auc_score=model_data.get('roc_auc_score'),
                training_samples=model_data.get('training_samples'),
                feature_count=model_data.get('feature_count'),
                training_duration_seconds=model_data.get('training_duration_seconds'),
                hyperparameters=model_data.get('hyperparameters'),
                feature_names=model_data.get('feature_names'),
                feature_importance=model_data.get('feature_importance'),
                is_active=model_data.get('is_active', True),
                is_production=model_data.get('is_production', False),
                created_by=model_data.get('created_by', 'system'),
                notes=model_data.get('notes')
            )

            session.add(model)
            session.flush()
            return model.id

    def get_active_model(self) -> Optional[Dict[str, Any]]:
        """Get currently active production model"""
        with self.get_session() as session:
            model = session.query(ModelMetadata).filter(
                ModelMetadata.is_production == True,
                ModelMetadata.is_active == True
            ).first()

            return model.to_dict() if model else None

    def get_model_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get model training history"""
        with self.get_session() as session:
            models = session.query(ModelMetadata).order_by(
                desc(ModelMetadata.training_timestamp)
            ).limit(limit).all()

            return [model.to_dict() for model in models]

    # =========================================================================
    # COURIER PERFORMANCE OPERATIONS
    # =========================================================================

    def update_courier_performance(self, courier_data: Dict[str, Any]):
        """Update or insert courier performance metrics"""
        with self.get_session() as session:
            # Check if record exists
            courier = session.query(CourierPerformance).filter(
                CourierPerformance.courier_name == courier_data['courier_name']
            ).first()

            if courier:
                # Update existing
                for key, value in courier_data.items():
                    if hasattr(courier, key):
                        setattr(courier, key, value)
            else:
                # Create new
                courier = CourierPerformance(**courier_data)
                session.add(courier)

    def get_courier_performance(self, courier_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get courier performance statistics"""
        with self.get_session() as session:
            query = session.query(CourierPerformance)

            if courier_name:
                query = query.filter(CourierPerformance.courier_name == courier_name)

            query = query.order_by(desc(CourierPerformance.success_rate))

            couriers = query.all()
            return [courier.to_dict() for courier in couriers]

    # =========================================================================
    # PINCODE ANALYTICS OPERATIONS
    # =========================================================================

    def update_pincode_analytics(self, pincode_data: Dict[str, Any]):
        """Update or insert pincode analytics"""
        with self.get_session() as session:
            pincode = session.query(PincodeAnalytics).filter(
                PincodeAnalytics.pincode == pincode_data['pincode']
            ).first()

            if pincode:
                for key, value in pincode_data.items():
                    if hasattr(pincode, key):
                        setattr(pincode, key, value)
            else:
                pincode = PincodeAnalytics(**pincode_data)
                session.add(pincode)

    def get_pincode_analytics(self, pincode: Optional[str] = None, risk_level: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get pincode analytics"""
        with self.get_session() as session:
            query = session.query(PincodeAnalytics)

            if pincode:
                query = query.filter(PincodeAnalytics.pincode == pincode)
            if risk_level:
                query = query.filter(PincodeAnalytics.risk_level == risk_level)

            query = query.order_by(desc(PincodeAnalytics.rto_rate))

            pincodes = query.all()
            return [pc.to_dict() for pc in pincodes]

    def get_high_risk_pincodes(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top high-risk pincodes"""
        with self.get_session() as session:
            pincodes = session.query(PincodeAnalytics).filter(
                PincodeAnalytics.rto_rate > 0.3
            ).order_by(desc(PincodeAnalytics.rto_rate)).limit(limit).all()

            return [pc.to_dict() for pc in pincodes]

    # =========================================================================
    # SYSTEM METRICS OPERATIONS
    # =========================================================================

    def save_system_metrics(self, metrics_data: Dict[str, Any]):
        """Save system performance metrics"""
        with self.get_session() as session:
            metrics = SystemMetrics(**metrics_data)
            session.add(metrics)

    def get_system_metrics(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get system metrics history"""
        with self.get_session() as session:
            query = session.query(SystemMetrics)

            if start_time:
                query = query.filter(SystemMetrics.timestamp >= start_time)
            if end_time:
                query = query.filter(SystemMetrics.timestamp <= end_time)

            query = query.order_by(desc(SystemMetrics.timestamp)).limit(limit)

            metrics = query.all()
            return [m.to_dict() for m in metrics]

    # =========================================================================
    # ANALYTICS AND AGGREGATIONS
    # =========================================================================

    def get_prediction_summary(self, days: int = 7) -> Dict[str, Any]:
        """Get prediction summary for last N days"""
        with self.get_session() as session:
            start_date = datetime.utcnow() - timedelta(days=days)

            total = session.query(func.count(Prediction.id)).filter(
                Prediction.prediction_timestamp >= start_date
            ).scalar()

            high_risk = session.query(func.count(Prediction.id)).filter(
                Prediction.prediction_timestamp >= start_date,
                Prediction.rto_prediction == True
            ).scalar()

            avg_prob = session.query(func.avg(Prediction.rto_probability)).filter(
                Prediction.prediction_timestamp >= start_date
            ).scalar()

            return {
                'total_predictions': total or 0,
                'high_risk_count': high_risk or 0,
                'high_risk_rate': (high_risk / total * 100) if total > 0 else 0,
                'avg_rto_probability': float(avg_prob) if avg_prob else 0,
                'period_days': days
            }

    def close(self):
        """Close database connections"""
        self.SessionLocal.remove()
        self.engine.dispose()
        logger.info("Database connections closed")


# Global database instance
_db_instance = None


def get_database() -> DatabaseService:
    """Get or create database service instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = DatabaseService()
    return _db_instance
