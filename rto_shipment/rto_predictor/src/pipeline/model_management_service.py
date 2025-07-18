"""
Model Management Service Module
Handles model loading, validation, and management operations
"""

import logging

logger = logging.getLogger(__name__)


class ModelNotFoundError(Exception):
    """Custom exception for model not found errors"""
    pass


class ModelManagementService:
    """
    Handles all model management operations including loading and validation
    """
    
    def __init__(self, predictor):
        self.predictor = predictor
    
    def ensure_model_loaded(self):
        """Load latest model if not already loaded"""
        if self.predictor.model is None:
            try:
                self.predictor.load_model_snapshot()
                logger.info("Loaded latest model snapshot")
            except Exception as e:
                logger.error(f"No trained model found: {e}")
                raise ModelNotFoundError("No trained model available. Please train the model first.")
    
    def is_model_loaded(self) -> bool:
        """Check if model is currently loaded"""
        return self.predictor.model is not None