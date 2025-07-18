"""
Training Management Module
Handles model training, retraining, and training-related operations
"""

import pandas as pd
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TrainingManager:
    """
    Handles all training-related operations including initial training and retraining
    """
    
    def __init__(self, predictor, config: Dict[str, Any]):
        self.predictor = predictor
        self.config = config
    
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
            
            return results
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            import traceback
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