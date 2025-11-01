import pandas as pd
import numpy as np
import logging
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

# Data processing
from scipy.spatial.distance import cosine
import re
from collections import defaultdict
from src.pipeline.data_preprocessing_module import DataPreprocessor
from src.pipeline.model_training_module import ModelTrainer
from src.pipeline.prediction_module import PredictionAnalyzer
from src.pipeline.performance_analytics_module import PerformanceAnalytics
from src.pipeline.data_validation_module import DataValidator
from src.pipeline.model_management_service import ModelManagementService
from src.pipeline.prediction_orchestrator import PredictionOrchestrator
from src.pipeline.error_handling_manager import ErrorHandlingManager
from src.pipeline.method_delegation_handler import MethodDelegationHandler
from src.config.configuration_manager import ConfigurationManager
from src.pipeline.logging_manager import LoggingManager
from src.core.component_factory import ComponentFactory
from src.pipeline.fault_tolerance_manager import FaultToleranceDecorators, CircuitBreaker
from src.pipeline.health_monitoring_service import HealthMonitoringService
from src.core.monitoring_metrics_manager import MonitoringDecorators
from src.pipeline.backup_recovery_manager import BackupRecoveryManager
from src.pipeline.transaction_manager import TransactionManager
from src.pipeline.dataclass_configurations import ModelConfig, PreprocessingConfig, PipelineConfig
from src.core.monitoring_metrics_manager import MetricsCollector
from src.core.exceptions import *
from src.pipeline.enhanced_logging_service import EnhancedLoggingService

warnings.filterwarnings('ignore')

# Initialize module-level logger
logger = logging.getLogger(__name__)

# Enhanced RTOPredictor with production features
class ProductionRTOPredictor:
    """
    Production-ready RTO (Return to Origin) Prediction Pipeline
    
    Ultra-modular version with maximum separation of concerns
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
        
        # Initialize specialized services
        self.logging_service = EnhancedLoggingService()
        self.backup_manager = BackupRecoveryManager(self.pipeline_config)
        self.transaction_manager = TransactionManager()
        self.health_monitor = HealthMonitoringService()
        
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
        
        logger.info("Production RTO Predictor initialized with ultra-modular architecture")
    
    def _setup_directories(self):
        """Setup required directories"""
        for dir_attr in ['data_dir', 'model_dir', 'output_dir', 'log_dir', 'backup_dir']:
            dir_path = Path(getattr(self.pipeline_config, dir_attr))
            dir_path.mkdir(exist_ok=True)
    
    @MonitoringDecorators.monitor_performance
    def _validate_input_data(self, df: pd.DataFrame) -> None:
        """Comprehensive input data validation - delegates to DataValidator"""
        return self.data_validator.validate_input_data(df)
    
    def _data_quality_checks(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive data quality assessment - delegates to DataValidator"""
        return self.data_validator.data_quality_checks(df)
    
    @FaultToleranceDecorators.timeout_handler(300)  # 5 minute timeout
    @FaultToleranceDecorators.retry_on_failure(max_retries=3)
    @MonitoringDecorators.monitor_performance
    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        """Enhanced preprocessing with error handling and monitoring"""
        logger.info(f"Starting preprocessing for {'training' if is_training else 'prediction'} data...")
        
        with self.transaction_manager.processing_transaction() as checkpoints:
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
    
    @FaultToleranceDecorators.timeout_handler(600)  # 10 minute timeout for training
    @MonitoringDecorators.monitor_performance
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
        
        # Create backup before training using BackupRecoveryManager
        self.backup_manager.create_backup(self.model_trainer, self.data_preprocessor)
        
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
    
    @FaultToleranceDecorators.timeout_handler(180)  # 3 minute timeout for predictions
    @MonitoringDecorators.monitor_performance
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
        """Create backup of current model before training - delegates to BackupRecoveryManager"""
        return self.backup_manager.create_backup(self.model_trainer, self.data_preprocessor)
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get system health status"""
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
    
    # Backup and recovery methods
    def restore_backup(self, backup_path: str):
        """Restore model from backup"""
        return self.backup_manager.restore_backup(backup_path, self.model_trainer, self.data_preprocessor)
    
    def list_available_backups(self):
        """List all available backup directories"""
        return self.backup_manager.list_available_backups()
    
    def cleanup_old_backups(self, max_backups: int = 10):
        """Clean up old backup directories"""
        return self.backup_manager.cleanup_old_backups(max_backups)
    
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
    
    Ultra-modular version with maximum separation of concerns and all production features
    """
    
    def __init__(self, config_path: str = None):
        """Initialize production pipeline manager with ultra-modular architecture"""
        
        # Initialize specialized managers
        self.config_manager = ConfigurationManager()
        self.logging_manager = LoggingManager()
        self.component_factory = ComponentFactory()
        self.error_handler = ErrorHandlingManager()
        
        # Load configuration
        self.config = self.config_manager.load_config(config_path)
        
        # Setup logging
        global logger
        logger = self.logging_manager.setup_production_logging(self.config.get('log_dir', 'logs'))
        
        # Initialize predictor with configurations
        preprocessing_config = PreprocessingConfig(**self.config.get('preprocessing', {}))
        model_config = ModelConfig(**self.config.get('model', {}))
        pipeline_config = PipelineConfig(**self.config.get('pipeline', {}))
        
        # Initialize ultra-modular predictor
        self.predictor = ProductionRTOPredictor(
            preprocessing_config, model_config, pipeline_config
        )
        
        # Setup directories
        self.config_manager.setup_directories(self.config)
        
        # Create all modular components
        self.components = self.component_factory.create_all_components(self.predictor, self.config)
        
        # Initialize specialized services
        self.model_service = ModelManagementService(self.predictor)
        self.prediction_orchestrator = PredictionOrchestrator(self.components, self.predictor, self.model_service)
        self.error_handler = ErrorHandlingManager(self.predictor.metrics_collector)
        self.delegation_handler = MethodDelegationHandler(self.components, self.predictor)
        self.health_monitor = HealthMonitoringService(self)
        
        # Initialize monitoring
        self.metrics_collector = self.predictor.metrics_collector
        self._start_time = time.time()
        
        logger.info("Ultra Production RTO Pipeline Manager initialized with maximum modularity")
    
    # Original method preserved with same signature and behavior
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from file or use defaults - delegates to ConfigurationManager"""
        return self.config_manager.load_config(config_path)
    
    # Original method preserved with same signature and behavior
    def setup_directories(self):
        """Setup required directories - delegates to ConfigurationManager"""
        self.config_manager.setup_directories(self.config)
    
    @MonitoringDecorators.monitor_performance
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
        self.error_handler.log_operation_start("processing new orders", f"from {csv_path}")
        
        try:
            # Use the prediction orchestrator to handle the complete workflow
            results = self.prediction_orchestrator.execute_prediction_workflow(
                csv_path, batch_size, validate_predictions
            )
            
            self.error_handler.log_operation_success("processing new orders", f"{len(results['predictions'])} orders")
            return results
            
        except Exception as e:
            return self.error_handler.handle_processing_error(e, "processing new orders")

    # All delegation methods preserved with exact same signatures and behavior
    def _validate_predictions(self, results: Dict[str, Any], df) -> Dict[str, Any]:
        """Validate predictions against actual outcomes - delegates to ValidationAnalytics"""
        return self.delegation_handler.validate_predictions(results, df)

    def _calculate_validation_metrics(self, y_true, y_pred) -> Dict[str, Any]:
        """Calculate validation metrics - delegates to ValidationAnalytics"""
        return self.delegation_handler.calculate_validation_metrics(y_true, y_pred)

    def _calculate_business_cost(self, y_true, y_pred) -> Dict[str, float]:
        """Calculate business cost - delegates to ValidationAnalytics"""
        return self.delegation_handler.calculate_business_cost(y_true, y_pred)

    def _calculate_cost_savings(self, y_true) -> float:
        """Calculate cost savings - delegates to ValidationAnalytics"""
        return self.delegation_handler.calculate_cost_savings(y_true)

    def _enhance_results_summary(self, results: Dict[str, Any], df) -> Dict[str, Any]:
        """Enhance results summary - delegates to ResultsEnhancer"""
        return self.delegation_handler.enhance_results_summary(results, df)

    def _calculate_completeness_score(self, df) -> float:
        """Calculate completeness score - delegates to ResultsEnhancer"""
        return self.delegation_handler.calculate_completeness_score(df)

    def validate_recent_predictions(self, prediction_file: str, actual_outcomes_file: str) -> Dict[str, Any]:
        """
        Validate recent predictions against actual outcomes
        
        Args:
            prediction_file: CSV file with predictions
            actual_outcomes_file: CSV file with actual outcomes
            
        Returns:
            Validation results with confusion matrix and business metrics
        """
        return self.delegation_handler.validate_recent_predictions(prediction_file, actual_outcomes_file)

    def _process_in_batches(self, df, batch_size: int) -> Dict[str, Any]:
        """Process in batches - delegates to FileProcessor"""
        return self.delegation_handler.process_in_batches(df, batch_size)
    
    def _combine_batch_summaries(self, batch_summaries) -> Dict:
        """Combine batch summaries - delegates to FileProcessor"""
        return self.delegation_handler.combine_batch_summaries(batch_summaries)
    
    @MonitoringDecorators.monitor_performance
    def train_initial_model(self, training_data_path: str) -> Dict[str, Any]:
        """
        Train initial model with historical data and enhanced validation
        
        Args:
            training_data_path: Path to historical training data CSV
            
        Returns:
            Training results
        """
        self.error_handler.log_operation_start("training initial model", f"with data from {training_data_path}")
        
        try:
            results = self.delegation_handler.train_initial_model(training_data_path)
            self.error_handler.log_operation_success("training initial model")
            return results
        except Exception as e:
            return self.error_handler.handle_processing_error(e, "training initial model")
    
    def daily_retrain(self, new_data_path: str = None) -> Optional[Dict[str, Any]]:
        """
        Perform daily retraining if needed with enhanced monitoring
        
        Args:
            new_data_path: Path to new training data (optional)
            
        Returns:
            Retraining results or None if no retraining needed
        """
        self.error_handler.log_operation_start("daily retrain", f"with data: {new_data_path}")
        
        try:
            results = self.delegation_handler.daily_retrain(new_data_path)
            if results:
                self.error_handler.log_operation_success("daily retrain", "model was retrained")
            else:
                self.error_handler.log_operation_success("daily retrain", "no retraining needed")
            return results
        except Exception as e:
            return self.error_handler.handle_processing_error(e, "daily retrain")
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report with system metrics"""
        self.error_handler.log_operation_start("generating performance report")
        
        try:
            results = self.delegation_handler.generate_performance_report()
            self.error_handler.log_operation_success("generating performance report")
            return results
        except Exception as e:
            return self.error_handler.handle_processing_error(e, "generating performance report")
    
    def _save_prediction_results(self, results: Dict, original_csv_path: str):
        """Save prediction results - delegates to OutputManager"""
        self.delegation_handler.save_prediction_results(results, original_csv_path)
    
    def _save_training_results(self, results: Dict, training_data_path: str):
        """Save training results - delegates to OutputManager"""
        self.delegation_handler.save_training_results(results, training_data_path)
    
    # Health monitoring methods
    def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check for the RTO pipeline"""
        return self.health_monitor.health_check()
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get detailed system metrics"""
        return self.health_monitor.get_system_metrics()
    
    # Backup and recovery methods (delegated to predictor)
    def create_backup(self):
        """Create backup of current model"""
        return self.predictor._create_backup()
    
    def restore_backup(self, backup_path: str):
        """Restore model from backup"""
        return self.predictor.restore_backup(backup_path)
    
    def list_available_backups(self):
        """List all available backup directories"""
        return self.predictor.list_available_backups()
    
    def cleanup_old_backups(self, max_backups: int = 10):
        """Clean up old backup directories"""
        return self.predictor.cleanup_old_backups(max_backups)
    
    # Properties for accessing internal components (for advanced usage)
    @property
    def file_processor(self):
        """Access to file processor component"""
        return self.components['file_processor']
    
    @property
    def validation_analytics(self):
        """Access to validation analytics component"""
        return self.components['validation_analytics']
    
    @property
    def results_enhancer(self):
        """Access to results enhancer component"""
        return self.components['results_enhancer']
    
    @property
    def training_manager(self):
        """Access to training manager component"""
        return self.components['training_manager']
    
    @property
    def reporting_manager(self):
        """Access to reporting manager component"""
        return self.components['reporting_manager']
    
    @property
    def output_manager(self):
        """Access to output manager component"""
        return self.components['output_manager']


# Enhanced Health Check Function (keeping original signature)
def health_check(pipeline_manager: ProductionRTOPipelineManager) -> Dict[str, Any]:
    """
    Comprehensive health check for the RTO pipeline (original function preserved)
    """
    return pipeline_manager.health_check()


# Main function with all original functionality preserved
def main():
    """Main function demonstrating production pipeline usage with all enhancements"""
    
    # Initialize ultra-modular production pipeline (backward compatible)
    pipeline = ProductionRTOPipelineManager()
    
    try:
        # Health check
        health = health_check(pipeline)
        print(f"Pipeline Health: {health['overall_status']}")
        
        # System metrics
        metrics = pipeline.get_system_metrics()
        print(f"Memory Usage: {metrics['process_memory_mb']:.1f}MB")
        print(f"CPU Usage: {metrics['process_cpu_percent']:.1f}%")
        
        # Example: Train initial model
        print("Training model...")
        training_results = pipeline.train_initial_model('/Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/data/to_train/training_data_2025_05_23.csv')
        print(f"Training completed: {training_results.get('best_model', 'Unknown')}")
        
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
        
        # Example: Generate performance report
        print("Generating performance report...")
        report = pipeline.generate_performance_report()
        print("Performance report generated")
        
        # Example: Backup management
        print("Creating backup...")
        backup_path = pipeline.create_backup()
        if backup_path:
            print(f"Backup created: {backup_path}")
        
        available_backups = pipeline.list_available_backups()
        print(f"Available backups: {len(available_backups)}")
        
        print("\n✅ Ultra Production RTO Prediction Pipeline is ready!")
        print("\nUltra-Modular Production Features:")
        print("- Maximum separation of concerns")
        print("- Comprehensive error handling and validation")
        print("- Advanced performance monitoring and metrics")
        print("- Circuit breaker for fault tolerance")
        print("- Timeout protection with decorators")
        print("- Retry mechanisms with exponential backoff")
        print("- Health checks and system monitoring")
        print("- Batch processing for large files")
        print("- Model versioning and snapshots")
        print("- Configuration management with dataclasses")
        print("- Enhanced logging with specialized loggers")
        print("- Backup and recovery management")
        print("- Transaction management with rollback")
        print("- Complete backward compatibility")
        print("- Pluggable component architecture")
        
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        print(f"❌ Pipeline failed: {e}")


if __name__ == "__main__":
    # Setup logging first
    from pipeline.enhanced_logging_service import EnhancedLoggingService
    logging_service = EnhancedLoggingService()
    logger = logging_service.setup_production_logging('logs')

    main()