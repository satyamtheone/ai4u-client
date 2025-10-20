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

# ML Libraries - Enhanced with additional models
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler, RobustScaler
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_curve
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.calibration import CalibratedClassifierCV
from sklearn.utils.class_weight import compute_class_weight
import matplotlib.pyplot as plt

# Advanced ML Libraries
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    
try:
    from lightgbm import LGBMClassifier
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False

# Data processing
from scipy.spatial.distance import cosine
from scipy.stats import ks_2samp
import re
from collections import defaultdict, Counter

warnings.filterwarnings('ignore')

# OPTIMIZATION 1: Enhanced Configuration with Cost-Sensitive Learning
@dataclass
class OptimizedPreprocessingConfig:
    max_processing_time: int = 300
    batch_size: int = 10000
    memory_limit_mb: int = 2048
    required_columns: List[str] = field(default_factory=lambda: [
        'ORDER_NUMBER', 'CURRENT_STATUS', 'CUSTOMER_PHONE', 
        'CUSTOMER_ADDRESS', 'PAYMENT_MODE'
    ])
    fallback_values: Dict[str, Any] = field(default_factory=dict)
    max_retries: int = 3
    enable_monitoring: bool = True
    # NEW: Enhanced feature engineering flags
    enable_advanced_features: bool = True
    enable_customer_history: bool = True
    enable_temporal_patterns: bool = True
    enable_address_parsing: bool = True

@dataclass
class OptimizedModelConfig:
    retrain_threshold: float = 0.05  # More sensitive retraining
    min_training_samples: int = 100
    model_snapshot_retention_days: int = 30
    enable_auto_retrain: bool = True
    cross_validation_folds: int = 5
    # NEW: Cost-sensitive learning
    false_positive_cost: float = 50.0
    false_negative_cost: float = 200.0
    true_positive_cost: float = 10.0
    optimize_for_cost: bool = True
    # NEW: Ensemble and calibration
    enable_ensemble: bool = True
    enable_calibration: bool = True
    # NEW: Feature selection
    enable_feature_selection: bool = True
    max_features: int = 50

# OPTIMIZATION 2: Advanced Feature Engineering
class AdvancedFeatureEngineer:
    """Enhanced feature engineering for better RTO prediction"""
    
    def __init__(self):
        self.customer_history = defaultdict(dict)
        self.phone_patterns = defaultdict(int)
        self.address_patterns = defaultdict(int)
        self.pincode_risk_scores = defaultdict(float)
        
    def create_customer_history_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create features based on customer historical behavior"""
        if 'CUSTOMER_PHONE' not in df.columns:
            return df
            
        try:
            # Customer order frequency
            phone_counts = df['CUSTOMER_PHONE'].value_counts()
            df['CUSTOMER_ORDER_FREQUENCY'] = df['CUSTOMER_PHONE'].map(phone_counts).fillna(1)
            df['IS_REPEAT_CUSTOMER'] = (df['CUSTOMER_ORDER_FREQUENCY'] > 1).astype(int)
            
            # Customer value patterns
            if 'INVOICE_VALUE' in df.columns:
                customer_avg_value = df.groupby('CUSTOMER_PHONE')['INVOICE_VALUE'].mean()
                df['CUSTOMER_AVG_ORDER_VALUE'] = df['CUSTOMER_PHONE'].map(customer_avg_value)
                df['ORDER_VALUE_DEVIATION'] = abs(df['INVOICE_VALUE'] - df['CUSTOMER_AVG_ORDER_VALUE'])
                df['IS_HIGH_VALUE_FOR_CUSTOMER'] = (
                    df['INVOICE_VALUE'] > df['CUSTOMER_AVG_ORDER_VALUE'] * 1.5
                ).astype(int)
            
            # Customer consistency features
            if 'CUSTOMER_ADDRESS' in df.columns:
                customer_addresses = df.groupby('CUSTOMER_PHONE')['CUSTOMER_ADDRESS'].nunique()
                df['CUSTOMER_ADDRESS_CONSISTENCY'] = df['CUSTOMER_PHONE'].map(customer_addresses)
                df['MULTIPLE_ADDRESSES'] = (df['CUSTOMER_ADDRESS_CONSISTENCY'] > 1).astype(int)
                
        except Exception as e:
            logging.warning(f"Error creating customer history features: {e}")
            
        return df
    
    def create_advanced_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create sophisticated time-based features"""
        if 'ORDER_CREATION_DATE' not in df.columns:
            return df
            
        try:
            df['ORDER_CREATION_DATE'] = pd.to_datetime(df['ORDER_CREATION_DATE'], errors='coerce')
            
            # Time-based patterns
            df['ORDER_HOUR'] = df['ORDER_CREATION_DATE'].dt.hour
            df['ORDER_DAY_OF_WEEK'] = df['ORDER_CREATION_DATE'].dt.dayofweek
            df['ORDER_MONTH'] = df['ORDER_CREATION_DATE'].dt.month
            df['ORDER_QUARTER'] = df['ORDER_CREATION_DATE'].dt.quarter
            
            # Business vs non-business hours
            df['IS_BUSINESS_HOURS'] = (
                (df['ORDER_HOUR'] >= 9) & (df['ORDER_HOUR'] <= 17) & 
                (df['ORDER_DAY_OF_WEEK'] < 5)
            ).astype(int)
            
            # Weekend and holiday patterns
            df['IS_WEEKEND'] = (df['ORDER_DAY_OF_WEEK'] >= 5).astype(int)
            df['IS_MONDAY'] = (df['ORDER_DAY_OF_WEEK'] == 0).astype(int)  # Monday effect
            df['IS_FRIDAY'] = (df['ORDER_DAY_OF_WEEK'] == 4).astype(int)  # Friday effect
            
            # Festival/seasonal patterns (Indian context)
            df['IS_FESTIVAL_SEASON'] = (
                (df['ORDER_MONTH'].isin([10, 11, 12])) |  # Diwali/Dussehra season
                (df['ORDER_MONTH'].isin([3, 4]))  # Holi/New Year season
            ).astype(int)
            
            # Time since last order (if customer history available)
            if 'CUSTOMER_PHONE' in df.columns:
                df_sorted = df.sort_values(['CUSTOMER_PHONE', 'ORDER_CREATION_DATE'])
                df_sorted['DAYS_SINCE_LAST_ORDER'] = df_sorted.groupby('CUSTOMER_PHONE')['ORDER_CREATION_DATE'].diff().dt.days
                df['DAYS_SINCE_LAST_ORDER'] = df_sorted['DAYS_SINCE_LAST_ORDER'].fillna(0)
                df['IS_QUICK_REORDER'] = (df['DAYS_SINCE_LAST_ORDER'] <= 7).astype(int)
                
        except Exception as e:
            logging.warning(f"Error creating temporal features: {e}")
            
        return df
    
    def create_advanced_address_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced address analysis with Indian context"""
        if 'CUSTOMER_ADDRESS' not in df.columns:
            return df
            
        try:
            df['CUSTOMER_ADDRESS'] = df['CUSTOMER_ADDRESS'].astype(str).str.lower()
            
            # Address structure analysis
            df['ADDRESS_WORD_COUNT'] = df['CUSTOMER_ADDRESS'].str.split().str.len()
            df['ADDRESS_CHAR_COUNT'] = df['CUSTOMER_ADDRESS'].str.len()
            df['ADDRESS_NUMBER_COUNT'] = df['CUSTOMER_ADDRESS'].str.count(r'\d+')
            
            # Indian address patterns
            indian_keywords = [
                'house', 'flat', 'plot', 'block', 'sector', 'phase', 'society',
                'colony', 'nagar', 'puram', 'gali', 'road', 'street', 'lane'
            ]
            df['HAS_INDIAN_ADDRESS_KEYWORDS'] = df['CUSTOMER_ADDRESS'].str.contains(
                '|'.join(indian_keywords), case=False, na=False
            ).astype(int)
            
            # Address completeness indicators
            completeness_keywords = ['near', 'opp', 'opposite', 'beside', 'landmark']
            df['HAS_LANDMARK'] = df['CUSTOMER_ADDRESS'].str.contains(
                '|'.join(completeness_keywords), case=False, na=False
            ).astype(int)
            
            # Delivery difficulty indicators
            difficult_keywords = [
                'village', 'remote', 'interior', 'hills', 'tribal', 'forest',
                'difficult', 'access', 'narrow', 'congested'
            ]
            df['ADDRESS_DIFFICULTY_KEYWORDS'] = df['CUSTOMER_ADDRESS'].str.contains(
                '|'.join(difficult_keywords), case=False, na=False
            ).astype(int)
            
            # Urban vs rural indicators
            urban_keywords = ['metro', 'city', 'municipal', 'corporation', 'urban']
            rural_keywords = ['village', 'gram', 'tehsil', 'rural', 'panchayat']
            
            df['URBAN_ADDRESS_KEYWORDS'] = df['CUSTOMER_ADDRESS'].str.contains(
                '|'.join(urban_keywords), case=False, na=False
            ).astype(int)
            df['RURAL_ADDRESS_KEYWORDS'] = df['CUSTOMER_ADDRESS'].str.contains(
                '|'.join(rural_keywords), case=False, na=False
            ).astype(int)
            
            # Address standardization score
            df['ADDRESS_STANDARDIZATION_SCORE'] = (
                df['HAS_INDIAN_ADDRESS_KEYWORDS'] +
                df['HAS_LANDMARK'] +
                df['URBAN_ADDRESS_KEYWORDS'] -
                df['ADDRESS_DIFFICULTY_KEYWORDS'] -
                df['RURAL_ADDRESS_KEYWORDS']
            ).clip(0, 5)
            
        except Exception as e:
            logging.warning(f"Error creating address features: {e}")
            
        return df
    
    def create_phone_intelligence_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Advanced phone number analysis"""
        if 'CUSTOMER_PHONE' not in df.columns:
            return df
            
        try:
            df['CUSTOMER_PHONE'] = df['CUSTOMER_PHONE'].astype(str)
            
            # Phone number patterns
            df['PHONE_LENGTH'] = df['CUSTOMER_PHONE'].str.len()
            df['PHONE_STARTS_WITH'] = df['CUSTOMER_PHONE'].str[:2]
            
            # Indian mobile number patterns
            indian_mobile_prefixes = ['91', '6', '7', '8', '9']
            df['IS_INDIAN_MOBILE'] = df['CUSTOMER_PHONE'].str[:1].isin(['6', '7', '8', '9']).astype(int)
            df['IS_PREMIUM_MOBILE'] = df['CUSTOMER_PHONE'].str[:1].isin(['9']).astype(int)
            
            # Phone number quality
            df['PHONE_HAS_REPEATED_DIGITS'] = df['CUSTOMER_PHONE'].apply(
                lambda x: len(set(x)) < len(x) * 0.7 if len(x) > 0 else False
            ).astype(int)
            
            df['PHONE_IS_SEQUENTIAL'] = df['CUSTOMER_PHONE'].apply(
                self._is_sequential_number
            ).astype(int)
            
            # Operator inference (basic)
            operator_prefixes = {
                'airtel': ['9818', '9811', '9810', '7011', '7088'],
                'jio': ['9999', '8999', '7999', '6999'],
                'vodafone': ['9820', '9821', '9822', '7066']
            }
            
            for operator, prefixes in operator_prefixes.items():
                df[f'IS_{operator.upper()}'] = df['CUSTOMER_PHONE'].str[:4].isin(prefixes).astype(int)
                
        except Exception as e:
            logging.warning(f"Error creating phone features: {e}")
            
        return df
    
    def _is_sequential_number(self, phone: str) -> bool:
        """Check if phone number has sequential digits"""
        try:
            if len(phone) < 4:
                return False
            
            # Check for ascending sequences
            for i in range(len(phone) - 3):
                if phone[i:i+4].isdigit():
                    nums = [int(d) for d in phone[i:i+4]]
                    if nums == list(range(nums[0], nums[0] + 4)):
                        return True
                        
            return False
        except:
            return False

# OPTIMIZATION 3: Cost-Sensitive Model Training
class CostSensitiveModelTrainer:
    """Enhanced model training with cost optimization"""
    
    def __init__(self, config: OptimizedModelConfig):
        self.config = config
        self.cost_matrix = self._create_cost_matrix()
        
    def _create_cost_matrix(self) -> np.ndarray:
        """Create cost matrix for cost-sensitive learning"""
        # Cost matrix: [TN, FP]
        #             [FN, TP]
        return np.array([
            [0, self.config.false_positive_cost],
            [self.config.false_negative_cost, self.config.true_positive_cost]
        ])
    
    def calculate_class_weights(self, y: np.ndarray) -> Dict[int, float]:
        """Calculate class weights based on cost ratio"""
        if not self.config.optimize_for_cost:
            return 'balanced'
            
        # Calculate weights based on cost ratio
        cost_ratio = self.config.false_negative_cost / self.config.false_positive_cost
        
        # Get class distribution
        class_counts = np.bincount(y)
        total_samples = len(y)
        
        # Calculate balanced weights adjusted for cost
        weight_0 = total_samples / (2 * class_counts[0])  # Non-RTO weight
        weight_1 = total_samples / (2 * class_counts[1]) * cost_ratio  # RTO weight (adjusted for cost)
        
        return {0: weight_0, 1: weight_1}
    
    def get_optimized_models(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Get optimized models with cost-sensitive configuration"""
        
        class_weights = self.calculate_class_weights(y)
        
        models = {
            'RandomForest': RandomForestClassifier(
                n_estimators=200,  # Increased from 100
                max_depth=20,      # Increased from 15
                min_samples_split=5,
                min_samples_leaf=2,
                max_features='sqrt',
                random_state=42,
                class_weight=class_weights,
                n_jobs=-1
            ),
            'GradientBoosting': GradientBoostingClassifier(
                n_estimators=150,  # Increased from 100
                max_depth=8,       # Increased from 6
                learning_rate=0.08, # Reduced for better generalization
                subsample=0.8,
                random_state=42
            ),
            'LogisticRegression': LogisticRegression(
                random_state=42,
                class_weight=class_weights,
                max_iter=2000,     # Increased for convergence
                solver='liblinear',
                penalty='l1',      # L1 for feature selection
                C=0.1              # Regularization
            )
        }
        
        # Add XGBoost if available
        if XGBOOST_AVAILABLE:
            # Calculate scale_pos_weight for XGBoost
            scale_pos_weight = (y == 0).sum() / (y == 1).sum()
            if self.config.optimize_for_cost:
                scale_pos_weight *= (self.config.false_negative_cost / self.config.false_positive_cost)
                
            models['XGBoost'] = XGBClassifier(
                n_estimators=150,
                max_depth=8,
                learning_rate=0.08,
                subsample=0.8,
                colsample_bytree=0.8,
                scale_pos_weight=scale_pos_weight,
                random_state=42,
                eval_metric='logloss'
            )
        
        # Add LightGBM if available
        if LIGHTGBM_AVAILABLE:
            models['LightGBM'] = LGBMClassifier(
                n_estimators=150,
                max_depth=8,
                learning_rate=0.08,
                subsample=0.8,
                colsample_bytree=0.8,
                class_weight=class_weights,
                random_state=42,
                verbose=-1
            )
        
        return models
    
    def optimize_threshold(self, model, X_val: np.ndarray, y_val: np.ndarray) -> float:
        """Find optimal threshold that minimizes total cost"""
        
        # Get prediction probabilities
        y_proba = model.predict_proba(X_val)[:, 1]
        
        # Try different thresholds
        thresholds = np.arange(0.1, 0.9, 0.01)
        best_threshold = 0.5
        min_cost = float('inf')
        
        for threshold in thresholds:
            y_pred = (y_proba >= threshold).astype(int)
            
            # Calculate confusion matrix
            tn, fp, fn, tp = confusion_matrix(y_val, y_pred).ravel()
            
            # Calculate total cost
            total_cost = (fp * self.config.false_positive_cost + 
                         fn * self.config.false_negative_cost +
                         tp * self.config.true_positive_cost)
            
            if total_cost < min_cost:
                min_cost = total_cost
                best_threshold = threshold
        
        return best_threshold

# OPTIMIZATION 4: Enhanced Model Selection and Ensemble
class OptimizedEnsembleTrainer:
    """Advanced ensemble training with cost optimization"""
    
    def __init__(self, config: OptimizedModelConfig):
        self.config = config
        self.cost_trainer = CostSensitiveModelTrainer(config)
        
    def train_ensemble(self, X_train: np.ndarray, y_train: np.ndarray, 
                      X_val: np.ndarray, y_val: np.ndarray) -> Tuple[Any, float, Dict]:
        """Train ensemble with cost optimization"""
        
        # Get individual models
        models = self.cost_trainer.get_optimized_models(X_train, y_train)
        
        # Train and evaluate individual models
        individual_results = {}
        trained_models = []
        model_weights = []
        
        for name, model in models.items():
            try:
                # Train model
                model.fit(X_train, y_train)
                
                # Evaluate on validation set
                y_val_proba = model.predict_proba(X_val)[:, 1]
                
                # Find optimal threshold
                optimal_threshold = self.cost_trainer.optimize_threshold(model, X_val, y_val)
                y_val_pred = (y_val_proba >= optimal_threshold).astype(int)
                
                # Calculate cost-based score
                tn, fp, fn, tp = confusion_matrix(y_val, y_val_pred).ravel()
                total_cost = (fp * self.config.false_positive_cost + 
                             fn * self.config.false_negative_cost +
                             tp * self.config.true_positive_cost)
                
                cost_score = 1 / (1 + total_cost / len(y_val))  # Normalized cost score
                auc_score = roc_auc_score(y_val, y_val_proba)
                
                # Combined score (cost weighted)
                combined_score = 0.7 * cost_score + 0.3 * auc_score
                
                individual_results[name] = {
                    'model': model,
                    'threshold': optimal_threshold,
                    'cost_score': cost_score,
                    'auc_score': auc_score,
                    'combined_score': combined_score,
                    'total_cost': total_cost,
                    'confusion_matrix': {'tn': tn, 'fp': fp, 'fn': fn, 'tp': tp}
                }
                
                trained_models.append((name, model))
                model_weights.append(combined_score)
                
                logging.info(f"{name} - AUC: {auc_score:.4f}, Cost Score: {cost_score:.4f}, Combined: {combined_score:.4f}")
                
            except Exception as e:
                logging.error(f"Error training {name}: {e}")
        
        if not trained_models:
            raise RuntimeError("No models were successfully trained")
        
        # Create ensemble if enabled and multiple models available
        if self.config.enable_ensemble and len(trained_models) > 1:
            # Normalize weights
            total_weight = sum(model_weights)
            normalized_weights = [w / total_weight for w in model_weights]
            
            # Create weighted voting ensemble
            ensemble = VotingClassifier(
                estimators=trained_models,
                voting='soft',
                weights=normalized_weights
            )
            
            # Don't need to refit as individual models are already trained
            ensemble.estimators_ = [result['model'] for result in individual_results.values()]
            
            # Evaluate ensemble
            ensemble_proba = ensemble.predict_proba(X_val)[:, 1]
            optimal_threshold = self.cost_trainer.optimize_threshold(ensemble, X_val, y_val)
            ensemble_pred = (ensemble_proba >= optimal_threshold).astype(int)
            
            # Calculate ensemble performance
            tn, fp, fn, tp = confusion_matrix(y_val, ensemble_pred).ravel()
            total_cost = (fp * self.config.false_positive_cost + 
                         fn * self.config.false_negative_cost +
                         tp * self.config.true_positive_cost)
            
            cost_score = 1 / (1 + total_cost / len(y_val))
            auc_score = roc_auc_score(y_val, ensemble_proba)
            combined_score = 0.7 * cost_score + 0.3 * auc_score
            
            ensemble_results = {
                'model': ensemble,
                'threshold': optimal_threshold,
                'cost_score': cost_score,
                'auc_score': auc_score,
                'combined_score': combined_score,
                'total_cost': total_cost,
                'confusion_matrix': {'tn': tn, 'fp': fp, 'fn': fn, 'tp': tp}
            }
            
            logging.info(f"Ensemble - AUC: {auc_score:.4f}, Cost Score: {cost_score:.4f}, Combined: {combined_score:.4f}")
            
            # Compare ensemble with best individual model
            best_individual = max(individual_results.values(), key=lambda x: x['combined_score'])
            
            if ensemble_results['combined_score'] > best_individual['combined_score']:
                return ensemble, optimal_threshold, {
                    'best_model_type': 'ensemble',
                    'ensemble_results': ensemble_results,
                    'individual_results': individual_results
                }
            else:
                best_model_name = max(individual_results.keys(), 
                                    key=lambda k: individual_results[k]['combined_score'])
                return (best_individual['model'], best_individual['threshold'], {
                    'best_model_type': best_model_name,
                    'individual_results': individual_results
                })
        else:
            # Return best individual model
            best_model_name = max(individual_results.keys(), 
                                key=lambda k: individual_results[k]['combined_score'])
            best_result = individual_results[best_model_name]
            
            return best_result['model'], best_result['threshold'], {
                'best_model_type': best_model_name,
                'individual_results': individual_results
            }

# OPTIMIZATION 5: Enhanced RTO Predictor with all optimizations
class OptimizedRTOPredictor:
    """Optimized RTO Predictor with enhanced features and cost-sensitive learning"""
    
    def __init__(self, 
                 preprocessing_config: OptimizedPreprocessingConfig = None,
                 model_config: OptimizedModelConfig = None):
        """Initialize optimized predictor"""
        
        self.preprocessing_config = preprocessing_config or OptimizedPreprocessingConfig()
        self.model_config = model_config or OptimizedModelConfig()
        
        # Enhanced feature engineering
        self.feature_engineer = AdvancedFeatureEngineer()
        self.ensemble_trainer = OptimizedEnsembleTrainer(self.model_config)
        
        # Model components
        self.model = None
        self.optimal_threshold = 0.5
        self.label_encoders = {}
        self.scaler = None
        self.feature_columns = None
        self.feature_importance = {}
        
        # Performance tracking
        self.training_results = {}
        self.validation_results = {}
        
        logging.info("Optimized RTO Predictor initialized")
    
    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        """Enhanced preprocessing with advanced feature engineering"""
        
        logging.info(f"Starting preprocessing. Input shape: {df.shape}")
        logging.info(f"Available columns: {list(df.columns)}")
        
        df = df.copy()
        
        # Column mapping for your actual data structure
        column_mapping = {
            'CLIENT': 'CLIENT_NAME',
            # Add other mappings as needed
        }
        
        # Apply column mapping
        for old_col, new_col in column_mapping.items():
            if old_col in df.columns and new_col not in df.columns:
                df[new_col] = df[old_col]
                logging.info(f"Mapped {old_col} -> {new_col}")
        
        # Basic preprocessing
        df = self._handle_missing_values(df)
        df = self._clean_text_fields(df)
        
        # Enhanced feature engineering (only if enabled and columns exist)
        if self.preprocessing_config.enable_customer_history:
            df = self.feature_engineer.create_customer_history_features(df)
            
        if self.preprocessing_config.enable_temporal_patterns:
            df = self.feature_engineer.create_advanced_temporal_features(df)
            
        if self.preprocessing_config.enable_address_parsing:
            df = self.feature_engineer.create_advanced_address_features(df)
            
        if self.preprocessing_config.enable_advanced_features:
            df = self.feature_engineer.create_phone_intelligence_features(df)
            df = self._create_interaction_features(df)
            df = self._create_risk_score_features(df)
        
        # Original feature creation for backward compatibility
        df = self._create_features(df)
        
        # Create target variable for training
        if is_training and 'CURRENT_STATUS' in df.columns:
            df['RTO_TARGET'] = df['CURRENT_STATUS'].apply(self._create_target)
            logging.info(f"Target variable created. Distribution: {df['RTO_TARGET'].value_counts().to_dict()}")
        
        # Encode categorical variables
        df = self._encode_categorical(df, is_training)
        
        # Handle outliers
        df = self._handle_outliers(df)
        
        logging.info(f"Preprocessing completed. Output shape: {df.shape}")
        logging.info(f"Final columns sample: {list(df.columns)[:10]}...")
        
        return df
    
    def _create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features between key variables"""
        try:
            # Payment mode and value interactions
            if 'IS_COD' in df.columns and 'INVOICE_VALUE' in df.columns:
                df['COD_HIGH_VALUE'] = df['IS_COD'] * (df['INVOICE_VALUE'] > df['INVOICE_VALUE'].median()).astype(int)
            
            # Zone and customer history interactions
            if 'ZONE_RISK' in df.columns and 'IS_REPEAT_CUSTOMER' in df.columns:
                df['ZONE_RISK_NEW_CUSTOMER'] = df['ZONE_RISK'] * (1 - df['IS_REPEAT_CUSTOMER'])
            
            # Phone quality and address quality interactions
            if 'PHONE_VALID' in df.columns and 'ADDRESS_STANDARDIZATION_SCORE' in df.columns:
                df['CONTACT_QUALITY_SCORE'] = df['PHONE_VALID'] * df['ADDRESS_STANDARDIZATION_SCORE']
            
            # Time and payment interactions
            if 'IS_BUSINESS_HOURS' in df.columns and 'IS_COD' in df.columns:
                df['BUSINESS_HOURS_COD'] = df['IS_BUSINESS_HOURS'] * df['IS_COD']
                
        except Exception as e:
            logging.warning(f"Error creating interaction features: {e}")
            
        return df
    
    def _create_risk_score_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create composite risk scores"""
        try:
            # Customer risk score
            customer_risk_features = [
                'IS_REPEAT_CUSTOMER', 'MULTIPLE_ADDRESSES', 
                'PHONE_VALID', 'PHONE_HAS_REPEATED_DIGITS'
            ]
            
            available_features = [f for f in customer_risk_features if f in df.columns]
            if available_features:
                df['CUSTOMER_RISK_SCORE'] = 0
                for feature in available_features:
                    if feature in ['IS_REPEAT_CUSTOMER', 'PHONE_VALID']:
                        df['CUSTOMER_RISK_SCORE'] += df[feature]  # Positive indicators
                    else:
                        df['CUSTOMER_RISK_SCORE'] -= df[feature]  # Negative indicators
                df['CUSTOMER_RISK_SCORE'] = df['CUSTOMER_RISK_SCORE'].clip(-5, 5)
            
            # Delivery risk score
            delivery_risk_features = [
                'ZONE_RISK', 'ADDRESS_DIFFICULTY_KEYWORDS',
                'RURAL_ADDRESS_KEYWORDS', 'ADDRESS_STANDARDIZATION_SCORE'
            ]
            
            available_features = [f for f in delivery_risk_features if f in df.columns]
            if available_features:
                df['DELIVERY_RISK_SCORE'] = 0
                for feature in available_features:
                    if feature == 'ADDRESS_STANDARDIZATION_SCORE':
                        df['DELIVERY_RISK_SCORE'] -= df[feature]  # Higher score = lower risk
                    else:
                        df['DELIVERY_RISK_SCORE'] += df[feature]  # Higher values = higher risk
                df['DELIVERY_RISK_SCORE'] = df['DELIVERY_RISK_SCORE'].clip(-5, 10)
                
        except Exception as e:
            logging.warning(f"Error creating risk score features: {e}")
            
        return df
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced missing value handling"""
        
        # Critical columns - create missing indicators and fill
        critical_cols = ['CUSTOMER_PHONE', 'CUSTOMER_ADDRESS', 'PAYMENT_MODE']
        
        for col in critical_cols:
            if col in df.columns:
                df[f'{col}_MISSING'] = df[col].isna().astype(int)
                
                if col == 'CUSTOMER_PHONE':
                    df[col] = df[col].fillna('0000000000')
                elif col == 'CUSTOMER_ADDRESS':
                    df[col] = df[col].fillna('Unknown Address')
                elif col == 'PAYMENT_MODE':
                    df[col] = df[col].fillna('Unknown')
        
        # Smart filling for numerical columns
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            if col in df.columns and df[col].isna().sum() > 0:
                # Use median for skewed data, mean for normal data
                if df[col].skew() > 2:
                    fill_value = df[col].median()
                else:
                    fill_value = df[col].mean()
                df[col] = df[col].fillna(fill_value)
        
        # Categorical columns
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if col in df.columns and df[col].isna().sum() > 0:
                mode_val = df[col].mode()
                fill_value = mode_val[0] if not mode_val.empty else 'Unknown'
                df[col] = df[col].fillna(fill_value)
        
        return df
    
    def _clean_text_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced text cleaning"""
        text_columns = ['CUSTOMER_NAME', 'CUSTOMER_ADDRESS', 'ITEM_DESCRIPTION']
        
        for col in text_columns:
            if col in df.columns:
                try:
                    df[col] = df[col].astype(str)
                    df[col] = df[col].str.lower()
                    df[col] = df[col].str.replace(r'[^\w\s]', ' ', regex=True)
                    df[col] = df[col].str.replace(r'\s+', ' ', regex=True)
                    df[col] = df[col].str.strip()
                    
                    # Remove common noise words
                    noise_words = ['test', 'dummy', 'sample', 'xyz', 'abc']
                    for noise in noise_words:
                        df[col] = df[col].str.replace(noise, '', regex=False)
                        
                except Exception as e:
                    logging.warning(f"Error cleaning text field {col}: {e}")
        
        return df
    
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced feature creation - backward compatible"""
        
        # Date features with enhanced patterns
        if 'ORDER_CREATION_DATE' in df.columns:
            try:
                df['ORDER_CREATION_DATE'] = pd.to_datetime(df['ORDER_CREATION_DATE'], errors='coerce')
                df['ORDER_HOUR'] = df['ORDER_CREATION_DATE'].dt.hour
                df['ORDER_DAY_OF_WEEK'] = df['ORDER_CREATION_DATE'].dt.dayofweek
                df['ORDER_MONTH'] = df['ORDER_CREATION_DATE'].dt.month
                
                # Enhanced time features
                df['IS_PEAK_DELIVERY_TIME'] = (
                    (df['ORDER_HOUR'].between(10, 12)) | 
                    (df['ORDER_HOUR'].between(15, 18))
                ).astype(int)
                
            except Exception as e:
                logging.warning(f"Error processing ORDER_CREATION_DATE: {e}")
        
        # Enhanced value calculations
        if 'WEIGHT' in df.columns and 'QTY' in df.columns:
            df['WEIGHT_PER_ITEM'] = df['WEIGHT'] / df['QTY'].replace(0, 1)
            df['IS_HEAVY_ITEM'] = (df['WEIGHT_PER_ITEM'] > df['WEIGHT_PER_ITEM'].quantile(0.8)).astype(int)
        
        if 'INVOICE_VALUE' in df.columns and 'QTY' in df.columns:
            df['VALUE_PER_ITEM'] = df['INVOICE_VALUE'] / df['QTY'].replace(0, 1)
            df['IS_HIGH_VALUE_ITEM'] = (df['VALUE_PER_ITEM'] > df['VALUE_PER_ITEM'].quantile(0.8)).astype(int)
        
        # Enhanced value flags with multiple thresholds
        if 'INVOICE_VALUE' in df.columns:
            q75 = df['INVOICE_VALUE'].quantile(0.75)
            q90 = df['INVOICE_VALUE'].quantile(0.90)
            df['HIGH_VALUE_ORDER'] = (df['INVOICE_VALUE'] > q75).astype(int)
            df['VERY_HIGH_VALUE_ORDER'] = (df['INVOICE_VALUE'] > q90).astype(int)
        
        # Enhanced payment mode features
        if 'PAYMENT_MODE' in df.columns:
            df['IS_COD'] = (df['PAYMENT_MODE'].str.contains('COD', case=False, na=False)).astype(int)
            df['IS_PREPAID'] = (df['PAYMENT_MODE'].str.contains('PREPAID|ONLINE|UPI|CARD', case=False, na=False)).astype(int)
        
        # Enhanced zone risk with more granular scoring
        zone_risk_mapping = {
            'Within City': 1,
            'Metro': 1,
            'A': 2,
            'Within Zone': 2,
            'B': 3,
            'Rest Of India': 4,
            'ROI': 4,
            'Special Zone': 5,
            'Remote': 5
        }
        
        if 'ZONE' in df.columns:
            df['ZONE_RISK'] = df['ZONE'].map(zone_risk_mapping).fillna(3)
            df['IS_REMOTE_ZONE'] = (df['ZONE_RISK'] >= 4).astype(int)
        
        return df
    
    def _create_target(self, status: str) -> int:
        """Enhanced target creation with better pattern matching"""
        if pd.isna(status):
            return 0
        
        status = str(status).upper().strip()
        
        # Definitive RTO patterns
        rto_patterns = [
            'RTO', 'RETURN', 'UNDELIVERABLE', 'UNDELIVERED',
            'RTO-INTRANSIT', 'RTO-DELIVERED', 'RTO-OFD',
            'REFUSED', 'REJECTED', 'CANCELLED',
            'ADDRESS NOT FOUND', 'CUSTOMER NOT AVAILABLE'
        ]
        
        # Definitive delivery patterns
        delivery_patterns = [
            'DELIVERED', 'O-DELIVERED', 'SUCCESSFUL'
        ]
        
        # Check for RTO patterns
        for pattern in rto_patterns:
            if pattern in status:
                return 1
        
        # Check for delivery patterns (but exclude if also has RTO)
        for pattern in delivery_patterns:
            if pattern in status and not any(rto in status for rto in rto_patterns):
                return 0
        
        # Default to non-RTO for ambiguous cases
        return 0
    
    def _encode_categorical(self, df: pd.DataFrame, is_training: bool) -> pd.DataFrame:
        """Enhanced categorical encoding with frequency encoding - updated for actual column names"""
        
        # Map your actual column names to expected names
        column_mapping = {
            'CLIENT': 'CLIENT_NAME',
            # Add other mappings if needed
        }
        
        # Apply column mapping
        for old_col, new_col in column_mapping.items():
            if old_col in df.columns and new_col not in df.columns:
                df[new_col] = df[old_col]
        
        categorical_columns = [
            'CLIENT_NAME', 'COURIER_NAME', 'CUSTOMER_CITY', 
            'CUSTOMER_STATE', 'PAYMENT_MODE', 'ZONE'
        ]
        
        for col in categorical_columns:
            if col in df.columns:
                try:
                    if is_training:
                        # Label encoding
                        self.label_encoders[col] = LabelEncoder()
                        df[f'{col}_ENCODED'] = self.label_encoders[col].fit_transform(df[col].astype(str))
                        
                        # Frequency encoding
                        freq_map = df[col].value_counts().to_dict()
                        df[f'{col}_FREQUENCY'] = df[col].map(freq_map)
                        
                        # Store frequency map for prediction
                        setattr(self, f'{col}_freq_map', freq_map)
                        
                    else:
                        # Handle unseen categories
                        if col in self.label_encoders:
                            known_categories = set(self.label_encoders[col].classes_)
                            df[col] = df[col].astype(str)
                            df[col] = df[col].apply(lambda x: x if x in known_categories else 'Unknown')
                            
                            if 'Unknown' not in known_categories:
                                self.label_encoders[col].classes_ = np.append(
                                    self.label_encoders[col].classes_, 'Unknown'
                                )
                            
                            df[f'{col}_ENCODED'] = self.label_encoders[col].transform(df[col])
                            
                            # Use training frequency for known categories, default for unknown
                            freq_map = getattr(self, f'{col}_freq_map', {})
                            df[f'{col}_FREQUENCY'] = df[col].map(freq_map).fillna(1)
                        else:
                            df[f'{col}_ENCODED'] = 0
                            df[f'{col}_FREQUENCY'] = 1
                            
                except Exception as e:
                    logging.error(f"Error encoding column {col}: {e}")
                    df[f'{col}_ENCODED'] = 0
                    df[f'{col}_FREQUENCY'] = 1
            else:
                # Create missing encoded columns with defaults
                logging.warning(f"Column {col} not found, creating with default values")
                df[f'{col}_ENCODED'] = 0
                df[f'{col}_FREQUENCY'] = 1
        
        return df
    
    def _handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced outlier handling with business logic"""
        
        numerical_columns = ['WEIGHT', 'INVOICE_VALUE', 'QTY', 'COLLECTABLE_AMOUNT']
        
        for col in numerical_columns:
            if col in df.columns:
                try:
                    # Use IQR method but with business-aware bounds
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    
                    # Business-specific bounds
                    if col == 'INVOICE_VALUE':
                        lower_bound = max(0, Q1 - 3 * IQR)  # Allow for discounts
                        upper_bound = min(100000, Q3 + 3 * IQR)  # Cap at reasonable max
                    elif col == 'WEIGHT':
                        lower_bound = max(0.1, Q1 - 2 * IQR)  # Minimum weight
                        upper_bound = min(50, Q3 + 2 * IQR)  # Maximum reasonable weight
                    elif col == 'QTY':
                        lower_bound = max(1, Q1 - 2 * IQR)  # Minimum quantity
                        upper_bound = min(20, Q3 + 2 * IQR)  # Maximum reasonable quantity
                    else:
                        lower_bound = Q1 - 2 * IQR
                        upper_bound = Q3 + 2 * IQR
                    
                    # Create outlier flags before clipping
                    df[f'{col}_IS_OUTLIER'] = (
                        (df[col] < lower_bound) | (df[col] > upper_bound)
                    ).astype(int)
                    
                    # Clip values
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                    
                except Exception as e:
                    logging.warning(f"Error handling outliers for {col}: {e}")
        
        return df
    
    def prepare_features(self, df: pd.DataFrame, is_training: bool = False) -> np.ndarray:
        """Enhanced feature preparation with feature selection and alignment"""
        
        # Enhanced feature list - only include features that can be reliably created
        all_possible_features = [
            # Basic encoded features (from your actual columns)
            'CLIENT_NAME_ENCODED', 'COURIER_NAME_ENCODED', 'CUSTOMER_CITY_ENCODED',
            'CUSTOMER_STATE_ENCODED', 'PAYMENT_MODE_ENCODED', 'ZONE_ENCODED',
            
            # Frequency features
            'CLIENT_NAME_FREQUENCY', 'COURIER_NAME_FREQUENCY', 'CUSTOMER_CITY_FREQUENCY',
            'CUSTOMER_STATE_FREQUENCY', 'PAYMENT_MODE_FREQUENCY', 'ZONE_FREQUENCY',
            
            # Original features (from your actual columns)
            'WEIGHT', 'QTY', 'INVOICE_VALUE', 'ZONE_RISK', 'IS_COD', 'IS_PREPAID',
            'HIGH_VALUE_ORDER', 'VERY_HIGH_VALUE_ORDER', 'WEIGHT_PER_ITEM', 'VALUE_PER_ITEM',
            
            # Enhanced features
            'IS_HEAVY_ITEM', 'IS_HIGH_VALUE_ITEM', 'IS_REMOTE_ZONE',
            
            # Phone features (if CUSTOMER_PHONE exists)
            'PHONE_LENGTH', 'PHONE_VALID', 'IS_INDIAN_MOBILE', 'IS_PREMIUM_MOBILE',
            'PHONE_HAS_REPEATED_DIGITS', 'PHONE_IS_SEQUENTIAL',
            
            # Address features (if CUSTOMER_ADDRESS exists)
            'ADDRESS_LENGTH', 'ADDRESS_WORD_COUNT', 'ADDRESS_RISK_KEYWORDS',
            'HAS_INDIAN_ADDRESS_KEYWORDS', 'HAS_LANDMARK', 'ADDRESS_DIFFICULTY_KEYWORDS',
            'URBAN_ADDRESS_KEYWORDS', 'RURAL_ADDRESS_KEYWORDS', 'ADDRESS_STANDARDIZATION_SCORE',
            
            # Temporal features (if ORDER_CREATION_DATE exists)
            'ORDER_HOUR', 'ORDER_DAY_OF_WEEK', 'ORDER_MONTH', 'IS_BUSINESS_HOURS',
            'IS_WEEKEND', 'IS_MONDAY', 'IS_FRIDAY', 'IS_FESTIVAL_SEASON',
            'IS_PEAK_DELIVERY_TIME',
            
            # Customer history features (if CUSTOMER_PHONE exists)
            'CUSTOMER_ORDER_FREQUENCY', 'IS_REPEAT_CUSTOMER', 'CUSTOMER_AVG_ORDER_VALUE',
            'ORDER_VALUE_DEVIATION', 'IS_HIGH_VALUE_FOR_CUSTOMER', 'CUSTOMER_ADDRESS_CONSISTENCY',
            'MULTIPLE_ADDRESSES', 'DAYS_SINCE_LAST_ORDER', 'IS_QUICK_REORDER',
            
            # Interaction features
            'COD_HIGH_VALUE', 'ZONE_RISK_NEW_CUSTOMER', 'CONTACT_QUALITY_SCORE',
            'BUSINESS_HOURS_COD',
            
            # Risk scores
            'CUSTOMER_RISK_SCORE', 'DELIVERY_RISK_SCORE',
            
            # Outlier flags
            'WEIGHT_IS_OUTLIER', 'INVOICE_VALUE_IS_OUTLIER', 'QTY_IS_OUTLIER',
            
            # Missing indicators
            'CUSTOMER_PHONE_MISSING', 'CUSTOMER_ADDRESS_MISSING', 'PAYMENT_MODE_MISSING'
        ]
        
        if is_training:
            # During training, use available columns and store the feature list
            available_cols = [col for col in all_possible_features if col in df.columns]
            
            if not available_cols:
                # If no enhanced features available, use basic features
                basic_features = ['WEIGHT', 'QTY', 'INVOICE_VALUE']
                available_cols = [col for col in basic_features if col in df.columns]
                
                if not available_cols:
                    raise ValueError("No valid feature columns found in the data")
            
            self.feature_columns = available_cols
            logging.info(f"Training: Using {len(available_cols)} features for modeling")
            logging.info(f"Selected features: {available_cols}")
            
        else:
            # During prediction, ensure we have the same features as training
            if not hasattr(self, 'feature_columns') or not self.feature_columns:
                raise ValueError("Model not trained. Feature columns not defined.")
            
            # Create a DataFrame with all required features, filling missing ones with defaults
            feature_df = pd.DataFrame(index=df.index)
            
            for col in self.feature_columns:
                if col in df.columns:
                    feature_df[col] = df[col]
                else:
                    # Provide default values for missing features
                    if col.endswith('_ENCODED'):
                        feature_df[col] = 0
                    elif col.endswith('_FREQUENCY'):
                        feature_df[col] = 1
                    elif col.endswith('_MISSING'):
                        feature_df[col] = 1  # Mark as missing
                    elif col.startswith('IS_') or col.endswith('_KEYWORDS'):
                        feature_df[col] = 0
                    elif col in ['PHONE_LENGTH', 'ADDRESS_LENGTH', 'ADDRESS_WORD_COUNT']:
                        feature_df[col] = 0
                    elif col in ['CUSTOMER_RISK_SCORE', 'DELIVERY_RISK_SCORE']:
                        feature_df[col] = 0
                    elif col in ['ADDRESS_STANDARDIZATION_SCORE']:
                        feature_df[col] = 2  # Neutral score
                    elif col in ['WEIGHT', 'QTY', 'INVOICE_VALUE']:
                        feature_df[col] = df[col].median() if col in df.columns else 1
                    elif col == 'ZONE_RISK':
                        feature_df[col] = 3  # Default zone risk
                    else:
                        feature_df[col] = 0  # Default for all other features
            
            # Log feature alignment
            missing_features = [col for col in self.feature_columns if col not in df.columns]
            if missing_features:
                logging.warning(f"Prediction: {len(missing_features)} features missing, using defaults")
                logging.debug(f"Missing features: {missing_features}")
            
            logging.info(f"Prediction: Aligned to {len(self.feature_columns)} training features")
            
            df = feature_df
        
        # Ensure we're using the correct feature columns
        X = df[self.feature_columns].copy()
        
        # Handle any remaining missing values
        X = X.fillna(0)
        
        # Feature selection if enabled (only during training or if already fitted)
        if self.model_config.enable_feature_selection and hasattr(self, 'feature_importance') and self.feature_importance:
            X = self._select_top_features(X)
        
        # Validate feature matrix shape
        expected_features = len(self.feature_columns)
        actual_features = X.shape[1]
        
        if actual_features != expected_features:
            logging.error(f"Feature count mismatch: expected {expected_features}, got {actual_features}")
            logging.error(f"Expected features: {self.feature_columns}")
            logging.error(f"Actual features: {list(X.columns)}")
            raise ValueError(f"Feature mismatch: expected {expected_features} features, got {actual_features}")
        
        return X.values
    
    def _select_top_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Select top features based on importance"""
        if not self.feature_importance:
            return X
        
        # Get feature importance scores
        importance_scores = []
        for col in X.columns:
            importance_scores.append(self.feature_importance.get(col, 0))
        
        # Select top features
        feature_importance_df = pd.DataFrame({
            'feature': X.columns,
            'importance': importance_scores
        }).sort_values('importance', ascending=False)
        
        top_features = feature_importance_df.head(self.model_config.max_features)['feature'].tolist()
        
        logging.info(f"Selected top {len(top_features)} features based on importance")
        
        return X[top_features]
    
    def train_model(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Enhanced model training with cost optimization"""
        
        logging.info("Starting optimized model training...")
        
        # Preprocess data
        df_processed = self.preprocess_data(df, is_training=True)
        
        if 'RTO_TARGET' not in df_processed.columns:
            raise ValueError("Training data must contain status information")
        
        # Check class balance
        class_counts = df_processed['RTO_TARGET'].value_counts()
        logging.info(f"Class distribution: {class_counts.to_dict()}")
        
        # Prepare features and target - pass is_training=True
        X = self.prepare_features(df_processed, is_training=True)
        y = df_processed['RTO_TARGET'].values
        
        logging.info(f"Training data shape: {X.shape}")
        logging.info(f"Features used: {len(self.feature_columns)}")
        
        # Split data with stratification
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Further split training into train/validation for model selection
        X_train_inner, X_val, y_train_inner, y_val = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
        )
        
        # Scale features
        self.scaler = RobustScaler()  # More robust to outliers
        X_train_scaled = self.scaler.fit_transform(X_train_inner)
        X_val_scaled = self.scaler.transform(X_val)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train ensemble with cost optimization
        best_model, optimal_threshold, training_results = self.ensemble_trainer.train_ensemble(
            X_train_scaled, y_train_inner, X_val_scaled, y_val
        )
        
        self.model = best_model
        self.optimal_threshold = optimal_threshold
        self.training_results = training_results
        
        # Final evaluation on test set
        y_test_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        y_test_pred = (y_test_proba >= optimal_threshold).astype(int)
        
        # Calculate final metrics
        from sklearn.metrics import classification_report
        
        final_metrics = {
            'test_auc': roc_auc_score(y_test, y_test_proba),
            'test_classification_report': classification_report(y_test, y_test_pred, output_dict=True),
            'optimal_threshold': optimal_threshold,
            'confusion_matrix': confusion_matrix(y_test, y_test_pred).tolist(),
            'feature_count': len(self.feature_columns)
        }
        
        # Calculate feature importance
        self.feature_importance = self._calculate_feature_importance()
        
        logging.info(f"Training completed. Test AUC: {final_metrics['test_auc']:.4f}")
        logging.info(f"Features trained on: {len(self.feature_columns)}")
        
        return {
            **training_results,
            'final_metrics': final_metrics,
            'feature_importance': self.feature_importance
        }
    
    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Enhanced prediction with cost-optimized threshold"""
        
        if self.model is None:
            raise ValueError("Model not trained. Please train the model first.")
        
        logging.info(f"Making predictions for {len(df)} orders...")
        
        # Preprocess data
        df_processed = self.preprocess_data(df, is_training=False)
        
        # Prepare features - pass is_training=False to ensure feature alignment
        X = self.prepare_features(df_processed, is_training=False)
        
        # Verify feature alignment
        expected_features = len(self.feature_columns)
        actual_features = X.shape[1]
        
        if actual_features != expected_features:
            raise ValueError(f"Feature mismatch: model expects {expected_features} features, got {actual_features}")
        
        logging.info(f"Feature alignment successful: {actual_features} features")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Make predictions with optimal threshold
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        predictions = (probabilities >= self.optimal_threshold).astype(int)
        
        # Generate detailed results
        results = []
        for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
            try:
                order_data = df_processed.iloc[i]
                
                result = {
                    'order_index': i,
                    'order_number': str(order_data.get('ORDER_NUMBER', f'ORDER_{i}')),
                    'rto_prediction': bool(pred),
                    'rto_probability': float(prob),
                    'risk_level': self._get_risk_level(prob),
                    'confidence_score': self._get_confidence_score(prob),
                    'explanation': self._generate_enhanced_explanation(order_data, prob),
                    'recommendations': self._generate_enhanced_recommendations(order_data, prob),
                    'feature_contributions': self._get_feature_contributions(X_scaled[i], prob)
                }
                results.append(result)
                
            except Exception as e:
                logging.error(f"Error processing order {i}: {e}")
                results.append({
                    'order_index': i,
                    'error': str(e),
                    'rto_prediction': False,
                    'rto_probability': 0.5
                })
        
        logging.info(f"Predictions completed successfully for {len(results)} orders")
        
        return {
            'predictions': results,
            'summary': self._generate_enhanced_summary(df_processed, predictions, probabilities),
            'model_info': {
                'model_type': type(self.model).__name__,
                'optimal_threshold': self.optimal_threshold,
                'feature_count': len(self.feature_columns)
            }
        }
    
    def _calculate_feature_importance(self) -> Dict[str, float]:
        """Calculate feature importance from trained model"""
        
        if self.model is None or self.feature_columns is None:
            return {}
        
        try:
            # Handle ensemble models
            if hasattr(self.model, 'estimators_'):
                # For voting classifier, average importance across estimators
                all_importances = []
                
                for estimator in self.model.estimators_:
                    if hasattr(estimator, 'feature_importances_'):
                        all_importances.append(estimator.feature_importances_)
                    elif hasattr(estimator, 'coef_'):
                        all_importances.append(np.abs(estimator.coef_[0]))
                
                if all_importances:
                    avg_importance = np.mean(all_importances, axis=0)
                    feature_importance = dict(zip(self.feature_columns, avg_importance))
                else:
                    return {}
                    
            elif hasattr(self.model, 'feature_importances_'):
                feature_importance = dict(zip(self.feature_columns, self.model.feature_importances_))
            elif hasattr(self.model, 'coef_'):
                feature_importance = dict(zip(self.feature_columns, np.abs(self.model.coef_[0])))
            else:
                return {}
            
            # Sort by importance
            feature_importance = dict(sorted(feature_importance.items(), 
                                           key=lambda x: x[1], reverse=True))
            
            return feature_importance
            
        except Exception as e:
            logging.error(f"Error calculating feature importance: {e}")
            return {}
    
    def _get_risk_level(self, probability: float) -> str:
        """Enhanced risk level categorization"""
        if probability < 0.2:
            return "Very Low"
        elif probability < 0.4:
            return "Low"
        elif probability < 0.6:
            return "Medium"
        elif probability < 0.8:
            return "High"
        else:
            return "Very High"
    
    def _get_confidence_score(self, probability: float) -> float:
        """Calculate prediction confidence"""
        # Confidence is higher when probability is closer to 0 or 1
        return max(probability, 1 - probability)
    
    def _generate_enhanced_explanation(self, order_data: pd.Series, probability: float) -> str:
        """Generate detailed explanation using feature contributions"""
        
        explanations = []
        
        try:
            # Risk factors
            risk_factors = []
            protective_factors = []
            
            # Payment mode
            if order_data.get('IS_COD', 0) == 1:
                risk_factors.append("COD payment (higher RTO risk)")
            elif order_data.get('IS_PREPAID', 0) == 1:
                protective_factors.append("Prepaid payment (lower RTO risk)")
            
            # Customer history
            if order_data.get('IS_REPEAT_CUSTOMER', 0) == 1:
                protective_factors.append("Repeat customer (better reliability)")
            else:
                risk_factors.append("New customer (less predictable)")
            
            # Address quality
            addr_score = order_data.get('ADDRESS_STANDARDIZATION_SCORE', 0)
            if addr_score >= 3:
                protective_factors.append("Well-structured address")
            elif addr_score <= 1:
                risk_factors.append("Poor address quality")
            
            # Zone risk
            zone_risk = order_data.get('ZONE_RISK', 2)
            if zone_risk >= 4:
                risk_factors.append("Remote/difficult delivery zone")
            elif zone_risk <= 2:
                protective_factors.append("Easy delivery zone")
            
            # Phone quality
            if order_data.get('PHONE_VALID', 1) == 0:
                risk_factors.append("Invalid phone number format")
            elif order_data.get('PHONE_VALID', 1) == 1:
                protective_factors.append("Valid phone number")
            
            # Order characteristics
            if order_data.get('VERY_HIGH_VALUE_ORDER', 0) == 1:
                risk_factors.append("Very high value order")
            
            if order_data.get('IS_BUSINESS_HOURS', 0) == 1:
                protective_factors.append("Ordered during business hours")
            
            # Compile explanation
            if risk_factors:
                explanations.append(f"Risk factors: {', '.join(risk_factors)}")
            if protective_factors:
                explanations.append(f"Protective factors: {', '.join(protective_factors)}")
            
            if not explanations:
                explanations.append("Standard risk assessment based on order characteristics")
                
        except Exception as e:
            logging.warning(f"Error generating explanation: {e}")
            explanations.append("Risk assessment completed")
        
        return "; ".join(explanations)
    
    def _generate_enhanced_recommendations(self, order_data: pd.Series, probability: float) -> List[str]:
        """Generate actionable recommendations based on risk factors"""
        
        recommendations = []
        
        try:
            # High risk recommendations
            if probability > 0.7:
                recommendations.extend([
                    "🔴 HIGH RISK: Consider pre-delivery customer contact",
                    "📞 Call customer to confirm address and availability",
                    "📍 Verify exact delivery location with landmarks",
                    "🚚 Use premium courier service for better success rate"
                ])
            
            # Medium risk recommendations
            elif probability > 0.4:
                recommendations.extend([
                    "🟡 MEDIUM RISK: Enhanced delivery precautions recommended",
                    "📱 Send SMS notification before delivery attempt"
                ])
            
            # Specific recommendations based on features
            if order_data.get('IS_COD', 0) == 1:
                recommendations.append("💰 COD Order: Ensure customer has exact change ready")
                
            if order_data.get('PHONE_VALID', 1) == 0:
                recommendations.append("📞 Invalid phone: Update customer contact information")
                
            if order_data.get('ADDRESS_STANDARDIZATION_SCORE', 5) <= 2:
                recommendations.append("📍 Poor address: Get detailed address with local landmarks")
                
            if order_data.get('ZONE_RISK', 2) >= 4:
                recommendations.append("🗺️ Remote area: Consider local courier or delivery partner")
                
            if order_data.get('IS_REPEAT_CUSTOMER', 0) == 0:
                recommendations.append("👤 New customer: Extra verification recommended")
                
            if order_data.get('VERY_HIGH_VALUE_ORDER', 0) == 1:
                recommendations.append("💎 High value: Consider signature confirmation")
                
            # Low risk positive reinforcement
            if probability < 0.3:
                recommendations.append("✅ LOW RISK: Standard delivery procedures sufficient")
                
        except Exception as e:
            logging.warning(f"Error generating recommendations: {e}")
            recommendations.append("Follow standard delivery procedures")
        
        return recommendations
    
    def _get_feature_contributions(self, order_features: np.ndarray, probability: float) -> Dict[str, float]:
        """Get top feature contributions for this prediction"""
        
        try:
            if not hasattr(self, 'feature_importance') or not self.feature_importance:
                return {}
            
            # Get top 5 most important features for this order
            feature_contributions = {}
            
            for i, feature_name in enumerate(self.feature_columns[:len(order_features)]):
                feature_value = order_features[i]
                importance = self.feature_importance.get(feature_name, 0)
                
                # Calculate contribution (importance * normalized feature value)
                contribution = importance * abs(feature_value)
                feature_contributions[feature_name] = float(contribution)
            
            # Return top 5 contributors
            sorted_contributions = dict(sorted(feature_contributions.items(), 
                                             key=lambda x: x[1], reverse=True)[:5])
            
            return sorted_contributions
            
        except Exception as e:
            logging.warning(f"Error calculating feature contributions: {e}")
            return {}
    
    def _generate_enhanced_summary(self, df: pd.DataFrame, predictions: np.ndarray, probabilities: np.ndarray) -> Dict:
        """Generate comprehensive prediction summary"""
        
        try:
            total_orders = len(predictions)
            predicted_rto = np.sum(predictions)
            avg_risk = np.mean(probabilities)
            
            # Enhanced risk distribution
            very_high_risk = np.sum(probabilities > 0.8)
            high_risk = np.sum((probabilities > 0.6) & (probabilities <= 0.8))
            medium_risk = np.sum((probabilities > 0.4) & (probabilities <= 0.6))
            low_risk = np.sum((probabilities > 0.2) & (probabilities <= 0.4))
            very_low_risk = np.sum(probabilities <= 0.2)
            
            # Payment mode analysis
            payment_analysis = {}
            if 'IS_COD' in df.columns:
                cod_orders = df['IS_COD'].sum()
                cod_avg_risk = np.mean(probabilities[df['IS_COD'] == 1]) if cod_orders > 0 else 0
                prepaid_orders = total_orders - cod_orders
                prepaid_avg_risk = np.mean(probabilities[df['IS_COD'] == 0]) if prepaid_orders > 0 else 0
                
                payment_analysis = {
                    'cod_orders': int(cod_orders),
                    'cod_avg_risk': float(cod_avg_risk),
                    'prepaid_orders': int(prepaid_orders),
                    'prepaid_avg_risk': float(prepaid_avg_risk)
                }
            
            # Zone analysis
            zone_analysis = {}
            if 'ZONE_RISK' in df.columns:
                for zone_risk in sorted(df['ZONE_RISK'].unique()):
                    zone_mask = df['ZONE_RISK'] == zone_risk
                    zone_orders = np.sum(zone_mask)
                    zone_avg_risk = np.mean(probabilities[zone_mask])
                    zone_analysis[f'zone_risk_{int(zone_risk)}'] = {
                        'orders': int(zone_orders),
                        'avg_risk': float(zone_avg_risk)
                    }
            
            # Customer type analysis
            customer_analysis = {}
            if 'IS_REPEAT_CUSTOMER' in df.columns:
                repeat_customers = df['IS_REPEAT_CUSTOMER'].sum()
                repeat_avg_risk = np.mean(probabilities[df['IS_REPEAT_CUSTOMER'] == 1]) if repeat_customers > 0 else 0
                new_customers = total_orders - repeat_customers
                new_avg_risk = np.mean(probabilities[df['IS_REPEAT_CUSTOMER'] == 0]) if new_customers > 0 else 0
                
                customer_analysis = {
                    'repeat_customers': int(repeat_customers),
                    'repeat_customer_avg_risk': float(repeat_avg_risk),
                    'new_customers': int(new_customers),
                    'new_customer_avg_risk': float(new_avg_risk)
                }
            
            # Business impact estimation
            business_impact = self._estimate_business_impact(predictions, probabilities)
            
            return {
                'total_orders': int(total_orders),
                'predicted_rto': int(predicted_rto),
                'predicted_rto_rate': float(predicted_rto / total_orders),
                'average_risk_score': float(avg_risk),
                'risk_distribution': {
                    'very_high_risk': int(very_high_risk),
                    'high_risk': int(high_risk),
                    'medium_risk': int(medium_risk),
                    'low_risk': int(low_risk),
                    'very_low_risk': int(very_low_risk)
                },
                'payment_analysis': payment_analysis,
                'zone_analysis': zone_analysis,
                'customer_analysis': customer_analysis,
                'business_impact': business_impact,
                'summary_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logging.error(f"Error generating enhanced summary: {e}")
            return {
                'total_orders': len(predictions),
                'error': str(e),
                'summary_timestamp': datetime.now().isoformat()
            }
    
    def _estimate_business_impact(self, predictions: np.ndarray, probabilities: np.ndarray) -> Dict[str, float]:
        """Estimate business impact of predictions"""
        
        try:
            total_orders = len(predictions)
            predicted_rto = np.sum(predictions)
            
            # Estimated costs (configurable)
            avg_order_value = 1000  # Average order value in INR
            rto_cost_per_order = 150  # Cost of RTO processing
            intervention_cost = 25   # Cost of preventive intervention
            
            # Calculate potential savings
            high_risk_orders = np.sum(probabilities > 0.6)
            potential_prevented_rtos = high_risk_orders * 0.3  # Assume 30% prevention rate
            
            estimated_savings = potential_prevented_rtos * rto_cost_per_order
            intervention_costs = high_risk_orders * intervention_cost
            net_savings = estimated_savings - intervention_costs
            
            return {
                'high_risk_orders_requiring_intervention': int(high_risk_orders),
                'estimated_rto_cost_without_intervention': float(predicted_rto * rto_cost_per_order),
                'estimated_intervention_cost': float(intervention_costs),
                'estimated_prevented_rtos': float(potential_prevented_rtos),
                'estimated_gross_savings': float(estimated_savings),
                'estimated_net_savings': float(net_savings),
                'roi_percentage': float((net_savings / intervention_costs * 100) if intervention_costs > 0 else 0)
            }
            
        except Exception as e:
            logging.warning(f"Error estimating business impact: {e}")
            return {}


# OPTIMIZATION 6: Enhanced Pipeline Manager
class OptimizedRTOPipelineManager:
    """
    Optimized pipeline manager with enhanced cost-sensitive learning
    """
    
    def __init__(self, config_path: str = None):
        """Initialize optimized pipeline manager"""
        
        self.config = self._load_enhanced_config(config_path)
        
        # Setup logging
        self._setup_logging()
        
        # Initialize optimized predictor
        preprocessing_config = OptimizedPreprocessingConfig(**self.config.get('preprocessing', {}))
        model_config = OptimizedModelConfig(**self.config.get('model', {}))
        
        self.predictor = OptimizedRTOPredictor(preprocessing_config, model_config)
        
        logging.info("Optimized RTO Pipeline Manager initialized")
    
    def _load_enhanced_config(self, config_path: str) -> Dict:
        """Load enhanced configuration with optimization defaults"""
        
        default_config = {
            'data_dir': 'data',
            'model_dir': 'models',
            'output_dir': 'output',
            'log_dir': 'logs',
            'preprocessing': {
                'enable_advanced_features': True,
                'enable_customer_history': True,
                'enable_temporal_patterns': True,
                'enable_address_parsing': True
            },
            'model': {
                'false_positive_cost': 50.0,
                'false_negative_cost': 200.0,
                'true_positive_cost': 10.0,
                'optimize_for_cost': True,
                'enable_ensemble': True,
                'enable_calibration': True,
                'enable_feature_selection': True,
                'max_features': 50
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                    # Deep merge
                    for key, value in user_config.items():
                        if isinstance(value, dict) and key in default_config:
                            default_config[key].update(value)
                        else:
                            default_config[key] = value
            except Exception as e:
                logging.warning(f"Error loading config: {e}")
        
        return default_config
    
    def _setup_logging(self):
        """Setup enhanced logging"""
        log_dir = Path(self.config.get('log_dir', 'logs'))
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'optimized_rto_pipeline.log'),
                logging.StreamHandler()
            ]
        )
    
    def train_optimized_model(self, training_data_path: str) -> Dict[str, Any]:
        """Train model with enhanced optimizations"""
        
        logging.info(f"Training optimized model with data from {training_data_path}")
        
        try:
            # Load training data
            df = pd.read_csv(training_data_path)
            logging.info(f"Loaded {len(df)} records for training")
            
            # Train model
            results = self.predictor.train_model(df)
            
            # Save enhanced results
            self._save_enhanced_results(results, training_data_path, 'training')
            
            # Print optimization summary
            self._print_optimization_summary(results)
            
            return results
            
        except Exception as e:
            logging.error(f"Error training optimized model: {e}")
            raise
    
    def predict_with_optimization(self, prediction_data_path: str) -> Dict[str, Any]:
        """Make predictions with cost optimization"""
        
        logging.info(f"Making optimized predictions for data from {prediction_data_path}")
        
        try:
            # Load prediction data
            df = pd.read_csv(prediction_data_path)
            logging.info(f"Loaded {len(df)} orders for prediction")
            
            # Make predictions
            results = self.predictor.predict(df)
            
            # Save enhanced results
            self._save_enhanced_results(results, prediction_data_path, 'prediction')
            
            # Print prediction summary
            self._print_prediction_summary(results)
            
            return results
            
        except Exception as e:
            logging.error(f"Error making optimized predictions: {e}")
            raise
    
    def validate_optimization_performance(self, validation_data_path: str) -> Dict[str, Any]:
        """Validate model performance with cost analysis"""
        
        logging.info(f"Validating optimization performance with data from {validation_data_path}")
        
        try:
            # Load validation data
            df = pd.read_csv(validation_data_path)
            
            # Preprocess data
            df_processed = self.predictor.preprocess_data(df, is_training=True)
            
            if 'RTO_TARGET' not in df_processed.columns:
                raise ValueError("Validation data must contain status information")
            
            # Make predictions
            X = self.predictor.prepare_features(df_processed)
            X_scaled = self.predictor.scaler.transform(X)
            
            y_true = df_processed['RTO_TARGET'].values
            y_prob = self.predictor.model.predict_proba(X_scaled)[:, 1]
            y_pred = (y_prob >= self.predictor.optimal_threshold).astype(int)
            
            # Calculate comprehensive validation metrics
            validation_results = self._calculate_comprehensive_validation(y_true, y_pred, y_prob)
            
            # Print validation summary
            self._print_validation_summary(validation_results)
            
            return validation_results
            
        except Exception as e:
            logging.error(f"Error validating optimization performance: {e}")
            raise
    
    def _calculate_comprehensive_validation(self, y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
        """Calculate comprehensive validation metrics including cost analysis"""
        
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
        
        # Basic metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        auc = roc_auc_score(y_true, y_prob)
        
        # Confusion matrix
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        
        # Cost analysis
        false_positive_cost = fp * self.predictor.model_config.false_positive_cost
        false_negative_cost = fn * self.predictor.model_config.false_negative_cost
        true_positive_cost = tp * self.predictor.model_config.true_positive_cost
        total_cost = false_positive_cost + false_negative_cost + true_positive_cost
        
        # Calculate baseline cost (no model scenario)
        baseline_cost = len(y_true) * 100  # Assume $100 average cost per order without prediction
        cost_savings = baseline_cost - total_cost
        
        # Business metrics
        business_metrics = {
            'correctly_identified_rto': int(tp),
            'correctly_identified_delivered': int(tn),
            'wrongly_flagged_as_rto': int(fp),
            'missed_rto_cases': int(fn),
            'total_actual_rto': int(tp + fn),
            'total_actual_delivered': int(tn + fp)
        }
        
        return {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'auc_score': float(auc),
            'confusion_matrix': {
                'true_positives': int(tp),
                'true_negatives': int(tn),
                'false_positives': int(fp),
                'false_negatives': int(fn)
            },
            'business_metrics': business_metrics,
            'cost_analysis': {
                'total_cost': float(total_cost),
                'false_positive_cost': float(false_positive_cost),
                'false_negative_cost': float(false_negative_cost),
                'true_positive_cost': float(true_positive_cost),
                'cost_savings': float(cost_savings),
                'cost_per_order': float(total_cost / len(y_true)),
                'cost_efficiency': float(cost_savings / baseline_cost * 100)
            },
            'optimal_threshold': float(self.predictor.optimal_threshold),
            'validation_timestamp': datetime.now().isoformat()
        }
    
    def _save_enhanced_results(self, results: Dict[str, Any], source_path: str, result_type: str):
        """Save enhanced results with optimization details"""
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_dir = Path(self.config.get('output_dir', 'output'))
        output_dir.mkdir(exist_ok=True)
        
        # Save complete results
        output_file = output_dir / f"optimized_{result_type}_results_{timestamp}.json"
        
        enhanced_results = {
            **results,
            'optimization_config': {
                'cost_optimization_enabled': self.predictor.model_config.optimize_for_cost,
                'ensemble_enabled': self.predictor.model_config.enable_ensemble,
                'feature_selection_enabled': self.predictor.model_config.enable_feature_selection,
                'false_positive_cost': self.predictor.model_config.false_positive_cost,
                'false_negative_cost': self.predictor.model_config.false_negative_cost
            },
            'source_file': source_path,
            'processing_timestamp': timestamp
        }
        
        try:
            with open(output_file, 'w') as f:
                json.dump(enhanced_results, f, indent=2, default=str)
            
            logging.info(f"Enhanced {result_type} results saved to {output_file}")
            
        except Exception as e:
            logging.error(f"Error saving enhanced results: {e}")
    
    def _print_optimization_summary(self, results: Dict[str, Any]):
        """Print training optimization summary"""
        
        print("\n" + "="*60)
        print("🚀 OPTIMIZED RTO PREDICTION MODEL TRAINING SUMMARY")
        print("="*60)
        
        if 'best_model_type' in results:
            print(f"✅ Best Model: {results['best_model_type']}")
        
        if 'final_metrics' in results:
            metrics = results['final_metrics']
            print(f"📊 Test AUC Score: {metrics['test_auc']:.4f}")
            print(f"🎯 Optimal Threshold: {metrics['optimal_threshold']:.3f}")
            print(f"🔧 Features Used: {metrics['feature_count']}")
        
        if 'individual_results' in results:
            print("\n📈 Individual Model Performance:")
            for model_name, model_result in results['individual_results'].items():
                print(f"  {model_name}: AUC={model_result['auc_score']:.4f}, Cost Score={model_result['cost_score']:.4f}")
        
        print("\n🎯 Optimization Features Enabled:")
        print(f"  💰 Cost-Sensitive Learning: {self.predictor.model_config.optimize_for_cost}")
        print(f"  🔗 Ensemble Methods: {self.predictor.model_config.enable_ensemble}")
        print(f"  🎛️ Feature Selection: {self.predictor.model_config.enable_feature_selection}")
        print(f"  📊 Advanced Features: {self.predictor.preprocessing_config.enable_advanced_features}")
        
        print("\n💡 Cost Configuration:")
        print(f"  False Positive Cost: ₹{self.predictor.model_config.false_positive_cost}")
        print(f"  False Negative Cost: ₹{self.predictor.model_config.false_negative_cost}")
        print(f"  True Positive Cost: ₹{self.predictor.model_config.true_positive_cost}")
        
        print("="*60)
    
    def _print_prediction_summary(self, results: Dict[str, Any]):
        """Print prediction optimization summary"""
        
        print("\n" + "="*60)
        print("🎯 OPTIMIZED PREDICTION RESULTS SUMMARY")
        print("="*60)
        
        if 'summary' in results:
            summary = results['summary']
            print(f"📦 Total Orders: {summary['total_orders']}")
            print(f"⚠️ Predicted RTO: {summary['predicted_rto']} ({summary['predicted_rto_rate']:.2%})")
            print(f"📊 Average Risk Score: {summary['average_risk_score']:.3f}")
            
            if 'risk_distribution' in summary:
                risk_dist = summary['risk_distribution']
                print(f"\n🚦 Risk Distribution:")
                print(f"  🔴 Very High Risk: {risk_dist['very_high_risk']}")
                print(f"  🟠 High Risk: {risk_dist['high_risk']}")
                print(f"  🟡 Medium Risk: {risk_dist['medium_risk']}")
                print(f"  🟢 Low Risk: {risk_dist['low_risk']}")
                print(f"  ✅ Very Low Risk: {risk_dist['very_low_risk']}")
            
            if 'business_impact' in summary:
                impact = summary['business_impact']
                print(f"\n💼 Business Impact Estimation:")
                print(f"  🎯 High-Risk Orders for Intervention: {impact.get('high_risk_orders_requiring_intervention', 0)}")
                print(f"  💰 Estimated Net Savings: ₹{impact.get('estimated_net_savings', 0):,.2f}")
                print(f"  📈 ROI: {impact.get('roi_percentage', 0):.1f}%")
        
        print("="*60)
    
    def _print_validation_summary(self, results: Dict[str, Any]):
        """Print validation optimization summary"""
        
        print("\n" + "="*60)
        print("✅ OPTIMIZATION VALIDATION SUMMARY")
        print("="*60)
        
        print(f"🎯 Model Performance:")
        print(f"  Accuracy: {results['accuracy']:.2%}")
        print(f"  Precision: {results['precision']:.2%}")
        print(f"  Recall: {results['recall']:.2%}")
        print(f"  F1-Score: {results['f1_score']:.2%}")
        print(f"  AUC Score: {results['auc_score']:.4f}")
        
        bm = results['business_metrics']
        print(f"\n📊 Business Impact:")
        print(f"  ✅ Correctly identified RTO: {bm['correctly_identified_rto']}")
        print(f"  ✅ Correctly identified Delivered: {bm['correctly_identified_delivered']}")
        print(f"  ❌ Wrongly flagged as RTO: {bm['wrongly_flagged_as_rto']}")
        print(f"  ❌ Missed RTO cases: {bm['missed_rto_cases']}")
        
        cost = results['cost_analysis']
        print(f"\n💰 Cost Analysis:")
        print(f"  Total Cost: ₹{cost['total_cost']:,.2f}")
        print(f"  Cost per Order: ₹{cost['cost_per_order']:.2f}")
        print(f"  Cost Savings: ₹{cost['cost_savings']:,.2f}")
        print(f"  Cost Efficiency: {cost['cost_efficiency']:.1f}%")
        
        print(f"\n🎛️ Optimal Threshold: {results['optimal_threshold']:.3f}")
        
        print("="*60)


# Enhanced debug and test functions
def debug_data_and_features():
    """Debug function to understand data structure and feature creation"""
    
    print("🔍 DEBUG: Analyzing data structure and feature creation...")
    
    # Initialize pipeline
    pipeline = OptimizedRTOPipelineManager()
    
    try:
        # Load a sample of training data
        print("\n📂 Loading training data...")
        training_df = pd.read_csv('data/to_train/training_data_2025_05_23.csv')
        print(f"Training data shape: {training_df.shape}")
        print(f"Training columns: {list(training_df.columns)}")
        
        # Process training data and see what features are created
        print("\n🔧 Processing training data...")
        processed_training = pipeline.predictor.preprocess_data(training_df, is_training=True)
        print(f"Processed training shape: {processed_training.shape}")
        print(f"Sample of new columns: {[col for col in processed_training.columns if col not in training_df.columns][:10]}")
        
        # Prepare features and see the final feature set
        print("\n🎯 Preparing training features...")
        X_train = pipeline.predictor.prepare_features(processed_training, is_training=True)
        print(f"Final training feature matrix shape: {X_train.shape}")
        print(f"Selected features: {pipeline.predictor.feature_columns}")
        
        # Now try with prediction data
        print("\n📂 Loading prediction data...")
        pred_df = pd.read_csv('data/to_predict/predict_2025_06_03.csv')
        print(f"Prediction data shape: {pred_df.shape}")
        print(f"Prediction columns: {list(pred_df.columns)}")
        
        # Process prediction data
        print("\n🔧 Processing prediction data...")
        processed_pred = pipeline.predictor.preprocess_data(pred_df, is_training=False)
        print(f"Processed prediction shape: {processed_pred.shape}")
        
        # Prepare prediction features
        print("\n🎯 Preparing prediction features...")
        X_pred = pipeline.predictor.prepare_features(processed_pred, is_training=False)
        print(f"Final prediction feature matrix shape: {X_pred.shape}")
        
        print("\n✅ Feature alignment successful!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error in debug analysis: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False


def simple_test_run():
    """Simple test run with minimal features"""
    
    print("🧪 SIMPLE TEST: Running with basic features only...")
    
    # Create a pipeline with minimal feature engineering
    preprocessing_config = OptimizedPreprocessingConfig(
        enable_advanced_features=False,
        enable_customer_history=False,
        enable_temporal_patterns=False,
        enable_address_parsing=False
    )
    
    model_config = OptimizedModelConfig(
        optimize_for_cost=True,
        enable_ensemble=False,
        enable_feature_selection=False
    )
    
    # Initialize predictor with minimal config
    predictor = OptimizedRTOPredictor(preprocessing_config, model_config)
    
    try:
        # Train with minimal features
        print("\n📚 Training with basic features...")
        training_df = pd.read_csv('data/to_train/training_data_2025_05_23.csv')
        training_results = predictor.train_model(training_df)
        print(f"✅ Training completed with {len(predictor.feature_columns)} features")
        
        # Predict with minimal features
        print("\n🔮 Predicting with basic features...")
        pred_df = pd.read_csv('data/to_predict/predict_2025_06_03.csv')
        prediction_results = predictor.predict(pred_df)
        print(f"✅ Predictions completed for {len(prediction_results['predictions'])} orders")
        
        # Print summary
        if 'summary' in prediction_results:
            summary = prediction_results['summary']
            print(f"\n📊 Prediction Summary:")
            print(f"  Total Orders: {summary['total_orders']}")
            print(f"  Predicted RTO: {summary['predicted_rto']} ({summary['predicted_rto_rate']:.2%})")
            print(f"  Average Risk Score: {summary['average_risk_score']:.3f}")
        
        print("\n✅ Simple test completed successfully!")
        
        return prediction_results
        
    except Exception as e:
        print(f"\n❌ Simple test failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return None


def minimal_feature_test():
    """Ultra minimal test with just basic columns"""
    
    print("🔬 MINIMAL TEST: Using only core features...")
    
    try:
        # Load data
        training_df = pd.read_csv('data/to_train/training_data_2025_05_23.csv')
        pred_df = pd.read_csv('data/to_predict/predict_2025_06_03.csv')
        
        print(f"Training columns: {list(training_df.columns)}")
        print(f"Prediction columns: {list(pred_df.columns)}")
        
        # Manually create minimal features
        def create_minimal_features(df, is_training=False):
            df = df.copy()
            
            # Basic numerical features
            for col in ['WEIGHT', 'QTY', 'INVOICE_VALUE']:
                if col not in df.columns:
                    df[col] = 1
                else:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(1)
            
            # Basic categorical encoding
            categorical_cols = ['COURIER_NAME', 'CUSTOMER_CITY', 'CUSTOMER_STATE', 'PAYMENT_MODE', 'ZONE']
            for col in categorical_cols:
                if col in df.columns:
                    # Simple label encoding
                    unique_vals = df[col].unique()
                    mapping = {val: i for i, val in enumerate(unique_vals)}
                    df[f'{col}_ENCODED'] = df[col].map(mapping).fillna(0)
                else:
                    df[f'{col}_ENCODED'] = 0
            
            # Basic derived features
            df['WEIGHT_PER_ITEM'] = df['WEIGHT'] / df['QTY'].replace(0, 1)
            df['VALUE_PER_ITEM'] = df['INVOICE_VALUE'] / df['QTY'].replace(0, 1)
            df['IS_COD'] = df['PAYMENT_MODE'].str.contains('COD', case=False, na=False).astype(int) if 'PAYMENT_MODE' in df.columns else 0
            
            # Zone risk
            zone_mapping = {'Within City': 1, 'Metro': 1, 'A': 2, 'Within Zone': 2, 'B': 3, 'Rest Of India': 4, 'ROI': 4}
            if 'ZONE' in df.columns:
                df['ZONE_RISK'] = df['ZONE'].map(zone_mapping).fillna(3)
            else:
                df['ZONE_RISK'] = 3
            
            # Target for training
            if is_training and 'CURRENT_STATUS' in df.columns:
                def create_target(status):
                    if pd.isna(status):
                        return 0
                    status = str(status).upper()
                    rto_patterns = ['RTO', 'RETURN', 'UNDELIVERABLE', 'UNDELIVERED']
                    return 1 if any(pattern in status for pattern in rto_patterns) else 0
                
                df['RTO_TARGET'] = df['CURRENT_STATUS'].apply(create_target)
            
            return df
        
        # Process data
        train_processed = create_minimal_features(training_df, is_training=True)
        pred_processed = create_minimal_features(pred_df, is_training=False)
        
        # Select features
        feature_cols = [
            'WEIGHT', 'QTY', 'INVOICE_VALUE', 'WEIGHT_PER_ITEM', 'VALUE_PER_ITEM',
            'IS_COD', 'ZONE_RISK', 'COURIER_NAME_ENCODED', 'CUSTOMER_CITY_ENCODED',
            'CUSTOMER_STATE_ENCODED', 'PAYMENT_MODE_ENCODED', 'ZONE_ENCODED'
        ]
        
        # Ensure all features exist in both datasets
        for col in feature_cols:
            if col not in train_processed.columns:
                train_processed[col] = 0
            if col not in pred_processed.columns:
                pred_processed[col] = 0
        
        X_train = train_processed[feature_cols].fillna(0)
        y_train = train_processed['RTO_TARGET'].values
        X_pred = pred_processed[feature_cols].fillna(0)
        
        print(f"Training features shape: {X_train.shape}")
        print(f"Prediction features shape: {X_pred.shape}")
        print(f"Target distribution: {np.bincount(y_train)}")
        
        # Simple model training
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split
        
        # Split for validation
        X_train_split, X_val, y_train_split, y_val = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train_split)
        X_val_scaled = scaler.transform(X_val)
        X_pred_scaled = scaler.transform(X_pred)
        
        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
        model.fit(X_train_scaled, y_train_split)
        
        # Validate
        val_auc = roc_auc_score(y_val, model.predict_proba(X_val_scaled)[:, 1])
        print(f"Validation AUC: {val_auc:.4f}")
        
        # Predict
        pred_proba = model.predict_proba(X_pred_scaled)[:, 1]
        pred_binary = (pred_proba > 0.5).astype(int)
        
        # Create results
        results = []
        for i, (prob, pred) in enumerate(zip(pred_proba, pred_binary)):
            results.append({
                'order_index': i,
                'order_number': str(pred_df.iloc[i].get('ORDER_NUMBER', f'ORDER_{i}')),
                'rto_prediction': bool(pred),
                'rto_probability': float(prob),
                'risk_level': 'High' if prob > 0.7 else 'Medium' if prob > 0.3 else 'Low'
            })
        
        summary = {
            'total_orders': len(results),
            'predicted_rto': int(pred_binary.sum()),
            'predicted_rto_rate': float(pred_binary.mean()),
            'average_risk_score': float(pred_proba.mean())
        }
        
        print(f"\n📊 Results:")
        print(f"  Total Orders: {summary['total_orders']}")
        print(f"  Predicted RTO: {summary['predicted_rto']} ({summary['predicted_rto_rate']:.2%})")
        print(f"  Average Risk Score: {summary['average_risk_score']:.3f}")
        
        return {
            'predictions': results,
            'summary': summary,
            'model_info': {'validation_auc': val_auc, 'features_used': feature_cols}
        }
        
    except Exception as e:
        print(f"\n❌ Minimal test failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return None


# Main execution function with optimizations
def main_optimized():
    """Main function demonstrating optimized pipeline usage"""
    
    print("🚀 Starting Optimized RTO Prediction Pipeline...")
    
    # First try minimal test to ensure basic functionality
    print("🔬 Trying minimal feature test first...")
    minimal_result = minimal_feature_test()
    
    if minimal_result:
        print("✅ Minimal test successful! This confirms your data works.")
        print("🚀 Now trying simple test with proper pipeline...")
        
        simple_result = simple_test_run()
        if simple_result:
            return simple_result
    
    print("🔧 Trying debug analysis...")
    debug_success = debug_data_and_features()
    
    if not debug_success:
        print("❌ All tests failed. Returning minimal result if available.")
        return minimal_result
    
    # Initialize optimized pipeline
    pipeline = OptimizedRTOPipelineManager()
    
    try:
        # Train optimized model
        print("\n📚 Training optimized model...")
        training_results = pipeline.train_optimized_model('data/to_train/training_data_2025_05_23.csv')
        
        # Make optimized predictions
        print("\n🔮 Making optimized predictions...")
        prediction_results = pipeline.predict_with_optimization('data/to_predict/predict_2025_06_03.csv')
        
        print("\n🎉 Optimized RTO Prediction Pipeline completed successfully!")
        validation_results = pipeline.validate_optimization_performance('data/to_predict/predict_2025_06_03.csv')
        
        return {
            'training_results': training_results,
            'prediction_results': prediction_results,
            'validation_results': validation_results
        }
        
    except Exception as e:
        logging.error(f"Optimized pipeline execution failed: {e}")
        print(f"❌ Pipeline failed: {e}")
        print("🔧 Returning best available result...")
        return simple_result or minimal_result


if __name__ == "__main__":
    main_optimized()