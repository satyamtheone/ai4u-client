"""
Functional API for RTO Prediction System
Provides simple function-based interface that can be used in APIs and workflows
Automatically stores results in PostgreSQL database
"""

import pandas as pd
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import uuid
import time

from src.main import ProductionRTOPredictor, ProductionRTOPipelineManager
from src.database.database_service import get_database, DatabaseService
from src.pipeline.dataclass_configurations import ModelConfig, PreprocessingConfig, PipelineConfig

logger = logging.getLogger(__name__)

# Global instances (lazy initialization)
_predictor_instance: Optional[ProductionRTOPredictor] = None
_pipeline_manager_instance: Optional[ProductionRTOPipelineManager] = None
_db_service: Optional[DatabaseService] = None


def get_predictor() -> ProductionRTOPredictor:
    """Get or create predictor instance (singleton)"""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = ProductionRTOPredictor()
        try:
            _predictor_instance.load_model_snapshot()
        except Exception as e:
            logger.warning(f"Model not loaded: {e}")
    return _predictor_instance


def get_pipeline_manager() -> ProductionRTOPipelineManager:
    """Get or create pipeline manager instance (singleton)"""
    global _pipeline_manager_instance
    if _pipeline_manager_instance is None:
        _pipeline_manager_instance = ProductionRTOPipelineManager()
    return _pipeline_manager_instance


def get_db() -> DatabaseService:
    """Get or create database service instance"""
    global _db_service
    if _db_service is None:
        _db_service = get_database()
    return _db_service


# ============================================================================
# PREDICTION FUNCTIONS
# ============================================================================

def predict_single_order(
    order_data: Dict[str, Any],
    save_to_db: bool = True
) -> Dict[str, Any]:
    """
    Predict RTO probability for a single order

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
        predictor = get_predictor()

        # Convert to DataFrame
        df = pd.DataFrame([order_data])

        # Make prediction
        results = predictor.predict(df)

        if results['predictions']:
            prediction = results['predictions'][0]
            prediction['processing_time_ms'] = (time.time() - start_time) * 1000

            # Save to database
            if save_to_db:
                try:
                    db = get_db()
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
                        'model_version': results.get('model_version'),
                        'processing_time_ms': prediction['processing_time_ms'],
                        'risk_factors': prediction.get('risk_factors'),
                        'recommendations': prediction.get('recommendations')
                    })
                    prediction['db_id'] = pred_id
                except Exception as e:
                    logger.error(f"Failed to save prediction to database: {e}")

            return prediction
        else:
            raise Exception("Prediction generation failed")

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
        predictor = get_predictor()

        # Convert to DataFrame
        df = pd.DataFrame(orders)

        # Make predictions
        results = predictor.predict(df)

        # Add processing time
        processing_time = time.time() - start_time
        results['processing_time_seconds'] = processing_time
        results['batch_id'] = batch_id

        # Save to database
        if save_to_db and results['predictions']:
            try:
                db = get_db()

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
                        'model_version': results.get('model_version'),
                        'risk_factors': pred.get('risk_factors'),
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
        manager = get_pipeline_manager()

        # Train model
        results = manager.train_initial_model(training_data_path)

        # Save metadata to database
        if save_to_db and results:
            try:
                db = get_db()
                db.save_model_metadata({
                    'model_version': results.get('model_version', f"v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"),
                    'model_type': results.get('best_model', 'Unknown'),
                    'training_accuracy': results.get('train_accuracy'),
                    'test_accuracy': results.get('test_accuracy'),
                    'precision_score': results.get('precision'),
                    'recall_score': results.get('recall'),
                    'f1_score': results.get('f1'),
                    'roc_auc_score': results.get('roc_auc'),
                    'training_samples': results.get('training_samples'),
                    'feature_count': results.get('feature_count'),
                    'feature_importance': results.get('feature_importance'),
                    'is_production': True,
                    'notes': 'Model trained via functional API'
                })
                logger.info("Model metadata saved to database")
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

    Args:
        new_data_path: Optional path to new training data
        save_to_db: Whether to save model metadata to database

    Returns:
        Dictionary containing retraining results if retrained, None otherwise
    """
    try:
        manager = get_pipeline_manager()

        # Retrain model
        results = manager.daily_retrain(new_data_path)

        if results and save_to_db:
            try:
                db = get_db()
                db.save_model_metadata({
                    'model_version': results.get('model_version', f"v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"),
                    'model_type': results.get('best_model', 'Unknown'),
                    'training_accuracy': results.get('train_accuracy'),
                    'test_accuracy': results.get('test_accuracy'),
                    'is_production': True,
                    'notes': 'Model retrained via functional API'
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

    Returns:
        Dictionary containing courier performance data
    """
    try:
        predictor = get_predictor()
        return predictor.get_courier_performance_report()
    except Exception as e:
        logger.error(f"Courier analytics error: {e}")
        raise


def get_pincode_analytics(pincode: Optional[str] = None) -> Dict[str, Any]:
    """
    Get pincode-level risk analytics

    Args:
        pincode: Optional specific pincode to analyze

    Returns:
        Dictionary containing pincode analytics
    """
    try:
        predictor = get_predictor()
        return predictor.get_pincode_analysis(pincode)
    except Exception as e:
        logger.error(f"Pincode analytics error: {e}")
        raise


def get_performance_report() -> Dict[str, Any]:
    """
    Get comprehensive performance report

    Returns:
        Dictionary containing full performance report
    """
    try:
        manager = get_pipeline_manager()
        return manager.generate_performance_report()
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
    """Get current system health status"""
    try:
        manager = get_pipeline_manager()
        return manager.health_check()
    except Exception as e:
        logger.error(f"Health check error: {e}")
        raise


def get_model_info() -> Dict[str, Any]:
    """Get current model information"""
    try:
        predictor = get_predictor()
        return {
            'model_loaded': predictor.model is not None,
            'model_type': type(predictor.model).__name__ if predictor.model else None,
            'feature_count': len(predictor.feature_columns) if predictor.feature_columns else 0,
            'last_training': predictor.health_status.get('last_training'),
            'training_score': predictor.model_trainer.last_training_score
        }
    except Exception as e:
        logger.error(f"Model info error: {e}")
        raise


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def initialize_system(database_url: Optional[str] = None) -> None:
    """
    Initialize the prediction system and database

    Args:
        database_url: Optional PostgreSQL connection string
    """
    try:
        # Initialize database
        global _db_service
        _db_service = DatabaseService(database_url)

        # Load predictor
        get_predictor()

        logger.info("System initialized successfully")
    except Exception as e:
        logger.error(f"System initialization error: {e}")
        raise


def shutdown_system() -> None:
    """Gracefully shutdown the system and close connections"""
    try:
        if _db_service:
            _db_service.close()
        logger.info("System shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")
