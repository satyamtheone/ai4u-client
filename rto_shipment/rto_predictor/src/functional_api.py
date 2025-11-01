"""
Functional API for RTO Prediction System
Provides simple function-based interface that can be used in APIs and workflows
Automatically stores results in PostgreSQL database

REFACTORED: Now uses independent services for better modularity
"""

import pandas as pd
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import uuid
import time

# Import new refactored services
from src.services import get_container, ServiceContainer
from src.services import TrainingService, PredictionService, AnalyticsService
from src.database.database_service import get_database, DatabaseService
from src.pipeline.dataclass_configurations import ModelConfig, PreprocessingConfig, PipelineConfig

logger = logging.getLogger(__name__)

# Global instances (lazy initialization)
_service_container: Optional[ServiceContainer] = None
_db_service: Optional[DatabaseService] = None


def get_services() -> ServiceContainer:
    """Get or create service container instance (singleton)"""
    global _service_container
    if _service_container is None:
        _service_container = get_container()
        logger.info("Service container initialized")
    return _service_container


def get_prediction_service() -> PredictionService:
    """Get prediction service from container"""
    return get_services().get_prediction_service()


def get_training_service() -> TrainingService:
    """Get training service from container"""
    return get_services().get_training_service()


def get_analytics_service() -> AnalyticsService:
    """Get analytics service from container"""
    return get_services().get_analytics_service()


def get_db() -> DatabaseService:
    """Get or create database service instance"""
    global _db_service
    if _db_service is None:
        _db_service = get_database()
    return _db_service


# ============================================================================
# BACKWARD COMPATIBILITY HELPERS
# ============================================================================

def get_predictor():
    """
    DEPRECATED: For backward compatibility only
    Use get_prediction_service() instead
    """
    logger.warning("get_predictor() is deprecated. Use get_prediction_service() instead.")
    return get_prediction_service()


def get_pipeline_manager():
    """
    DEPRECATED: For backward compatibility only
    Use get_training_service() instead
    """
    logger.warning("get_pipeline_manager() is deprecated. Use get_training_service() instead.")
    return get_training_service()


# ============================================================================
# PREDICTION FUNCTIONS
# ============================================================================

def predict_single_order(
    order_data: Dict[str, Any],
    save_to_db: bool = True
) -> Dict[str, Any]:
    """
    Predict RTO probability for a single order

    REFACTORED: Now uses independent PredictionService

    Args:
        order_data: Dictionary containing order details
        save_to_db: Whether to save prediction to database

    Returns:
        Dictionary containing prediction results

    Example:
        >>> order = {
        ...     "ORDER_NUMBER": "ORD123",
        ...     "CUSTOMER_PHONE": "9876543210",
        ...     "PAYMENT_MODE": "COD",
        ...     "COURIER_NAME": "DELHIVERY",
        ...     "PINCODE": "122001",
        ...     "WEIGHT": 1.5,
        ...     "QTY": 2,
        ...     "INVOICE_VALUE": 2499.50
        ... }
        >>> result = predict_single_order(order)
    """
    start_time = time.time()

    try:
        # Use new PredictionService
        prediction_service = get_prediction_service()

        # Use service's predict_single method
        prediction = prediction_service.predict_single(order_data)

        prediction['processing_time_ms'] = (time.time() - start_time) * 1000

        # Save to database
        if save_to_db:
            try:
                db = get_db()

                # Get model info from service
                model_info = prediction_service.get_model_info()

                pred_id = db.save_prediction({
                    'order_number': order_data.get('ORDER_NUMBER'),
                    'customer_name': order_data.get('CUSTOMER_NAME'),
                    'customer_phone': order_data.get('CUSTOMER_PHONE'),
                    'customer_address': order_data.get('CUSTOMER_ADDRESS'),
                    'customer_city': order_data.get('CUSTOMER_CITY'),
                    'customer_state': order_data.get('CUSTOMER_STATE'),
                    'pincode': order_data.get('PINCODE'),
                    'payment_mode': order_data.get('PAYMENT_MODE'),
                    'courier_name': order_data.get('COURIER_NAME'),
                    'weight': order_data.get('WEIGHT'),
                    'quantity': order_data.get('QTY'),
                    'invoice_value': order_data.get('INVOICE_VALUE'),
                    'collectable_amount': order_data.get('COLLECTABLE_AMOUNT'),
                    'rto_prediction': prediction['rto_prediction'],
                    'rto_probability': prediction['rto_probability'],
                    'risk_level': prediction['risk_level'],
                    'model_version': model_info.get('version'),
                    'processing_time_ms': prediction['processing_time_ms'],
                    'risk_factors': prediction.get('explanation'),
                    'recommendations': prediction.get('recommendations')
                })
                prediction['db_id'] = pred_id
                logger.info(f"Prediction saved to database with ID: {pred_id}")
            except Exception as e:
                logger.error(f"Failed to save prediction to database: {e}")

        return prediction

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise


def predict_batch_orders(
    orders: List[Dict[str, Any]],
    save_to_db: bool = True,
    batch_size: Optional[int] = None
) -> Dict[str, Any]:
    """
    Predict RTO probability for multiple orders

    REFACTORED: Now uses independent PredictionService

    Args:
        orders: List of order dictionaries
        save_to_db: Whether to save predictions to database
        batch_size: Optional batch processing size

    Returns:
        Dictionary containing all predictions and summary

    Example:
        >>> orders = [
        ...     {"ORDER_NUMBER": "ORD001", "PAYMENT_MODE": "COD", ...},
        ...     {"ORDER_NUMBER": "ORD002", "PAYMENT_MODE": "PREPAID", ...}
        ... ]
        >>> results = predict_batch_orders(orders)
    """
    start_time = time.time()
    batch_id = f"BATCH_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

    try:
        # Use new PredictionService
        prediction_service = get_prediction_service()

        # Use service's predict_batch method
        results = prediction_service.predict_batch(orders)

        # Add processing time and batch ID
        processing_time = time.time() - start_time
        results['processing_time_seconds'] = processing_time
        results['batch_id'] = batch_id

        # Save to database
        if save_to_db and results.get('predictions'):
            try:
                db = get_db()
                model_info = prediction_service.get_model_info()

                # Prepare predictions for database
                db_predictions = []
                for i, pred in enumerate(results['predictions']):
                    order = orders[i]
                    db_pred = {
                        'order_number': order.get('ORDER_NUMBER'),
                        'customer_name': order.get('CUSTOMER_NAME'),
                        'customer_phone': order.get('CUSTOMER_PHONE'),
                        'customer_city': order.get('CUSTOMER_CITY'),
                        'customer_state': order.get('CUSTOMER_STATE'),
                        'pincode': order.get('PINCODE'),
                        'payment_mode': order.get('PAYMENT_MODE'),
                        'courier_name': order.get('COURIER_NAME'),
                        'weight': order.get('WEIGHT'),
                        'quantity': order.get('QTY'),
                        'invoice_value': order.get('INVOICE_VALUE'),
                        'rto_prediction': pred['rto_prediction'],
                        'rto_probability': pred['rto_probability'],
                        'risk_level': pred['risk_level'],
                        'model_version': model_info.get('version'),
                        'risk_factors': pred.get('explanation'),
                        'recommendations': pred.get('recommendations')
                    }
                    db_predictions.append(db_pred)

                saved_count = db.save_batch_predictions(db_predictions, batch_id)
                logger.info(f"Saved {saved_count} predictions to database with batch_id: {batch_id}")

            except Exception as e:
                logger.error(f"Failed to save batch predictions: {e}")

        return results

    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise


def predict_from_csv_file(
    csv_file_path: str,
    save_to_db: bool = True
) -> Dict[str, Any]:
    """
    Predict RTO probability from CSV file

    Args:
        csv_file_path: Path to CSV file containing orders
        save_to_db: Whether to save predictions to database

    Returns:
        Dictionary containing predictions and summary

    Example:
        >>> results = predict_from_csv_file("orders.csv")
    """
    try:
        # Read CSV
        df = pd.DataFrame(pd.read_csv(csv_file_path))

        # Convert to list of dicts
        orders = df.to_dict('records')

        # Use batch prediction
        return predict_batch_orders(orders, save_to_db=save_to_db)

    except Exception as e:
        logger.error(f"CSV prediction error: {e}")
        raise


# ============================================================================
# TRAINING FUNCTIONS
# ============================================================================

def train_model(
    training_data_path: str,
    model_config: Optional[ModelConfig] = None,
    save_to_db: bool = True
) -> Dict[str, Any]:
    """
    Train a new RTO prediction model

    REFACTORED: Now uses independent TrainingService

    Args:
        training_data_path: Path to training CSV file
        model_config: Optional model configuration
        save_to_db: Whether to save model metadata to database

    Returns:
        Dictionary containing training results

    Example:
        >>> results = train_model("training_data.csv")
    """
    try:
        # Use new TrainingService
        training_service = get_training_service()

        # Train model from CSV
        results = training_service.train_from_csv(
            csv_path=training_data_path,
            description="Model trained via functional API"
        )

        # Extract detailed metrics from model_results
        best_model_name = results.get('best_model', 'Unknown')
        model_results = results.get('model_results', {})
        best_model_metrics = model_results.get(best_model_name, {})

        # Extract classification report for best model
        classification_report = best_model_metrics.get('classification_report', {})

        # Extract metrics (classification_report has '0', '1', 'accuracy', 'macro avg', 'weighted avg')
        weighted_avg = classification_report.get('weighted avg', {})
        macro_avg = classification_report.get('macro avg', {})

        # Extract test AUC score
        test_auc = best_model_metrics.get('test_auc', results.get('best_score', 0))
        cv_mean = best_model_metrics.get('cv_mean', 0)

        # Add extracted metrics to results for API consumption
        results['test_accuracy'] = test_auc  # Use AUC as test accuracy
        results['cv_accuracy'] = cv_mean
        results['precision'] = weighted_avg.get('precision', 0)
        results['recall'] = weighted_avg.get('recall', 0)
        results['f1_score'] = weighted_avg.get('f1-score', 0)
        results['roc_auc'] = test_auc
        results['feature_count'] = len(results.get('feature_importance', {}))

        # Save metadata to database
        if save_to_db and results.get('success'):
            try:
                db = get_db()
                db.save_model_metadata({
                    'model_version': results.get('model_version', f"v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"),
                    'model_type': best_model_name,
                    'training_accuracy': cv_mean,
                    'test_accuracy': test_auc,
                    'precision_score': weighted_avg.get('precision'),
                    'recall_score': weighted_avg.get('recall'),
                    'f1_score': weighted_avg.get('f1-score'),
                    'roc_auc_score': test_auc,
                    'training_samples': results.get('training_samples'),
                    'feature_count': len(results.get('feature_importance', {})),
                    'feature_importance': results.get('feature_importance'),
                    'is_production': True,
                    'notes': f'Model trained via functional API using TrainingService - {best_model_name}'
                })
                logger.info(f"✓ Model metadata saved to database - {best_model_name} (AUC: {test_auc:.4f})")
            except Exception as e:
                logger.error(f"Failed to save model metadata: {e}")

        return results

    except Exception as e:
        logger.error(f"Training error: {e}")
        raise


def retrain_model(
    new_data_path: Optional[str] = None,
    save_to_db: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Retrain model with new data or based on performance degradation

    REFACTORED: Now uses independent TrainingService

    Args:
        new_data_path: Optional path to new training data
        save_to_db: Whether to save model metadata to database

    Returns:
        Dictionary containing retraining results if retrained, None otherwise
    """
    try:
        # Use new TrainingService for retraining
        training_service = get_training_service()

        if new_data_path:
            # Retrain with new data
            results = training_service.train_from_csv(
                csv_path=new_data_path,
                description="Model retrained via functional API"
            )
        else:
            # Just use existing training method
            logger.warning("Retrain without new data not fully implemented in new service yet")
            return None

        if results and results.get('success') and save_to_db:
            try:
                db = get_db()
                db.save_model_metadata({
                    'model_version': results.get('model_version', f"v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"),
                    'model_type': results.get('best_model', 'Unknown'),
                    'training_accuracy': results.get('train_accuracy'),
                    'test_accuracy': results.get('test_accuracy'),
                    'is_production': True,
                    'notes': 'Model retrained via functional API using TrainingService'
                })
            except Exception as e:
                logger.error(f"Failed to save retrain metadata: {e}")

        return results

    except Exception as e:
        logger.error(f"Retraining error: {e}")
        raise


# ============================================================================
# ANALYTICS FUNCTIONS
# ============================================================================

def get_courier_analytics() -> Dict[str, Any]:
    """
    Get courier performance analytics

    REFACTORED: Now uses independent AnalyticsService

    Returns:
        Dictionary containing courier performance data
    """
    try:
        # Use new AnalyticsService
        analytics_service = get_analytics_service()
        return analytics_service.get_courier_performance()
    except Exception as e:
        logger.error(f"Courier analytics error: {e}")
        raise


def get_pincode_analytics(pincode: Optional[str] = None) -> Dict[str, Any]:
    """
    Get pincode-level risk analytics

    REFACTORED: Now uses independent AnalyticsService

    Args:
        pincode: Optional specific pincode to analyze

    Returns:
        Dictionary containing pincode analytics
    """
    try:
        # Use new AnalyticsService
        analytics_service = get_analytics_service()
        return analytics_service.get_pincode_analysis(pincode)
    except Exception as e:
        logger.error(f"Pincode analytics error: {e}")
        raise


def get_performance_report() -> Dict[str, Any]:
    """
    Get comprehensive performance report

    REFACTORED: Now uses independent AnalyticsService

    Returns:
        Dictionary containing full performance report
    """
    try:
        # Use new AnalyticsService for business insights
        analytics_service = get_analytics_service()
        return analytics_service.get_business_insights()
    except Exception as e:
        logger.error(f"Performance report error: {e}")
        raise


# ============================================================================
# DATABASE QUERY FUNCTIONS
# ============================================================================

def get_recent_predictions(
    limit: int = 100,
    risk_level: Optional[str] = None,
    courier: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Query recent predictions from database

    Args:
        limit: Maximum number of predictions to return
        risk_level: Filter by risk level
        courier: Filter by courier name

    Returns:
        List of prediction dictionaries
    """
    try:
        db = get_db()
        return db.get_predictions(
            limit=limit,
            risk_level=risk_level,
            courier_name=courier
        )
    except Exception as e:
        logger.error(f"Database query error: {e}")
        raise


def get_prediction_summary_stats(days: int = 7) -> Dict[str, Any]:
    """
    Get prediction summary statistics

    Args:
        days: Number of days to include in summary

    Returns:
        Dictionary containing summary statistics
    """
    try:
        db = get_db()
        return db.get_prediction_summary(days=days)
    except Exception as e:
        logger.error(f"Summary stats error: {e}")
        raise


def update_prediction_outcome(
    order_number: str,
    actual_rto: bool,
    actual_status: str
) -> None:
    """
    Update prediction with actual outcome for validation

    Args:
        order_number: Order number to update
        actual_rto: Actual RTO result (True/False)
        actual_status: Actual delivery status
    """
    try:
        db = get_db()
        db.update_actual_outcome(order_number, actual_rto, actual_status)
        logger.info(f"Updated outcome for order {order_number}")
    except Exception as e:
        logger.error(f"Update outcome error: {e}")
        raise


# ============================================================================
# HEALTH AND MONITORING FUNCTIONS
# ============================================================================

def get_system_health() -> Dict[str, Any]:
    """
    Get current system health status

    REFACTORED: Now uses ServiceContainer for status
    """
    try:
        container = get_services()
        service_status = container.get_service_status()

        # Combine with database health
        db_healthy = True
        try:
            db = get_db()
            db_healthy = db is not None
        except:
            db_healthy = False

        return {
            'status': 'healthy' if all(s['status'] == 'available' for s in service_status.values()) else 'degraded',
            'services': service_status,
            'database_connected': db_healthy,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        raise


def get_model_info() -> Dict[str, Any]:
    """
    Get current model information

    REFACTORED: Now uses PredictionService
    """
    try:
        prediction_service = get_prediction_service()
        return prediction_service.get_model_info()
    except Exception as e:
        logger.error(f"Model info error: {e}")
        raise


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def initialize_system(database_url: Optional[str] = None) -> None:
    """
    Initialize the prediction system and database

    REFACTORED: Now initializes new service container

    Args:
        database_url: Optional PostgreSQL connection string
    """
    try:
        # Initialize database
        global _db_service
        if database_url:
            _db_service = DatabaseService(database_url)
        else:
            _db_service = get_database()

        # Initialize service container (loads services)
        container = get_services()

        logger.info("System initialized successfully with new services")
        logger.info(f"Services available: {list(container.get_service_status().keys())}")
    except Exception as e:
        logger.error(f"System initialization error: {e}")
        raise


def shutdown_system() -> None:
    """
    Gracefully shutdown the system and close connections

    REFACTORED: Now handles new service container
    """
    try:
        # Close database connections
        if _db_service:
            _db_service.close()

        # Reset service container
        global _service_container
        _service_container = None

        logger.info("System shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")
