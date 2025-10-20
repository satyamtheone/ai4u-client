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

# Config
from config.config import PreprocessingConfig, ModelConfig, PipelineConfig

# Custom exceptions
from core.exceptions import DataValidationError, DataQualityError,\
    ModelNotFoundError, ProcessingTimeoutError

warnings.filterwarnings('ignore')




# Enhanced RTOPredictor with production features
class ProductionRTOPredictor:
    """
    Production-ready RTO (Return to Origin) Prediction Pipeline
    
    Enhanced with monitoring, error handling, validation, and fault tolerance
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
        
        # Model components
        self.model = None
        self.label_encoders = {}
        self.scaler = None
        self.tfidf_vectorizer = None
        self.feature_columns = None
        self.historical_data = None
        
        # Performance tracking
        self.performance_metrics = {}
        self.courier_performance = defaultdict(dict)
        self.pincode_stats = defaultdict(dict)
        
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
        """Comprehensive input data validation"""
        logger.info("Validating input data...")
        
        # Check if dataframe is empty
        if df.empty:
            raise DataValidationError("Input dataframe is empty")
        
        # Check required columns
        missing_cols = [col for col in self.preprocessing_config.required_columns 
                       if col not in df.columns]
        if missing_cols:
            raise DataValidationError(f"Missing required columns: {missing_cols}")
        
        # Check data types and ranges
        if 'CUSTOMER_PHONE' in df.columns:
            # Check if phone numbers are reasonable
            phone_lengths = df['CUSTOMER_PHONE'].astype(str).str.len()
            if phone_lengths.min() < 5 or phone_lengths.max() > 15:
                logger.warning("Some phone numbers have unusual lengths")
        
        if 'INVOICE_VALUE' in df.columns:
            if df['INVOICE_VALUE'].min() < 0:
                raise DataValidationError("INVOICE_VALUE cannot be negative")
            if df['INVOICE_VALUE'].max() > 1000000:  # 10 lakh
                logger.warning("Some orders have very high invoice values")
        
        # Check for excessive missing values
        missing_percentages = (df.isnull().sum() / len(df)) * 100
        critical_missing = missing_percentages[missing_percentages > 50]
        if not critical_missing.empty:
            logger.warning(f"Columns with >50% missing values: {critical_missing.to_dict()}")
        
        logger.info("Input data validation completed")
    
    def _data_quality_checks(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive data quality assessment"""
        quality_report = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'duplicate_rows': df.duplicated().sum(),
            'missing_value_percentage': (df.isnull().sum() / len(df) * 100).to_dict(),
            'data_types_correct': True,
            'outlier_count': 0,
            'quality_score': 0.0,
            'timestamp': datetime.now().isoformat()
        }
        
        # Check for critical quality issues
        if quality_report['duplicate_rows'] > len(df) * 0.1:  # >10% duplicates
            raise DataQualityError(f"Too many duplicate rows: {quality_report['duplicate_rows']}")
        
        # Calculate quality score
        missing_penalty = sum([pct for pct in quality_report['missing_value_percentage'].values() if pct > 10])
        duplicate_penalty = (quality_report['duplicate_rows'] / len(df)) * 50
        
        quality_report['quality_score'] = max(0, 100 - missing_penalty - duplicate_penalty)
        
        return quality_report
    
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
                
                # Original preprocessing steps (maintaining backward compatibility)
                df = df.copy()
                
                # Enhanced processing with error handling
                processing_steps = [
                    ('handle_missing_values', self._handle_missing_values),
                    ('create_temporal_features', self._create_temporal_features),
                    ('create_geographic_features', self._create_geographic_features),
                    ('create_features', self._create_features),
                    ('create_attempt_features', self._create_attempt_features),
                    ('create_customer_features', self._create_customer_features),
                    ('clean_text_fields', self._clean_text_fields),
                    ('process_phone_numbers', self._process_phone_numbers),
                    ('process_addresses', self._process_addresses),
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
                    df['RTO_TARGET'] = df['CURRENT_STATUS'].apply(self._create_target)
                
                # Encode categorical variables
                df = self._encode_categorical(df, is_training)
                
                # Handle outliers
                df = self._handle_outliers(df)
                
                # Feature scaling if scaler exists
                if hasattr(self, 'scaler') and self.scaler is not None:
                    df = self._scale_features(df)
                
                logger.info("Data preprocessing completed successfully")
                return df
                
            except Exception as e:
                self.health_status['error_count'] += 1
                logger.error(f"Preprocessing failed: {e}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced missing value handling with fallbacks"""
        logger.debug("Handling missing values...")
        
        # Critical columns - use specific strategies
        critical_cols = ['CUSTOMER_PHONE', 'CUSTOMER_ADDRESS', 'PAYMENT_MODE']
        
        for col in critical_cols:
            if col in df.columns:
                # Flag missing values as features
                df[f'{col}_MISSING'] = df[col].isna().astype(int)
                
                # Use fallback values from config
                fallback_value = self.preprocessing_config.fallback_values.get(col, 'Unknown')
                df[col] = df[col].fillna(fallback_value)
        
        # Fill missing numerical values with median
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            if col in df.columns:
                median_val = df[col].median()
                if pd.isna(median_val):
                    median_val = 0  # Fallback if all values are missing
                df[col] = df[col].fillna(median_val)
        
        # Fill missing categorical values with mode or 'Unknown'
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if col in df.columns:
                mode_val = df[col].mode()
                fill_value = mode_val[0] if not mode_val.empty else 'Unknown'
                df[col] = df[col].fillna(fill_value)
        
        return df
    
    def _create_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create time-based features"""
        logger.debug("Creating temporal features...")
        
        try:
            if 'ORDER_CREATION_DATE' in df.columns:
                df['ORDER_CREATION_DATE'] = pd.to_datetime(df['ORDER_CREATION_DATE'], errors='coerce')
                df['ORDER_DAY_OF_WEEK'] = df['ORDER_CREATION_DATE'].dt.dayofweek
                df['IS_WEEKEND_ORDER'] = df['ORDER_DAY_OF_WEEK'].isin([5, 6]).astype(int)
                df['ORDER_MONTH'] = df['ORDER_CREATION_DATE'].dt.month
                df['ORDER_HOUR'] = df['ORDER_CREATION_DATE'].dt.hour
            
            if 'DELIVERY_DATE' in df.columns:
                df['DELIVERY_DATE'] = pd.to_datetime(df['DELIVERY_DATE'], errors='coerce')
                df['DELIVERY_DAY_OF_WEEK'] = df['DELIVERY_DATE'].dt.dayofweek
            
            # Time gaps
            if 'ORDER_CREATION_DATE' in df.columns and 'PICKUP_DATE' in df.columns:
                df['PICKUP_DATE'] = pd.to_datetime(df['PICKUP_DATE'], errors='coerce')
                df['ORDER_TO_PICKUP_DAYS'] = (df['PICKUP_DATE'] - df['ORDER_CREATION_DATE']).dt.days
                df['ORDER_TO_PICKUP_DAYS'] = df['ORDER_TO_PICKUP_DAYS'].fillna(0)
        
        except Exception as e:
            logger.warning(f"Error creating temporal features: {e}")
        
        return df
    
    def _create_geographic_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create location-based risk features"""
        logger.debug("Creating geographic features...")
        
        try:
            # Zone-based features
            if 'ZONE' in df.columns:
                metro_zones = ['Metro', 'A', 'Within City']
                df['IS_METRO_ZONE'] = df['ZONE'].isin(metro_zones).astype(int)
            
            # Historical RTO rates by location (if available)
            if hasattr(self, 'pincode_stats') and self.pincode_stats:
                if 'PINCODE' in df.columns:
                    df['PINCODE_RTO_RATE'] = df['PINCODE'].map(
                        {k: v.get('rto_rate', 0.2) for k, v in self.pincode_stats.items()}
                    ).fillna(0.2)  # Default rate
            
        except Exception as e:
            logger.warning(f"Error creating geographic features: {e}")
        
        return df
    
    def _create_attempt_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create features from delivery attempt patterns"""
        logger.debug("Creating attempt features...")
        
        try:
            if 'ATTEMPT_COUNT' in df.columns:
                df['ATTEMPT_COUNT'] = df['ATTEMPT_COUNT'].fillna(0)
                df['HIGH_ATTEMPT_COUNT'] = (df['ATTEMPT_COUNT'] > 2).astype(int)
            
            if 'FIRST_ATTEMPT_DATE' in df.columns and 'PICKUP_DATE' in df.columns:
                df['FIRST_ATTEMPT_DATE'] = pd.to_datetime(df['FIRST_ATTEMPT_DATE'], errors='coerce')
                df['PICKUP_DATE'] = pd.to_datetime(df['PICKUP_DATE'], errors='coerce')
                df['FIRST_ATTEMPT_DELAY'] = (df['FIRST_ATTEMPT_DATE'] - df['PICKUP_DATE']).dt.days
                df['FIRST_ATTEMPT_DELAY'] = df['FIRST_ATTEMPT_DELAY'].fillna(0)
        
        except Exception as e:
            logger.warning(f"Error creating attempt features: {e}")
        
        return df
    
    def _create_customer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create customer-specific features"""
        logger.debug("Creating customer features...")
        
        try:
            if 'CUSTOMER_NAME' in df.columns:
                df['CUSTOMER_NAME_LENGTH'] = df['CUSTOMER_NAME'].astype(str).str.len()
                df['CUSTOMER_NAME_HAS_TITLE'] = df['CUSTOMER_NAME'].astype(str).str.contains(
                    'Mr|Ms|Dr|Mrs', case=False, na=False
                ).astype(int)
        
        except Exception as e:
            logger.warning(f"Error creating customer features: {e}")
        
        return df
    
    # Keep all original methods for backward compatibility
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features for better prediction"""
        
        # Date features
        if 'ORDER_CREATION_DATE' in df.columns:
            try:
                df['ORDER_CREATION_DATE'] = pd.to_datetime(df['ORDER_CREATION_DATE'], errors='coerce')
                df['ORDER_HOUR'] = df['ORDER_CREATION_DATE'].dt.hour
                df['ORDER_DAY_OF_WEEK'] = df['ORDER_CREATION_DATE'].dt.dayofweek
                df['ORDER_MONTH'] = df['ORDER_CREATION_DATE'].dt.month
            except Exception as e:
                logger.warning(f"Error processing ORDER_CREATION_DATE: {e}")
        
        # Weight per quantity ratio
        if 'WEIGHT' in df.columns and 'QTY' in df.columns:
            df['WEIGHT_PER_ITEM'] = df['WEIGHT'] / df['QTY'].replace(0, 1)
        
        # Value per item
        if 'INVOICE_VALUE' in df.columns and 'QTY' in df.columns:
            df['VALUE_PER_ITEM'] = df['INVOICE_VALUE'] / df['QTY'].replace(0, 1)
        
        # High value order flag
        if 'INVOICE_VALUE' in df.columns:
            df['HIGH_VALUE_ORDER'] = (df['INVOICE_VALUE'] > df['INVOICE_VALUE'].quantile(0.75)).astype(int)
        
        # COD flag
        if 'PAYMENT_MODE' in df.columns:
            df['IS_COD'] = (df['PAYMENT_MODE'] == 'COD').astype(int)
        
        # Zone risk factor
        zone_risk = {'Within City': 1, 'Within Zone': 2, 'Rest Of India': 3, 'Special Zone': 4}
        if 'ZONE' in df.columns:
            df['ZONE_RISK'] = df['ZONE'].map(zone_risk).fillna(3)
        
        return df
    
    def _clean_text_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize text fields"""
        
        text_columns = ['CUSTOMER_NAME', 'CUSTOMER_ADDRESS', 'ITEM_DESCRIPTION']
        
        for col in text_columns:
            if col in df.columns:
                try:
                    # Convert to string and clean
                    df[col] = df[col].astype(str)
                    df[col] = df[col].str.lower()
                    df[col] = df[col].str.replace(r'[^\w\s]', ' ', regex=True)
                    df[col] = df[col].str.replace(r'\s+', ' ', regex=True)
                    df[col] = df[col].str.strip()
                except Exception as e:
                    logger.warning(f"Error cleaning text field {col}: {e}")
        
        return df
    
    def _process_phone_numbers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from phone numbers"""
        
        if 'CUSTOMER_PHONE' in df.columns:
            try:
                df['CUSTOMER_PHONE'] = df['CUSTOMER_PHONE'].astype(str)
                
                # Extract phone features
                df['PHONE_LENGTH'] = df['CUSTOMER_PHONE'].str.len()
                df['PHONE_STARTS_WITH'] = df['CUSTOMER_PHONE'].str[:2]
                
                # Check for valid phone patterns
                df['PHONE_VALID'] = df['CUSTOMER_PHONE'].str.match(r'^\d{10}$').astype(int)
                
                # Create phone hash for privacy (first 3 and last 2 digits)
                df['PHONE_PATTERN'] = df['CUSTOMER_PHONE'].str[:3] + 'XXX' + df['CUSTOMER_PHONE'].str[-2:]
            except Exception as e:
                logger.warning(f"Error processing phone numbers: {e}")
        
        return df
    
    def _process_addresses(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from addresses"""
        
        if 'CUSTOMER_ADDRESS' in df.columns:
            try:
                # Address length
                df['ADDRESS_LENGTH'] = df['CUSTOMER_ADDRESS'].str.len()
                
                # Count of address components
                df['ADDRESS_WORD_COUNT'] = df['CUSTOMER_ADDRESS'].str.split().str.len()
                
                # Check for specific keywords that might indicate delivery difficulty
                risky_keywords = ['village', 'remote', 'interior', 'hills', 'tribal']
                df['ADDRESS_RISK_KEYWORDS'] = df['CUSTOMER_ADDRESS'].str.contains(
                    '|'.join(risky_keywords), case=False, na=False
                ).astype(int)
                
                # Address completeness features
                df['ADDRESS_COMPLETENESS'] = df['ADDRESS_LENGTH'] / 100
                df['ADDRESS_HAS_LANDMARK'] = df['CUSTOMER_ADDRESS'].str.contains(
                    'near|opp|beside', case=False, na=False
                ).astype(int)
                df['ADDRESS_HAS_FLAT_NO'] = df['CUSTOMER_ADDRESS'].str.contains(
                    r'\d+', na=False
                ).astype(int)
            except Exception as e:
                logger.warning(f"Error processing addresses: {e}")
        
        return df
    
    def _create_target(self, status: str) -> int:
        """Create binary target variable from status"""
        if pd.isna(status):
            return 0
        
        status = str(status).upper()
        # RTO cases
        if any(rto_keyword in status for rto_keyword in ['RTO', 'RETURN', 'UNDELIVERABLE', 'UNDELIVERED', 'RTO-INTRANSIT', 'RTO-DELIVERED', 'RTO-OFD']):
            return 1
        
        # Delivered cases
        if 'O-DELIVERED' in status and 'RTO' not in status:
            return 0
        
        # Default to non-RTO for ambiguous cases
        return 0
    
    def _encode_categorical(self, df: pd.DataFrame, is_training: bool) -> pd.DataFrame:
        """Enhanced categorical encoding with error handling"""
        
        categorical_columns = [
            'CLIENT_NAME', 'COURIER_NAME', 'CUSTOMER_CITY', 
            'CUSTOMER_STATE', 'PAYMENT_MODE', 'ZONE'
        ]
        
        for col in categorical_columns:
            if col in df.columns:
                try:
                    if is_training:
                        # Fit new encoder for training
                        self.label_encoders[col] = LabelEncoder()
                        df[f'{col}_ENCODED'] = self.label_encoders[col].fit_transform(df[col].astype(str))
                    else:
                        # Use existing encoder for prediction
                        if col in self.label_encoders:
                            # Handle unseen categories gracefully
                            known_categories = set(self.label_encoders[col].classes_)
                            df[col] = df[col].astype(str)
                            
                            # Map unseen categories to 'Unknown'
                            df[col] = df[col].apply(lambda x: x if x in known_categories else 'Unknown')
                            
                            # Add 'Unknown' to encoder if not present
                            if 'Unknown' not in known_categories:
                                self.label_encoders[col].classes_ = np.append(
                                    self.label_encoders[col].classes_, 'Unknown'
                                )
                            
                            df[f'{col}_ENCODED'] = self.label_encoders[col].transform(df[col])
                        else:
                            # Default encoding for missing encoder
                            logger.warning(f"No encoder found for {col}, using default value")
                            df[f'{col}_ENCODED'] = 0
                            
                except Exception as e:
                    logger.error(f"Error encoding column {col}: {e}")
                    # Fallback to simple encoding
                    df[f'{col}_ENCODED'] = 0
        
        return df
    
    def _handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle outliers in numerical columns"""
        logger.debug("Handling outliers...")
        
        numerical_columns = ['WEIGHT', 'INVOICE_VALUE', 'QTY', 'COLLECTABLE_AMOUNT']
        
        for col in numerical_columns:
            if col in df.columns:
                try:
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    
                    # Define outlier bounds
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    # Cap outliers instead of removing them
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                    
                except Exception as e:
                    logger.warning(f"Error handling outliers for {col}: {e}")
        
        return df
    
    def _scale_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numerical features if scaler exists"""
        if self.scaler is None:
            return df
        
        try:
            numerical_features = df.select_dtypes(include=[np.number]).columns
            if len(numerical_features) > 0:
                df[numerical_features] = self.scaler.transform(df[numerical_features])
        except Exception as e:
            logger.warning(f"Error scaling features: {e}")
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare feature matrix for ML model with enhanced error handling"""
        
        # Select relevant features based on importance
        feature_cols = [
            'CLIENT_NAME_ENCODED', 'COURIER_NAME_ENCODED', 'CUSTOMER_CITY_ENCODED',
            'CUSTOMER_STATE_ENCODED', 'PAYMENT_MODE_ENCODED', 'ZONE_ENCODED',
            'WEIGHT', 'QTY', 'INVOICE_VALUE', 'ZONE_RISK', 'IS_COD',
            'HIGH_VALUE_ORDER', 'WEIGHT_PER_ITEM', 'VALUE_PER_ITEM',
            'PHONE_LENGTH', 'PHONE_VALID', 'ADDRESS_LENGTH', 'ADDRESS_WORD_COUNT',
            'ADDRESS_RISK_KEYWORDS', 'ORDER_HOUR', 'ORDER_DAY_OF_WEEK', 'ORDER_MONTH'
        ]
        
        # Select only available columns
        available_cols = [col for col in feature_cols if col in df.columns]
        
        if not available_cols:
            raise ValueError("No valid feature columns found in the data")
        
        self.feature_columns = available_cols
        X = df[available_cols].copy()
        
        # Handle any remaining missing values
        X = X.fillna(0)
        
        # Validate feature matrix
        if X.isnull().any().any():
            logger.warning("Feature matrix still contains null values after preprocessing")
            X = X.fillna(0)
        
        return X.values
    
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
        
        logger.info(f"Training data shape: {X.shape}, Target distribution: {np.bincount(y)}")
        
        # Validate minimum training samples
        if len(X) < self.model_config.min_training_samples:
            raise ValueError(f"Insufficient training data: {len(X)} < {self.model_config.min_training_samples}")
        
        # Split data with stratification
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train multiple models and select the best
        models = {
            'RandomForest': RandomForestClassifier(
                n_estimators=100, max_depth=15, random_state=42, 
                class_weight='balanced', n_jobs=-1
            ),
            'GradientBoosting': GradientBoostingClassifier(
                n_estimators=100, max_depth=6, random_state=42
            ),
            'LogisticRegression': LogisticRegression(
                random_state=42, class_weight='balanced', max_iter=1000
            )
        }
        
        best_model = None
        best_score = 0
        model_results = {}
        
        for name, model in models.items():
            logger.info(f"Training {name}...")
            
            try:
                # Cross-validation
                cv_scores = cross_val_score(
                    model, X_train_scaled, y_train, 
                    cv=self.model_config.cross_validation_folds, 
                    scoring='roc_auc'
                )
                
                # Train on full training set
                model.fit(X_train_scaled, y_train)
                
                # Test predictions
                y_pred = model.predict(X_test_scaled)
                y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
                
                # Calculate metrics
                auc_score = roc_auc_score(y_test, y_pred_proba)
                
                model_results[name] = {
                    'cv_mean': cv_scores.mean(),
                    'cv_std': cv_scores.std(),
                    'test_auc': auc_score,
                    'classification_report': classification_report(y_test, y_pred, output_dict=True)
                }
                
                logger.info(f"{name} - CV AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}, Test AUC: {auc_score:.4f}")
                
                if auc_score > best_score:
                    best_score = auc_score
                    best_model = model
                    
            except Exception as e:
                logger.error(f"Error training {name}: {e}")
                model_results[name] = {'error': str(e)}
        
        if best_model is None:
            raise RuntimeError("No model was successfully trained")
        
        self.model = best_model
        self.last_training_score = best_score
        
        # Store historical data for similarity matching
        self.historical_data = df_processed.copy()
        
        # Calculate performance metrics
        self._calculate_performance_metrics(df_processed)
        
        # Update health status
        self.health_status['model_loaded'] = True
        self.health_status['last_training'] = datetime.now().isoformat()
        
        # Save model snapshot
        self._save_model_snapshot()
        
        logger.info("Model training completed successfully")
        
        return {
            'best_model': type(best_model).__name__,
            'best_score': best_score,
            'model_results': model_results,
            'feature_importance': self._get_feature_importance(),
            'training_timestamp': datetime.now().isoformat(),
            'data_quality_score': getattr(self, '_last_quality_score', None)
        }
    
    @timeout_handler(180)  # 3 minute timeout for predictions
    @monitor_performance
    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Enhanced prediction with comprehensive error handling"""
        if self.model is None:
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
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        
        # Generate explanations and recommendations
        results = []
        for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
            try:
                order_data = df_processed.iloc[i]
                
                result = {
                    'order_index': i,
                    'order_number': str(order_data.get('ORDER_NUMBER', f'ORDER_{i}')),
                    'order_current_status': str(order_data.get('CURRENT_STATUS', 'Unknown')),
                    'payment_mode': str(order_data.get('PAYMENT_MODE', 'Unknown')),
                    'cod_value': float(order_data.get('COLLECTABLE_AMOUNT', 0)),
                    'order_created_at': str(order_data.get('ORDER_CREATION_DATE', 'Unknown')),
                    'rto_prediction': bool(pred),
                    'rto_probability': float(prob),
                    'risk_level': self._get_risk_level(prob),
                    'explanation': self._generate_explanation(order_data, prob),
                    'recommendations': self._generate_recommendations(order_data, prob),
                    'similar_orders': self._find_similar_orders(order_data),
                    'prediction_timestamp': datetime.now().isoformat()
                }
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error processing order {i}: {e}")
                # Add minimal result for failed orders
                results.append({
                    'order_index': i,
                    'error': str(e),
                    'rto_prediction': False,
                    'rto_probability': 0.5,
                    'risk_level': 'Medium'
                })
        
        # Update health status
        self.health_status['last_prediction'] = datetime.now().isoformat()
        
        logger.info("Predictions completed successfully")
        
        return {
            'predictions': results,
            'summary': self._generate_summary(df_processed, predictions, probabilities),
            'prediction_timestamp': datetime.now().isoformat(),
            'model_version': getattr(self, 'model_version', 'unknown')
        }
    
    def _create_backup(self):
        """Create backup of current model before training"""
        if self.model is not None:
            try:
                backup_dir = Path(self.pipeline_config.backup_dir) / datetime.now().strftime('%Y_%m_%d_%H')
                backup_dir.mkdir(exist_ok=True)
                
                joblib.dump(self.model, backup_dir / "model_backup.pkl")
                joblib.dump(self.label_encoders, backup_dir / "encoders_backup.pkl")
                joblib.dump(self.scaler, backup_dir / "scaler_backup.pkl")
                
                logger.info(f"Model backup created at: {backup_dir}")
                
            except Exception as e:
                logger.warning(f"Failed to create backup: {e}")
    
    
    # Keep all other methods from original implementation for backward compatibility
    
    def _save_model_snapshot(self):
        """Save model snapshot with timestamp and versioning"""
        
        timestamp = datetime.now().strftime("%Y_%m_%d_%H")
        snapshot_dir = Path(self.pipeline_config.model_dir) / timestamp
        snapshot_dir.mkdir(exist_ok=True)
        
        try:
            # Save model and preprocessors
            joblib.dump(self.model, snapshot_dir / "model.pkl")
            joblib.dump(self.label_encoders, snapshot_dir / "label_encoders.pkl")
            joblib.dump(self.scaler, snapshot_dir / "scaler.pkl")
            joblib.dump(self.feature_columns, snapshot_dir / "feature_columns.pkl")
            
            # Save configuration
            config_data = {
                'preprocessing_config': {
                    'max_processing_time': self.preprocessing_config.max_processing_time,
                    'batch_size': self.preprocessing_config.batch_size,
                    'required_columns': self.preprocessing_config.required_columns
                },
                'model_config': {
                    'retrain_threshold': self.model_config.retrain_threshold,
                    'min_training_samples': self.model_config.min_training_samples
                },
                'model_version': timestamp
            }
            
            with open(snapshot_dir / "config.json", 'w') as f:
                json.dump(config_data, f, indent=2)
            
            # Save performance metrics
            with open(snapshot_dir / "performance_metrics.json", 'w') as f:
                json.dump({
                    'courier_performance': dict(self.courier_performance),
                    'pincode_stats': dict(self.pincode_stats),
                    'feature_importance': self._get_feature_importance(),
                    'health_status': self.health_status,
                    'timestamp': datetime.now().isoformat()
                }, f, indent=2)
            
            # Create symlink to latest
            latest_link = Path(self.pipeline_config.model_dir) / "latest"
            if latest_link.exists():
                latest_link.unlink()
            latest_link.symlink_to(snapshot_dir)
            
            # Store model version
            self.model_version = timestamp
            
            logger.info(f"Model snapshot saved to {snapshot_dir}")
            
            # Cleanup old snapshots
            self._cleanup_old_snapshots()
            
        except Exception as e:
            logger.error(f"Error saving model snapshot: {e}")
    
    def _cleanup_old_snapshots(self):
        """Clean up old model snapshots based on retention policy"""
        try:
            model_dir = Path(self.pipeline_config.model_dir)
            snapshots = [d for d in model_dir.iterdir() if d.is_dir() and d.name != 'latest']
            
            # Sort by creation time
            snapshots.sort(key=lambda x: x.stat().st_ctime, reverse=True)
            
            # Keep only recent snapshots based on retention policy
            retention_days = self.model_config.model_snapshot_retention_days
            cutoff_time = time.time() - (retention_days * 24 * 60 * 60)
            
            for snapshot in snapshots:
                if snapshot.stat().st_ctime < cutoff_time:
                    import shutil
                    shutil.rmtree(snapshot)
                    logger.info(f"Cleaned up old snapshot: {snapshot}")
                    
        except Exception as e:
            logger.warning(f"Error cleaning up old snapshots: {e}")
    
    def load_model_snapshot(self, date: str = None):
        """Load model snapshot from specific date or latest"""
        
        model_dir = Path(self.pipeline_config.model_dir)
        
        if date is None:
            # Use latest symlink if available
            latest_link = model_dir / "latest"
            if latest_link.exists():
                snapshot_dir = latest_link.resolve()
            else:
                # Find latest snapshot
                snapshots = [d for d in model_dir.iterdir() if d.is_dir() and d.name != 'latest']
                if not snapshots:
                    raise ModelNotFoundError("No model snapshots found")
                snapshot_dir = max(snapshots, key=lambda x: x.name)
        else:
            snapshot_dir = model_dir / date
            if not snapshot_dir.exists():
                raise ModelNotFoundError(f"No snapshot found for date {date}")
        
        try:
            # Load model and preprocessors
            self.model = joblib.load(snapshot_dir / "model.pkl")
            self.label_encoders = joblib.load(snapshot_dir / "label_encoders.pkl")
            self.scaler = joblib.load(snapshot_dir / "scaler.pkl")
            self.feature_columns = joblib.load(snapshot_dir / "feature_columns.pkl")
            
            # Load configuration if available
            config_file = snapshot_dir / "config.json"
            if config_file.exists():
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
                    self.model_version = config_data.get('model_version', 'unknown')
            
            # Load performance metrics
            metrics_file = snapshot_dir / "performance_metrics.json"
            if metrics_file.exists():
                with open(metrics_file, 'r') as f:
                    metrics = json.load(f)
                    self.courier_performance = defaultdict(dict, metrics.get('courier_performance', {}))
                    self.pincode_stats = defaultdict(dict, metrics.get('pincode_stats', {}))
            
            # Update health status
            self.health_status['model_loaded'] = True
            
            logger.info(f"Model snapshot loaded from {snapshot_dir}")
            
        except Exception as e:
            logger.error(f"Error loading model snapshot: {e}")
            raise ModelNotFoundError(f"Failed to load model: {e}")
    
    def retrain_with_new_data(self, new_data: pd.DataFrame, retrain_threshold: float = None) -> Optional[Dict[str, Any]]:
        """
        Retrain model with new data if performance degradation is detected
        
        Args:
            new_data: New training data
            retrain_threshold: Minimum performance degradation to trigger retraining
        """
        if retrain_threshold is None:
            retrain_threshold = self.model_config.retrain_threshold
            
        logger.info("Checking if retraining is needed...")
        
        if self.model is None:
            logger.info("No existing model found. Training from scratch...")
            return self.train_model(new_data)
        
        try:
            # Evaluate current model on new data (if it has labels)
            if 'CURRENT_STATUS' in new_data.columns:
                new_data_processed = self.preprocess_data(new_data, is_training=True)
                X_new = self.prepare_features(new_data_processed)
                y_new = new_data_processed['RTO_TARGET'].values
                
                if len(X_new) > 0:
                    X_new_scaled = self.scaler.transform(X_new)
                    current_score = roc_auc_score(y_new, self.model.predict_proba(X_new_scaled)[:, 1])
                    
                    # If performance degradation exceeds threshold, retrain
                    baseline_score = getattr(self, 'last_training_score', 0.8)
                    performance_drop = baseline_score - current_score
                    
                    logger.info(f"Performance check: baseline={baseline_score:.4f}, current={current_score:.4f}, drop={performance_drop:.4f}")
                    
                    if performance_drop > retrain_threshold:
                        logger.info(f"Performance degraded beyond threshold ({retrain_threshold}). Retraining...")
                        
                        # Combine with historical data if available
                        if self.historical_data is not None:
                            combined_data = pd.concat([self.historical_data, new_data], ignore_index=True)
                        else:
                            combined_data = new_data
                        
                        return self.train_model(combined_data)
                    else:
                        logger.info(f"Performance acceptable. No retraining needed.")
                        return None
            
            # If no performance evaluation possible, just add to historical data
            logger.info("Adding new data to historical dataset...")
            if self.historical_data is not None:
                self.historical_data = pd.concat([self.historical_data, new_data], ignore_index=True)
            else:
                self.historical_data = new_data.copy()
            
            return None
            
        except Exception as e:
            logger.error(f"Error in retrain evaluation: {e}")
            return None
    
    # Keep all reporting methods for backward compatibility
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
                    actual_rto = self.predictor._create_target(actual_status)
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
            y_true = [self.predictor._create_target(status) for status in merged['CURRENT_STATUS']]
            
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
                    'feature_importance': self.predictor._get_feature_importance(),
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
        training_results = pipeline.train_initial_model(r'data/to_train/training_data_2025_05_23.csv')
        print(f"Training completed: {training_results['best_model']}")
        
        # Example: Process new orders
        print("Processing new orders...")
        prediction_results = pipeline.process_new_orders('data/to_predict/predict_2025_06_03.csv',
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