"""
Model Training and Management Module
Handles all ML model training, evaluation, and management operations
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, classification_report
from datetime import datetime
import joblib
import json
import logging
import time
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)


class ModelNotFoundError(Exception):
    """Custom exception for model not found errors"""
    pass


class ModelTrainer:
    """
    Handles all ML model training, evaluation, and management operations
    """
    
    def __init__(self, model_config, pipeline_config):
        self.model_config = model_config
        self.pipeline_config = pipeline_config
        self.model = None
        self.scaler = None
        self.feature_columns = None
        self.last_training_score = None
        self.model_version = None
    
    def check_class_balance(self, df, target_col='RTO_TARGET'):
        """Check and report class balance"""
        try:
            value_counts = df[target_col].value_counts()
            total = value_counts.sum()
            print("📊 Class Distribution:")
            for cls, count in value_counts.items():
                pct = count / total * 100
                label = "RTO" if cls == 1 else "Delivered"
                print(f"  {label} ({cls}): {count} ({pct:.2f}%)")
        except Exception as e:
            logger.error(f"Error checking class balance: {e}")
    
    def train_model_internal(self, X, y, feature_columns) -> dict:
        """Internal training method"""
        
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
        self.feature_columns = feature_columns
        
        logger.info("Model training completed successfully")
        
        return {
            'best_model': type(best_model).__name__,
            'best_score': best_score,
            'model_results': model_results,
            'feature_importance': self.get_feature_importance(),
            'training_timestamp': datetime.now().isoformat()
        }
    
    def predict_internal(self, X):
        """Internal prediction method"""
        if self.model is None:
            raise ModelNotFoundError("Model not trained. Please train the model first.")
        
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        
        return predictions, probabilities
    
    def get_feature_importance(self) -> dict:
        """Get feature importance from the trained model"""
        
        if self.model is None or self.feature_columns is None:
            return {}
        
        try:
            if hasattr(self.model, 'feature_importances_'):
                importances = self.model.feature_importances_
            elif hasattr(self.model, 'coef_'):
                importances = np.abs(self.model.coef_[0])
            else:
                return {}
            
            feature_importance = dict(zip(self.feature_columns, importances))
            # Sort by importance
            feature_importance = dict(sorted(feature_importance.items(), 
                                           key=lambda x: x[1], reverse=True))
            
            return feature_importance
            
        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return {}
    
    def save_model_snapshot(self):
        """Save model snapshot with timestamp and versioning"""
        
        timestamp = datetime.now().strftime("%Y_%m_%d_%H")
        snapshot_dir = Path(self.pipeline_config.model_dir) / timestamp
        snapshot_dir.mkdir(exist_ok=True)
        
        try:
            # Save model and preprocessors
            joblib.dump(self.model, snapshot_dir / "model.pkl")
            joblib.dump(self.scaler, snapshot_dir / "scaler.pkl")
            joblib.dump(self.feature_columns, snapshot_dir / "feature_columns.pkl")
            
            # Save configuration
            config_data = {
                'model_config': {
                    'retrain_threshold': self.model_config.retrain_threshold,
                    'min_training_samples': self.model_config.min_training_samples
                },
                'model_version': timestamp
            }
            
            with open(snapshot_dir / "config.json", 'w') as f:
                json.dump(config_data, f, indent=2)
            
            # Create symlink to latest
            latest_link = Path(self.pipeline_config.model_dir) / "latest"
            if latest_link.exists():
                latest_link.unlink()
            latest_link.symlink_to(snapshot_dir)
            
            # Store model version
            self.model_version = timestamp
            
            logger.info(f"Model snapshot saved to {snapshot_dir}")
            
            # Cleanup old snapshots
            self.cleanup_old_snapshots()
            
        except Exception as e:
            logger.error(f"Error saving model snapshot: {e}")
    
    def cleanup_old_snapshots(self):
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
            self.scaler = joblib.load(snapshot_dir / "scaler.pkl")
            self.feature_columns = joblib.load(snapshot_dir / "feature_columns.pkl")
            
            # Load configuration if available
            config_file = snapshot_dir / "config.json"
            if config_file.exists():
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
                    self.model_version = config_data.get('model_version', 'unknown')
            
            logger.info(f"Model snapshot loaded from {snapshot_dir}")
            
        except Exception as e:
            logger.error(f"Error loading model snapshot: {e}")
            raise ModelNotFoundError(f"Failed to load model: {e}")
    
    def retrain_with_new_data(self, X_new, y_new, retrain_threshold: float = None):
        """
        Retrain model with new data if performance degradation is detected
        """
        if retrain_threshold is None:
            retrain_threshold = self.model_config.retrain_threshold
            
        logger.info("Checking if retraining is needed...")
        
        if self.model is None:
            logger.info("No existing model found. Training from scratch...")
            return True  # Signal that retraining is needed
        
        try:
            if len(X_new) > 0:
                X_new_scaled = self.scaler.transform(X_new)
                current_score = roc_auc_score(y_new, self.model.predict_proba(X_new_scaled)[:, 1])
                
                # If performance degradation exceeds threshold, retrain
                baseline_score = getattr(self, 'last_training_score', 0.8)
                performance_drop = baseline_score - current_score
                
                logger.info(f"Performance check: baseline={baseline_score:.4f}, current={current_score:.4f}, drop={performance_drop:.4f}")
                
                if performance_drop > retrain_threshold:
                    logger.info(f"Performance degraded beyond threshold ({retrain_threshold}). Retraining needed...")
                    return True
                else:
                    logger.info(f"Performance acceptable. No retraining needed.")
                    return False
            
            return False
            
        except Exception as e:
            logger.error(f"Error in retrain evaluation: {e}")
            return False