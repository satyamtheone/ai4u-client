import pandas as pd
import numpy as np
import joblib
import logging
import os
import warnings
import time
import psutil
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional, Union
from pathlib import Path
import json
from dataclasses import dataclass, field
from contextlib import contextmanager
import functools
import traceback

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import matplotlib.pyplot as plt

# Data processing
from scipy.spatial.distance import cosine
import re
from collections import defaultdict
from data_preprocessing_module import DataPreprocessor
from model_training_module import ModelTrainer
from prediction_module import PredictionAnalyzer
from performance_analytics_module import PerformanceAnalytics
from data_validation_module import DataValidator


warnings.filterwarnings('ignore')

# Custom Exceptions
class RTOPipelineError(Exception):
    """Base exception for RTO Pipeline"""
    pass

class DataValidationError(RTOPipelineError):
    """Data validation failed"""
    pass

class ModelNotFoundError(RTOPipelineError):
    """Model not found or not trained"""
    pass

class ProcessingTimeoutError(RTOPipelineError):
    """Processing timeout exceeded"""
    pass

class DataQualityError(RTOPipelineError):
    """Data quality issues detected"""
    pass

class ServiceUnavailableError(RTOPipelineError):
    """Service is temporarily unavailable"""
    pass

# Configuration Management
@dataclass
class PreprocessingConfig:
    max_processing_time: int = 300  # 5 minutes timeout
    batch_size: int = 10000
    memory_limit_mb: int = 2048
    required_columns: List[str] = field(default_factory=lambda: [
        'ORDER_NUMBER', 'CURRENT_STATUS', 'CUSTOMER_PHONE', 
        'CUSTOMER_ADDRESS', 'PAYMENT_MODE'
    ])
    fallback_values: Dict[str, Any] = field(default_factory=dict)
    max_retries: int = 3
    enable_monitoring: bool = True

@dataclass
class ModelConfig:
    retrain_threshold: float = 0.1
    min_training_samples: int = 100
    model_snapshot_retention_days: int = 30
    enable_auto_retrain: bool = True
    cross_validation_folds: int = 5

@dataclass
class PipelineConfig:
    data_dir: str = 'data'
    model_dir: str = 'models'
    output_dir: str = 'output'
    log_dir: str = 'logs'
    backup_dir: str = 'backups'
    enable_circuit_breaker: bool = True
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: int = 60

# Monitoring and Metrics
class MetricsCollector:
    """Collect and store performance metrics"""
    
    def __init__(self):
        self.metrics = defaultdict(list)
        self.start_times = {}
        self.lock = threading.Lock()
    
    def start_timer(self, operation: str):
        """Start timing an operation"""
        with self.lock:
            self.start_times[operation] = time.time()
    
    def end_timer(self, operation: str):
        """End timing and record duration"""
        with self.lock:
            if operation in self.start_times:
                duration = time.time() - self.start_times[operation]
                self.metrics[f"{operation}_duration"].append(duration)
                del self.start_times[operation]
                return duration
            return None
    
    def record_metric(self, name: str, value: Union[int, float]):
        """Record a custom metric"""
        with self.lock:
            self.metrics[name].append({
                'value': value,
                'timestamp': time.time()
            })
    
    def get_metrics(self) -> Dict:
        """Get all collected metrics"""
        with self.lock:
            return dict(self.metrics)

# Circuit Breaker Pattern
class CircuitBreaker:
    """Circuit breaker for fault tolerance"""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.lock = threading.Lock()
    
    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        with self.lock:
            if self.state == "OPEN":
                if time.time() - self.last_failure_time > self.timeout:
                    self.state = "HALF_OPEN"
                else:
                    raise ServiceUnavailableError("Service is temporarily unavailable")
        
        try:
            result = func(*args, **kwargs)
            with self.lock:
                if self.state == "HALF_OPEN":
                    self.state = "CLOSED"
                    self.failure_count = 0
            return result
        except Exception as e:
            with self.lock:
                self.failure_count += 1
                self.last_failure_time = time.time()
                if self.failure_count >= self.failure_threshold:
                    self.state = "OPEN"
            raise

# Decorators for monitoring and error handling
def monitor_performance(func_or_collector=None):
    """Decorator to monitor function performance"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract metrics collector from self if it's a method
            metrics_collector = None
            if args and hasattr(args[0], 'metrics_collector'):
                metrics_collector = args[0].metrics_collector
            elif hasattr(func_or_collector, 'record_metric'):
                metrics_collector = func_or_collector
            
            operation_name = f"{func.__module__}.{func.__name__}"
            
            if metrics_collector:
                metrics_collector.start_timer(operation_name)
            
            try:
                # Monitor memory usage
                process = psutil.Process()
                memory_before = process.memory_info().rss / 1024 / 1024  # MB
                
                result = func(*args, **kwargs)
                
                memory_after = process.memory_info().rss / 1024 / 1024  # MB
                memory_used = memory_after - memory_before
                
                if metrics_collector:
                    duration = metrics_collector.end_timer(operation_name)
                    metrics_collector.record_metric(f"{operation_name}_memory_mb", memory_used)
                
                return result
                
            except Exception as e:
                if metrics_collector:
                    metrics_collector.end_timer(operation_name)
                    metrics_collector.record_metric(f"{operation_name}_errors", 1)
                raise
        return wrapper
    
    # Handle both @monitor_performance and @monitor_performance(collector)
    if callable(func_or_collector):
        return decorator(func_or_collector)
    else:
        return decorator

def timeout_handler(timeout_seconds: int):
    """Decorator to add timeout protection"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = [None]
            exception = [None]
            
            def target():
                try:
                    result[0] = func(*args, **kwargs)
                except Exception as e:
                    exception[0] = e
            
            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(timeout_seconds)
            
            if thread.is_alive():
                raise ProcessingTimeoutError(f"Function {func.__name__} timed out after {timeout_seconds} seconds")
            
            if exception[0]:
                raise exception[0]
            
            return result[0]
        return wrapper
    return decorator

def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """Decorator to retry on failure"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        time.sleep(delay * (2 ** attempt))  # Exponential backoff
                        logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}: {e}")
                    else:
                        logger.error(f"All {max_retries} attempts failed for {func.__name__}")
            
            raise last_exception
        return wrapper
    return decorator

# Enhanced logging setup
def setup_production_logging(log_dir: str = "logs"):
    """Setup production-grade logging"""
    Path(log_dir).mkdir(exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]',
        handlers=[
            logging.FileHandler(Path(log_dir) / 'rto_pipeline.log'),
            logging.FileHandler(Path(log_dir) / f'rto_pipeline_{datetime.now().strftime("%Y%m%d")}.log'),
            logging.StreamHandler()
        ]
    )
    
    # Create separate loggers for different components
    error_logger = logging.getLogger('error')
    error_handler = logging.FileHandler(Path(log_dir) / 'errors.log')
    error_handler.setLevel(logging.ERROR)
    error_logger.addHandler(error_handler)
    
    performance_logger = logging.getLogger('performance')
    perf_handler = logging.FileHandler(Path(log_dir) / 'performance.log')
    performance_logger.addHandler(perf_handler)
    
    return logging.getLogger(__name__)

# Transaction management for rollback capability
@contextmanager
def processing_transaction():
    """Context manager for processing transactions with rollback"""
    checkpoints = []
    try:
        yield checkpoints
    except Exception as e:
        logger.error(f"Transaction failed: {e}")
        # Perform rollback operations here if needed
        raise

# Enhanced RTOPredictor with production features
class ProductionRTOPredictor:
    """
    Production-ready RTO (Return to Origin) Prediction Pipeline
    
    Modular version with separated responsibilities
    """
    
    def __init__(self, 
                 preprocessing_config: PreprocessingConfig = None,
                 model_config: ModelConfig = None,
                 pipeline_config: PipelineConfig = None):
        """Initialize the production RTO Predictor"""
        
        # Initialize configurations
        self.preprocessing_config = preprocessing_config or PreprocessingConfig()
        self.model_config = model_config or ModelConfig()
        self.pipeline_config = pipeline_config or PipelineConfig()
        
        # Setup directories
        self._setup_directories()
        
        # Initialize monitoring
        self.metrics_collector = MetricsCollector()
        
        # Initialize circuit breaker
        if self.pipeline_config.enable_circuit_breaker:
            self.circuit_breaker = CircuitBreaker(
                self.pipeline_config.circuit_breaker_threshold,
                self.pipeline_config.circuit_breaker_timeout
            )
        else:
            self.circuit_breaker = None
        
        # Initialize modular components
        self.data_validator = DataValidator(self.preprocessing_config)
        self.data_preprocessor = DataPreprocessor(self.preprocessing_config)
        self.model_trainer = ModelTrainer(self.model_config, self.pipeline_config)
        self.prediction_analyzer = PredictionAnalyzer()
        self.performance_analytics = PerformanceAnalytics()
        
        # Feature importance weights (keeping backward compatibility)
        self.feature_weights = {
            'CLIENT_NAME': 0.1,      # Very Low
            'CUSTOMER_NAME': 0.2,    # Low
            'CUSTOMER_PHONE': 0.95,  # Very High
            'CUSTOMER_ADDRESS': 0.95,# Very High
            'CUSTOMER_CITY': 0.3,    # Low or based on history
            'CUSTOMER_STATE': 0.3,   # Low or based on history
            'PINCODE': 0.3,          # Low or based on history
            'PAYMENT_MODE': 0.8,     # High
            'COURIER_NAME': 0.8,     # High
            'ITEM_DESCRIPTION': 0.7, # High or based on history
            'WEIGHT': 0.2,           # Low
            'QTY': 0.2,              # Low
            'INVOICE_VALUE': 0.2,     # Low
            'ORDER_CREATION_DATE': 0.1, # Very Low
            'COLLECTABLE_AMOUNT': 0.1, # Very Low
            'EDD': 0.3,              # Very Low
            'ZONE': 0.3,             # Low or based on history
        }
        
        # Health check status
        self.health_status = {
            'model_loaded': False,
            'last_prediction': None,
            'last_training': None,
            'error_count': 0
        }
        
        logger.info("Production RTO Predictor initialized")
    
    def _setup_directories(self):
        """Setup required directories"""
        for dir_attr in ['data_dir', 'model_dir', 'output_dir', 'log_dir', 'backup_dir']:
            dir_path = Path(getattr(self.pipeline_config, dir_attr))
            dir_path.mkdir(exist_ok=True)
    
    @monitor_performance
    def _validate_input_data(self, df: pd.DataFrame) -> None:
        """Comprehensive input data validation - delegates to DataValidator"""
        return self.data_validator.validate_input_data(df)
    
    def _data_quality_checks(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive data quality assessment - delegates to DataValidator"""
        return self.data_validator.data_quality_checks(df)
    
    @timeout_handler(300)  # 5 minute timeout
    @retry_on_failure(max_retries=3)
    @monitor_performance
    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        """Enhanced preprocessing with error handling and monitoring"""
        logger.info(f"Starting preprocessing for {'training' if is_training else 'prediction'} data...")
        
        with processing_transaction() as checkpoints:
            try:
                # Validate input data
                self._validate_input_data(df)
                
                # Create checkpoint
                df_checkpoint = df.copy()
                checkpoints.append(('input_validation', df_checkpoint))
                
                # Perform quality checks
                quality_report = self._data_quality_checks(df)
                self.metrics_collector.record_metric('data_quality_score', quality_report['quality_score'])
                
                if quality_report['quality_score'] < 60:
                    logger.warning(f"Low data quality score: {quality_report['quality_score']}")
                
                # Original preprocessing steps using modular components
                df = df.copy()
                
                # Enhanced processing with error handling
                processing_steps = [
                    ('handle_missing_values', self.data_preprocessor.handle_missing_values),
                    ('create_temporal_features', self.data_preprocessor.create_temporal_features),
                    ('create_geographic_features', lambda x: self.data_preprocessor.create_geographic_features(x, self.performance_analytics.pincode_stats)),
                    ('create_features', self.data_preprocessor.create_features),
                    ('create_attempt_features', self.data_preprocessor.create_attempt_features),
                    ('create_customer_features', self.data_preprocessor.create_customer_features),
                    ('clean_text_fields', self.data_preprocessor.clean_text_fields),
                    ('process_phone_numbers', self.data_preprocessor.process_phone_numbers),
                    ('process_addresses', self.data_preprocessor.process_addresses),
                ]
                
                for step_name, step_func in processing_steps:
                    try:
                        logger.debug(f"Executing preprocessing step: {step_name}")
                        df = step_func(df)
                        checkpoints.append((step_name, df.copy()))
                        
                    except Exception as e:
                        logger.error(f"Error in preprocessing step {step_name}: {e}")
                        # Try to continue with previous checkpoint
                        if checkpoints:
                            df = checkpoints[-1][1]
                        raise
                
                # Create target variable for training
                if is_training and 'CURRENT_STATUS' in df.columns:
                    df['RTO_TARGET'] = df['CURRENT_STATUS'].apply(self.data_preprocessor.create_target)
                
                # Encode categorical variables
                df = self.data_preprocessor.encode_categorical(df, is_training)
                
                # Handle outliers
                df = self.data_preprocessor.handle_outliers(df)
                
                # Feature scaling if scaler exists
                if hasattr(self.data_preprocessor, 'scaler') and self.data_preprocessor.scaler is not None:
                    df = self.data_preprocessor.scale_features(df)
                
                logger.info("Data preprocessing completed successfully")
                return df
                
            except Exception as e:
                self.health_status['error_count'] += 1
                logger.error(f"Preprocessing failed: {e}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise
    
    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare feature matrix for ML model - delegates to DataPreprocessor"""
        return self.data_preprocessor.prepare_features(df)
    
    def check_class_balance(self, df, target_col='RTO_TARGET'):
        """Check and report class balance - delegates to ModelTrainer"""
        self.model_trainer.check_class_balance(df, target_col)
    
    @timeout_handler(600)  # 10 minute timeout for training
    @monitor_performance
    def train_model(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Enhanced model training with comprehensive monitoring"""
        logger.info("Starting model training...")
        
        try:
            # Use circuit breaker if enabled
            if self.circuit_breaker:
                return self.circuit_breaker.call(self._train_model_internal, df)
            else:
                return self._train_model_internal(df)
                
        except Exception as e:
            self.health_status['error_count'] += 1
            logger.error(f"Model training failed: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def _train_model_internal(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Internal training method"""
        
        # Create backup before training
        self._create_backup()
        
        # Preprocess training data
        df_processed = self.preprocess_data(df, is_training=True)
        
        # Check if target exists
        if 'RTO_TARGET' not in df_processed.columns:
            raise ValueError("Training data must contain status information for target creation")
        
        # Save processed training data for debugging
        timestamp = datetime.now().strftime('%Y%m%d')
        processed_data_path = Path(self.pipeline_config.output_dir) / f"processed_training_data_{timestamp}.csv"
        df_processed.to_csv(processed_data_path, index=False)
        logger.info(f"Processed training data saved to: {processed_data_path}")
        
        # Check class balance
        self.check_class_balance(df_processed)
        
        # Prepare features and target
        X = self.prepare_features(df_processed)
        y = df_processed['RTO_TARGET'].values
        
        # Train model using ModelTrainer
        training_result = self.model_trainer.train_model_internal(X, y, self.data_preprocessor.feature_columns)
        
        # Update preprocessor with trained scaler
        self.data_preprocessor.scaler = self.model_trainer.scaler
        self.data_preprocessor.label_encoders = self.data_preprocessor.label_encoders
        
        # Store historical data for similarity matching
        self.prediction_analyzer.historical_data = df_processed.copy()
        
        # Calculate performance metrics
        self.performance_analytics.calculate_performance_metrics(df_processed)
        
        # Share performance data with prediction analyzer
        self.prediction_analyzer.courier_performance = self.performance_analytics.courier_performance
        self.prediction_analyzer.pincode_stats = self.performance_analytics.pincode_stats
        
        # Update health status
        self.health_status['model_loaded'] = True
        self.health_status['last_training'] = datetime.now().isoformat()
        
        # Save model snapshot
        self.model_trainer.save_model_snapshot()
        
        logger.info("Model training completed successfully")
        
        return {
            **training_result,
            'data_quality_score': getattr(self, '_last_quality_score', None)
        }
    
    @timeout_handler(180)  # 3 minute timeout for predictions
    @monitor_performance
    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Enhanced prediction with comprehensive error handling"""
        if self.model_trainer.model is None:
            raise ModelNotFoundError("Model not trained. Please train the model first.")
        
        logger.info(f"Making predictions for {len(df)} orders...")
        
        try:
            # Use circuit breaker if enabled
            if self.circuit_breaker:
                return self.circuit_breaker.call(self._predict_internal, df)
            else:
                return self._predict_internal(df)
                
        except Exception as e:
            self.health_status['error_count'] += 1
            logger.error(f"Prediction failed: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def _predict_internal(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Internal prediction method"""
        
        # Preprocess prediction data
        df_processed = self.preprocess_data(df, is_training=False)
        
        # Prepare features
        X = self.prepare_features(df_processed)
        
        # Make predictions using ModelTrainer
        predictions, probabilities = self.model_trainer.predict_internal(X)
        
        # Generate detailed results using PredictionAnalyzer
        results = self.prediction_analyzer.process_predictions(df_processed, predictions, probabilities)
        
        # Update health status
        self.health_status['last_prediction'] = datetime.now().isoformat()
        
        logger.info("Predictions completed successfully")
        
        return {
            'predictions': results,
            'summary': self.prediction_analyzer.generate_summary(df_processed, predictions, probabilities),
            'prediction_timestamp': datetime.now().isoformat(),
            'model_version': getattr(self.model_trainer, 'model_version', 'unknown')
        }
    
    def _create_backup(self):
        """Create backup of current model before training"""
        if self.model_trainer.model is not None:
            try:
                backup_dir = Path(self.pipeline_config.backup_dir) / datetime.now().strftime('%Y_%m_%d_%H')
                backup_dir.mkdir(exist_ok=True)
                
                import joblib
                joblib.dump(self.model_trainer.model, backup_dir / "model_backup.pkl")
                joblib.dump(self.data_preprocessor.label_encoders, backup_dir / "encoders_backup.pkl")
                joblib.dump(self.data_preprocessor.scaler, backup_dir / "scaler_backup.pkl")
                
                logger.info(f"Model backup created at: {backup_dir}")
                
            except Exception as e:
                logger.warning(f"Failed to create backup: {e}")
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get system health status"""
        import psutil
        return {
            **self.health_status,
            'circuit_breaker_state': self.circuit_breaker.state if self.circuit_breaker else 'disabled',
            'memory_usage_mb': psutil.Process().memory_info().rss / 1024 / 1024,
            'metrics': self.metrics_collector.get_metrics(),
            'uptime': time.time() - getattr(self, '_start_time', time.time())
        }
    
    def retrain_with_new_data(self, new_data: pd.DataFrame, retrain_threshold: float = None) -> Optional[Dict[str, Any]]:
        """
        Retrain model with new data if performance degradation is detected
        """
        if retrain_threshold is None:
            retrain_threshold = self.model_config.retrain_threshold
            
        logger.info("Checking if retraining is needed...")
        
        if self.model_trainer.model is None:
            logger.info("No existing model found. Training from scratch...")
            return self.train_model(new_data)
        
        try:
            # Evaluate current model on new data (if it has labels)
            if 'CURRENT_STATUS' in new_data.columns:
                new_data_processed = self.preprocess_data(new_data, is_training=True)
                X_new = self.prepare_features(new_data_processed)
                y_new = new_data_processed['RTO_TARGET'].values
                
                if len(X_new) > 0:
                    needs_retrain = self.model_trainer.retrain_with_new_data(X_new, y_new, retrain_threshold)
                    
                    if needs_retrain:
                        # Combine with historical data if available
                        if self.prediction_analyzer.historical_data is not None:
                            combined_data = pd.concat([self.prediction_analyzer.historical_data, new_data], ignore_index=True)
                        else:
                            combined_data = new_data
                        
                        return self.train_model(combined_data)
                    else:
                        logger.info("Performance acceptable. No retraining needed.")
                        return None
            
            # If no performance evaluation possible, just add to historical data
            logger.info("Adding new data to historical dataset...")
            if self.prediction_analyzer.historical_data is not None:
                self.prediction_analyzer.historical_data = pd.concat([self.prediction_analyzer.historical_data, new_data], ignore_index=True)
            else:
                self.prediction_analyzer.historical_data = new_data.copy()
            
            return None
            
        except Exception as e:
            logger.error(f"Error in retrain evaluation: {e}")
            return None
    
    # Delegate reporting methods to PerformanceAnalytics
    def get_courier_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive courier performance report"""
        return self.performance_analytics.get_courier_performance_report()
    
    def get_pincode_analysis(self, pincode: str = None) -> Dict[str, Any]:
        """Get delivery analysis for specific pincode or all pincodes"""
        return self.performance_analytics.get_pincode_analysis(pincode)
    
    # Delegate model management methods to ModelTrainer
    def load_model_snapshot(self, date: str = None):
        """Load model snapshot from specific date or latest"""
        self.model_trainer.load_model_snapshot(date)
        
        # Update preprocessor components
        self.data_preprocessor.scaler = self.model_trainer.scaler
        
        # Update health status
        self.health_status['model_loaded'] = True
        
        logger.info("Model snapshot loaded successfully")
    
    # Properties for backward compatibility
    @property
    def model(self):
        """Access to the trained model"""
        return self.model_trainer.model
    
    @property
    def label_encoders(self):
        """Access to label encoders"""
        return self.data_preprocessor.label_encoders
    
    @property
    def scaler(self):
        """Access to the scaler"""
        return self.data_preprocessor.scaler
    
    @property
    def feature_columns(self):
        """Access to feature columns"""
        return self.data_preprocessor.feature_columns
    
    @property
    def historical_data(self):
        """Access to historical data"""
        return self.prediction_analyzer.historical_data
    
    @property
    def courier_performance(self):
        """Access to courier performance data"""
        return self.performance_analytics.courier_performance
    
    @property
    def pincode_stats(self):
        """Access to pincode statistics"""
        return self.performance_analytics.pincode_stats
    
# Enhanced Pipeline Manager with production features
class ProductionRTOPipelineManager:
    """
    Production-ready pipeline manager for end-to-end RTO prediction workflow
    Enhanced with monitoring, error handling, and fault tolerance
    """
    
    def __init__(self, config_path: str = None):
        """Initialize production pipeline manager"""
        
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Setup logging
        global logger
        logger = setup_production_logging(self.config.get('log_dir', 'logs'))
        
        # Initialize predictor with production configs
        preprocessing_config = PreprocessingConfig(**self.config.get('preprocessing', {}))
        model_config = ModelConfig(**self.config.get('model', {}))
        pipeline_config = PipelineConfig(**self.config.get('pipeline', {}))
        
        self.predictor = ProductionRTOPredictor(
            preprocessing_config, model_config, pipeline_config
        )
        
        # Setup directories
        self.setup_directories()
        
        # Initialize monitoring
        self.metrics_collector = self.predictor.metrics_collector
        self._start_time = time.time()
        
        logger.info("Production RTO Pipeline Manager initialized")
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from file or use defaults"""
        
        default_config = {
            'data_dir': 'data',
            'model_dir': 'models',
            'output_dir': 'output',
            'log_dir': 'logs',
            'backup_dir': 'backups',
            'preprocessing': {
                'max_processing_time': 300,
                'batch_size': 10000,
                'memory_limit_mb': 2048,
                'required_columns': ['ORDER_NUMBER', 'CURRENT_STATUS', 'CUSTOMER_PHONE', 'CUSTOMER_ADDRESS', 'PAYMENT_MODE']
            },
            'model': {
                'retrain_threshold': 0.1,
                'min_training_samples': 100,
                'model_snapshot_retention_days': 30
            },
            'pipeline': {
                'enable_circuit_breaker': True,
                'circuit_breaker_threshold': 5,
                'circuit_breaker_timeout': 60
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                    # Deep merge configurations
                    for key, value in user_config.items():
                        if isinstance(value, dict) and key in default_config:
                            default_config[key].update(value)
                        else:
                            default_config[key] = value
            except Exception as e:
                logger.warning(f"Error loading config from {config_path}: {e}")
        
        return default_config
    
    def setup_directories(self):
        """Setup required directories"""
        for dir_name in ['data_dir', 'model_dir', 'output_dir', 'log_dir', 'backup_dir']:
            if dir_name in self.config:
                Path(self.config[dir_name]).mkdir(exist_ok=True)
    
    @monitor_performance
    def process_new_orders(self, csv_path: str, batch_size: int = None, validate_predictions: bool = False) -> Dict[str, Any]:
        """
        Process new orders from CSV file with enhanced error handling and validation
        
        Args:
            csv_path: Path to CSV file with new orders
            batch_size: Optional batch size for processing large files
            validate_predictions: If True and actual outcomes are available, validate predictions
            
        Returns:
            Prediction results with optional validation metrics
        """
        logger.info(f"Processing new orders from {csv_path}")
        
        try:
            # Validate file exists and is readable
            if not os.path.exists(csv_path):
                raise FileNotFoundError(f"CSV file not found: {csv_path}")
            
            # Check file size and warn if very large
            file_size_mb = os.path.getsize(csv_path) / (1024 * 1024)
            if file_size_mb > 100:  # 100MB threshold
                logger.warning(f"Large file detected: {file_size_mb:.2f}MB. Consider batch processing.")
            
            # Read CSV with error handling and encoding detection
            try:
                # Try different encodings if needed
                for encoding in ['utf-8', 'latin1', 'cp1252']:
                    try:
                        df = pd.read_csv(csv_path, encoding=encoding)
                        logger.info(f"Successfully read CSV with {encoding} encoding")
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    raise DataValidationError("Could not read CSV with any supported encoding")
                    
            except Exception as e:
                raise DataValidationError(f"Error reading CSV file: {e}")
            
            logger.info(f"Loaded {len(df)} orders from CSV")
            
            # Enhanced validation
            if df.empty:
                raise DataValidationError("CSV file is empty")
            
            # Check for minimum required columns
            required_cols = ['ORDER_NUMBER']  # At minimum we need order numbers
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                logger.warning(f"Missing recommended columns: {missing_cols}")
            
            # Check for duplicate order numbers
            if 'ORDER_NUMBER' in df.columns:
                duplicates = df['ORDER_NUMBER'].duplicated().sum()
                if duplicates > 0:
                    logger.warning(f"Found {duplicates} duplicate order numbers")
                    # Optionally remove duplicates
                    df = df.drop_duplicates(subset=['ORDER_NUMBER'], keep='first')
                    logger.info(f"Removed duplicates, processing {len(df)} unique orders")
            
            # Load latest model if not already loaded
            if self.predictor.model is None:
                try:
                    self.predictor.load_model_snapshot()
                    logger.info("Loaded latest model snapshot")
                except Exception as e:
                    logger.error(f"No trained model found: {e}")
                    raise ModelNotFoundError("No trained model available. Please train the model first.")
            
            # Process in batches if file is large
            batch_size = batch_size or self.predictor.preprocessing_config.batch_size
            
            if len(df) > batch_size:
                logger.info(f"Processing large file in batches of {batch_size}")
                results = self._process_in_batches(df, batch_size)
            else:
                # Make predictions
                results = self.predictor.predict(df)
            
            # Enhanced results with validation if actual outcomes available
            if validate_predictions and 'CURRENT_STATUS' in df.columns:
                logger.info("Validating predictions against actual outcomes...")
                results = self._validate_predictions(results, df)
            
            # Enhanced results summary
            results = self._enhance_results_summary(results, df)
            
            # Save results with metadata
            self._save_prediction_results(results, csv_path)
            
            logger.info(f"Successfully processed {len(results['predictions'])} orders")
            return results
            
        except Exception as e:
            logger.error(f"Error processing new orders: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Log error metrics
            if hasattr(self, 'metrics_collector'):
                self.metrics_collector.record_metric('processing_errors', 1)
            
            # Return error result instead of crashing
            return {
                'error': str(e),
                'predictions': [],
                'summary': {'total_orders': 0, 'error': str(e)},
                'processing_timestamp': pd.Timestamp.now().isoformat()
            }

    def _validate_predictions(self, results: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate predictions against actual outcomes if available
        
        Args:
            results: Prediction results
            df: Original dataframe with actual outcomes
            
        Returns:
            Enhanced results with validation metrics
        """
        try:
            # Extract actual outcomes
            actual_outcomes = []
            predicted_outcomes = []
            
            for i, pred in enumerate(results['predictions']):
                if i < len(df):
                    actual_status = df.iloc[i]['CURRENT_STATUS']
                    actual_rto = self.predictor.data_preprocessor.create_target(actual_status)
                    predicted_rto = pred['rto_prediction']
                    
                    actual_outcomes.append(actual_rto)
                    predicted_outcomes.append(int(predicted_rto))
            
            if len(actual_outcomes) > 0:
                # Calculate confusion matrix
                validation_metrics = self._calculate_validation_metrics(
                    actual_outcomes, predicted_outcomes
                )
                
                results['validation'] = validation_metrics
                logger.info(f"Validation completed: Accuracy = {validation_metrics['accuracy']:.2%}")
            
        except Exception as e:
            logger.warning(f"Could not validate predictions: {e}")
            results['validation'] = {'error': str(e)}
        
        return results

    def _calculate_validation_metrics(self, y_true: List[int], y_pred: List[int]) -> Dict[str, Any]:
        """
        Calculate comprehensive validation metrics including confusion matrix
        
        Args:
            y_true: Actual RTO outcomes (0=Delivered, 1=RTO)
            y_pred: Predicted RTO outcomes (0=Delivered, 1=RTO)
            
        Returns:
            Dictionary with validation metrics
        """
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        try:
            # Basic metrics
            accuracy = accuracy_score(y_true, y_pred)
            precision = precision_score(y_true, y_pred, zero_division=0)
            recall = recall_score(y_true, y_pred, zero_division=0)
            f1 = f1_score(y_true, y_pred, zero_division=0)
            
            # Confusion matrix counts (using the function we created earlier)
            cm = confusion_matrix(y_true, y_pred)
            if cm.shape == (2, 2):
                tn, fp, fn, tp = cm.ravel()
                
                confusion_counts = {
                    'true_positives': int(tp),
                    'true_negatives': int(tn),
                    'false_positives': int(fp),
                    'false_negatives': int(fn),
                    'total_orders': int(tp + tn + fp + fn)
                }
                
                # Business-friendly interpretations
                business_metrics = {
                    'correctly_predicted_rto': int(tp),
                    'correctly_predicted_delivered': int(tn),
                    'wrongly_flagged_as_rto': int(fp),
                    'missed_rto_cases': int(fn),
                    'total_actual_rto': int(tp + fn),
                    'total_actual_delivered': int(tn + fp)
                }
            else:
                confusion_counts = {'error': 'Unexpected confusion matrix shape'}
                business_metrics = {}
            
            # Cost analysis (business impact)
            cost_analysis = self._calculate_business_cost(y_true, y_pred)
            
            validation_metrics = {
                'accuracy': float(accuracy),
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'confusion_matrix': confusion_counts,
                'business_metrics': business_metrics,
                'cost_analysis': cost_analysis,
                'validation_timestamp': pd.Timestamp.now().isoformat()
            }
            
            return validation_metrics
            
        except Exception as e:
            return {'error': str(e)}

    def _calculate_business_cost(self, y_true: List[int], y_pred: List[int]) -> Dict[str, float]:
        """
        Calculate business cost of prediction errors
        
        Args:
            y_true: Actual outcomes
            y_pred: Predicted outcomes
            
        Returns:
            Dictionary with cost analysis
        """
        try:
            # Define business costs (you can adjust these values)
            COST_FALSE_POSITIVE = 50.0   # Cost of wrongly flagging as RTO (customer service, delays)
            COST_FALSE_NEGATIVE = 200.0  # Cost of missing actual RTO (shipping cost, handling)
            COST_TRUE_POSITIVE = 10.0    # Cost of correctly identifying RTO (prevention cost)
            COST_TRUE_NEGATIVE = 0.0     # No cost for correct delivery prediction
            
            # Calculate costs
            total_cost = 0.0
            cost_breakdown = {
                'false_positive_cost': 0.0,
                'false_negative_cost': 0.0,
                'true_positive_cost': 0.0,
                'true_negative_cost': 0.0
            }
            
            for actual, predicted in zip(y_true, y_pred):
                if actual == 0 and predicted == 1:  # False Positive
                    cost_breakdown['false_positive_cost'] += COST_FALSE_POSITIVE
                elif actual == 1 and predicted == 0:  # False Negative
                    cost_breakdown['false_negative_cost'] += COST_FALSE_NEGATIVE
                elif actual == 1 and predicted == 1:  # True Positive
                    cost_breakdown['true_positive_cost'] += COST_TRUE_POSITIVE
                # True Negative has no cost
            
            total_cost = sum(cost_breakdown.values())
            
            return {
                'total_cost': total_cost,
                'average_cost_per_order': total_cost / len(y_true) if len(y_true) > 0 else 0,
                'cost_breakdown': cost_breakdown,
                'cost_savings_vs_no_model': self._calculate_cost_savings(y_true),
                'cost_assumptions': {
                    'false_positive_cost': COST_FALSE_POSITIVE,
                    'false_negative_cost': COST_FALSE_NEGATIVE,
                    'true_positive_cost': COST_TRUE_POSITIVE
                }
            }
            
        except Exception as e:
            return {'error': str(e)}

    def _calculate_cost_savings(self, y_true: List[int]) -> float:
        """Calculate cost savings compared to no prediction model"""
        try:
            # Without model, assume we treat all orders as potential RTO
            COST_TREATING_ALL_AS_RTO = 100.0  # Average cost of extra precautions for all orders
            
            baseline_cost = len(y_true) * COST_TREATING_ALL_AS_RTO
            return baseline_cost
            
        except Exception as e:
            return 0.0

    def _enhance_results_summary(self, results: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Enhance results with additional analytics and insights
        
        Args:
            results: Original prediction results
            df: Original dataframe
            
        Returns:
            Enhanced results with additional insights
        """
        try:
            summary = results.get('summary', {})
            
            # Add data quality metrics
            data_quality = {
                'input_data_quality': {
                    'total_rows': len(df),
                    'missing_values_pct': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
                    'duplicate_orders': df.duplicated().sum() if len(df) > 0 else 0,
                    'data_completeness_score': self._calculate_completeness_score(df)
                }
            }
            
            # Add prediction confidence analysis
            if 'predictions' in results:
                probabilities = [p.get('rto_probability', 0) for p in results['predictions']]
                confidence_analysis = {
                    'prediction_confidence': {
                        'avg_confidence': np.mean(probabilities),
                        'min_confidence': np.min(probabilities),
                        'max_confidence': np.max(probabilities),
                        'low_confidence_count': sum(1 for p in probabilities if 0.3 <= p <= 0.7),
                        'high_confidence_count': sum(1 for p in probabilities if p < 0.3 or p > 0.7)
                    }
                }
            else:
                confidence_analysis = {}
            
            # Merge all enhancements
            enhanced_summary = {
                **summary,
                **data_quality,
                **confidence_analysis,
                'enhancement_timestamp': pd.Timestamp.now().isoformat()
            }
            
            results['summary'] = enhanced_summary
            
        except Exception as e:
            logger.warning(f"Could not enhance results summary: {e}")
        
        return results

    def _calculate_completeness_score(self, df: pd.DataFrame) -> float:
        """Calculate data completeness score (0-100)"""
        try:
            total_cells = len(df) * len(df.columns)
            missing_cells = df.isnull().sum().sum()
            completeness = ((total_cells - missing_cells) / total_cells) * 100
            return round(completeness, 2)
        except:
            return 0.0

    # Usage example for validation
    def validate_recent_predictions(self, prediction_file: str, actual_outcomes_file: str) -> Dict[str, Any]:
        """
        Validate recent predictions against actual outcomes
        
        Args:
            prediction_file: CSV file with predictions
            actual_outcomes_file: CSV file with actual outcomes
            
        Returns:
            Validation results with confusion matrix and business metrics
        """
        try:
            # Load prediction and actual data
            pred_df = pd.read_csv(prediction_file)
            actual_df = pd.read_csv(actual_outcomes_file)
            
            # Merge on order number
            merged = pred_df.merge(actual_df, on='ORDER_NUMBER', how='inner')
            
            if len(merged) == 0:
                return {'error': 'No matching orders found between prediction and actual files'}
            
            # Extract predictions and actuals
            y_pred = merged['rto_prediction'].astype(int).tolist()
            y_true = [self.predictor.data_preprocessor.create_target(status) for status in merged['CURRENT_STATUS']]
            
            # Calculate validation metrics
            validation_results = self._calculate_validation_metrics(y_true, y_pred)
            
            # Add summary
            validation_results['summary'] = {
                'total_validated_orders': len(merged),
                'validation_coverage': len(merged) / len(pred_df) * 100,
                'validation_date': pd.Timestamp.now().isoformat()
            }
            
            return validation_results
            
        except Exception as e:
            logger.error(f"Error validating predictions: {e}")
            return {'error': str(e)}



    
    def _process_in_batches(self, df: pd.DataFrame, batch_size: int) -> Dict[str, Any]:
        """Process large dataframes in batches"""
        
        all_predictions = []
        batch_summaries = []
        
        num_batches = len(df) // batch_size + (1 if len(df) % batch_size > 0 else 0)
        
        for i in range(num_batches):
            start_idx = i * batch_size
            end_idx = min((i + 1) * batch_size, len(df))
            
            batch_df = df.iloc[start_idx:end_idx]
            
            logger.info(f"Processing batch {i+1}/{num_batches} ({len(batch_df)} orders)")
            
            try:
                batch_results = self.predictor.predict(batch_df)
                all_predictions.extend(batch_results['predictions'])
                batch_summaries.append(batch_results['summary'])
                
            except Exception as e:
                logger.error(f"Error processing batch {i+1}: {e}")
                # Continue with other batches
                continue
        
        # Combine results
        combined_results = {
            'predictions': all_predictions,
            'summary': self._combine_batch_summaries(batch_summaries),
            'batch_processing': True,
            'total_batches': num_batches
        }
        
        return combined_results
    
    def _combine_batch_summaries(self, batch_summaries: List[Dict]) -> Dict:
        """Combine summaries from multiple batches"""
        
        if not batch_summaries:
            return {}
        
        combined = {
            'total_orders': sum(s.get('total_orders', 0) for s in batch_summaries),
            'predicted_rto': sum(s.get('predicted_rto', 0) for s in batch_summaries),
            'risk_distribution': {
                'high_risk': sum(s.get('risk_distribution', {}).get('high_risk', 0) for s in batch_summaries),
                'medium_risk': sum(s.get('risk_distribution', {}).get('medium_risk', 0) for s in batch_summaries),
                'low_risk': sum(s.get('risk_distribution', {}).get('low_risk', 0) for s in batch_summaries)
            }
        }
        
        # Calculate derived metrics
        if combined['total_orders'] > 0:
            combined['rto_rate'] = combined['predicted_rto'] / combined['total_orders']
            combined['average_risk_score'] = np.mean([
                s.get('average_risk_score', 0.5) for s in batch_summaries
            ])
        
        return combined
    
    @monitor_performance
    def train_initial_model(self, training_data_path: str) -> Dict[str, Any]:
        """
        Train initial model with historical data and enhanced validation
        
        Args:
            training_data_path: Path to historical training data CSV
            
        Returns:
            Training results
        """
        logger.info(f"Training initial model with data from {training_data_path}")
        
        try:
            # Validate file exists
            if not os.path.exists(training_data_path):
                raise FileNotFoundError(f"Training data file not found: {training_data_path}")
            
            # Read training data
            df = pd.read_csv(training_data_path)
            logger.info(f"Loaded {len(df)} records for training")
            
            if len(df) < self.predictor.model_config.min_training_samples:
                raise ValueError(f"Insufficient training data. Need at least {self.predictor.model_config.min_training_samples} samples, got {len(df)}")
            
            # Train model
            results = self.predictor.train_model(df)
            
            # Save training results
            self._save_training_results(results, training_data_path)
            
            return results
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def daily_retrain(self, new_data_path: str = None) -> Optional[Dict[str, Any]]:
        """
        Perform daily retraining if needed with enhanced monitoring
        
        Args:
            new_data_path: Path to new training data (optional)
            
        Returns:
            Retraining results or None if no retraining needed
        """
        logger.info("Starting daily retrain process")
        
        try:
            if new_data_path and os.path.exists(new_data_path):
                new_data = pd.read_csv(new_data_path)
                logger.info(f"Loaded {len(new_data)} new records for potential retraining")
                
                return self.predictor.retrain_with_new_data(new_data)
            else:
                logger.info("No new training data provided for retraining")
                return None
                
        except Exception as e:
            logger.error(f"Error in daily retrain: {e}")
            return None
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report with system metrics"""
        
        logger.info("Generating performance report")
        
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'system_health': self.predictor.get_health_status(),
                'courier_performance': self.predictor.get_courier_performance_report(),
                'pincode_analysis': self.predictor.get_pincode_analysis(),
                'model_info': {
                    'model_type': type(self.predictor.model).__name__ if self.predictor.model else None,
                    'feature_count': len(self.predictor.feature_columns) if self.predictor.feature_columns else 0,
                    'feature_importance': self.predictor.model_trainer.get_feature_importance(),
                    'model_version': getattr(self.predictor, 'model_version', 'unknown')
                },
                'performance_metrics': self.metrics_collector.get_metrics()
            }
            
            # Save report
            report_path = Path(self.config['output_dir']) / f"performance_report_{datetime.now().strftime('%Y%m%d')}.json"
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            
            logger.info(f"Performance report saved to {report_path}")
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating performance report: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def _save_prediction_results(self, results: Dict, original_csv_path: str):
        """Save prediction results with enhanced metadata"""
        
        timestamp = datetime.now().strftime('%Y%m%d')
        
        # Save complete results
        output_file = Path(self.config['output_dir']) / f"predictions_{timestamp}.json"
        
        # Create summary CSV
        summary_data = []
        for pred in results['predictions']:
            if 'error' not in pred:  # Skip failed predictions
                summary_data.append({
                    'order_index': pred['order_index'],
                    'order_number': pred['order_number'],
                    'order_current_status': pred['order_current_status'],
                    'payment_mode': pred['payment_mode'],
                    'cod_value': pred['cod_value'],
                    'order_created_at': pred['order_created_at'],
                    'rto_prediction': pred['rto_prediction'],
                    'rto_probability': pred['rto_probability'],
                    'risk_level': pred['risk_level'],
                    'prediction_timestamp': pred.get('prediction_timestamp', timestamp)
                })
        
        summary_df = pd.DataFrame(summary_data)
        summary_csv = Path(self.config['output_dir']) / f"prediction_summary_{timestamp}.csv"
        
        try:
            # Save both files
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            if not summary_df.empty:
                summary_df.to_csv(summary_csv, index=False)
            
            # Save metadata
            metadata = {
                'source_file': original_csv_path,
                'processing_timestamp': timestamp,
                'total_orders': len(results['predictions']),
                'successful_predictions': len(summary_data),
                'failed_predictions': len(results['predictions']) - len(summary_data),
                'model_version': getattr(self.predictor, 'model_version', 'unknown')
            }
            
            metadata_file = Path(self.config['output_dir']) / f"metadata_{timestamp}.json"
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Prediction results saved to {output_file} and {summary_csv}")
            
        except Exception as e:
            logger.error(f"Error saving prediction results: {e}")
    
    def _save_training_results(self, results: Dict, training_data_path: str):
        """Save training results with enhanced metadata"""
        
        timestamp = datetime.now().strftime('%Y%m%d')
        output_file = Path(self.config['output_dir']) / f"training_results_{timestamp}.json"
        
        try:
            # Add metadata to results
            enhanced_results = {
                **results,
                'training_data_source': training_data_path,
                'training_timestamp': timestamp,
                'system_info': {
                    'python_version': '.'.join(map(str, sys.version_info[:3])),
                    'memory_usage_mb': psutil.Process().memory_info().rss / 1024 / 1024,
                    'cpu_count': psutil.cpu_count()
                }
            }
            
            with open(output_file, 'w') as f:
                json.dump(enhanced_results, f, indent=2, default=str)
            
            logger.info(f"Training results saved to {output_file}")
            
        except Exception as e:
            logger.error(f"Error saving training results: {e}")


# Health Check Endpoint
def health_check(pipeline_manager: ProductionRTOPipelineManager) -> Dict[str, Any]:
    """
    Comprehensive health check for the RTO pipeline
    """
    try:
        health_status = pipeline_manager.predictor.get_health_status()
        
        # Add additional checks
        health_status.update({
            'pipeline_status': 'healthy',
            'api_version': '1.0.0',
            'checks': {
                'model_loaded': health_status['model_loaded'],
                'memory_ok': health_status['memory_usage_mb'] < 1024,  # Less than 1GB
                'recent_activity': health_status['last_prediction'] is not None,
                'error_rate_ok': health_status['error_count'] < 10
            }
        })
        
        # Overall health determination
        all_checks_pass = all(health_status['checks'].values())
        health_status['overall_status'] = 'healthy' if all_checks_pass else 'degraded'
        
        return health_status
        
    except Exception as e:
        return {
            'pipeline_status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


# Example usage with backward compatibility
def main():
    """Main function demonstrating production pipeline usage"""
    
    # Initialize production pipeline (backward compatible)
    pipeline = ProductionRTOPipelineManager()
    
    try:
        # Health check
        health = health_check(pipeline)
        print(f"Pipeline Health: {health['overall_status']}")
        
        # Example: Train initial model
        print("Training model...")
        training_results = pipeline.train_initial_model(r'/Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/data/to_train/training_data_2025_05_23.csv')
        print(f"Training completed: {training_results['best_model']}")
        
        # Example: Process new orders
        print("Processing new orders...")
        prediction_results = pipeline.process_new_orders('/Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/data/to_predict/predict_2025_06_03.csv',
                                                         validate_predictions=True)
        print(f"Processed {len(prediction_results['predictions'])} orders")

        if 'validation' in prediction_results:
            validation = prediction_results['validation']
            print(f"Accuracy: {validation['accuracy']:.2%}")
            print(f"Precision: {validation['precision']:.2%}")
            print(f"Recall: {validation['recall']:.2%}")
            
            # Print confusion matrix in business terms
            bm = validation['business_metrics']
            print(f"\n📊 Business Impact:")
            print(f"✅ Correctly identified RTO: {bm['correctly_predicted_rto']}")
            print(f"✅ Correctly identified Delivered: {bm['correctly_predicted_delivered']}")
            print(f"❌ Wrongly flagged as RTO: {bm['wrongly_flagged_as_rto']}")
            print(f"❌ Missed RTO cases: {bm['missed_rto_cases']}")
            
            # Print cost analysis
            if 'cost_analysis' in validation:
                cost = validation['cost_analysis']
                print(f"\n💰 Cost Analysis:")
                print(f"Total cost: ${cost['total_cost']:.2f}")
                print(f"Average cost per order: ${cost['average_cost_per_order']:.2f}")
                print(f"Cost savings: ${cost}")
        
        # Example: Generate performance report
        print("Generating performance report...")
        report = pipeline.generate_performance_report()
        print("Performance report generated")
        
        print("\n✅ Production RTO Prediction Pipeline is ready!")
        print("\nProduction Features Added:")
        print("- Comprehensive error handling and validation")
        print("- Performance monitoring and metrics")
        print("- Circuit breaker for fault tolerance")
        print("- Timeout protection")
        print("- Retry mechanisms")
        print("- Health checks")
        print("- Batch processing for large files")
        print("- Model versioning and snapshots")
        print("- Configuration management")
        print("- Enhanced logging")
        print("- Backup and recovery")
        
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        print(f"❌ Pipeline failed: {e}")


# For backward compatibility, create aliases
# RTOPredictor = ProductionRTOPredictor
# RTOPipelineManager = ProductionRTOPipelineManager

if __name__ == "__main__":
    # Setup logging first
    logger = setup_production_logging()
    
    # Import required modules
    import sys
    
    main()