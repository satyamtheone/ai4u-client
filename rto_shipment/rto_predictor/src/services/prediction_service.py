"""
Prediction Service - Independent Prediction Operations
No dependencies on Training or Analytics services
"""

import pandas as pd
import numpy as np
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from src.repositories.model_repository import ModelRepository
from src.pipeline.data_preprocessing_module import DataPreprocessor
from src.pipeline.prediction_module import PredictionAnalyzer
from src.pipeline.dataclass_configurations import PreprocessingConfig
from src.core.exceptions import *

logger = logging.getLogger(__name__)


class PredictionService:
    """
    Independent Prediction Service

    Responsibilities:
    - Load trained models
    - Make predictions on new data
    - Analyze prediction results

    NO dependencies on:
    - TrainingService
    - AnalyticsService
    """

    def __init__(
        self,
        model_repository: ModelRepository,
        preprocessing_config: Optional[PreprocessingConfig] = None,
        auto_load_model: bool = True
    ):
        """
        Initialize prediction service with dependency injection

        Args:
            model_repository: Repository for model access
            preprocessing_config: Preprocessing configuration
            auto_load_model: Whether to auto-load latest model on init
        """
        self.model_repo = model_repository
        self.preprocessing_config = preprocessing_config or PreprocessingConfig()

        # Initialize prediction-specific components only
        self.data_preprocessor = DataPreprocessor(self.preprocessing_config)
        self.prediction_analyzer = PredictionAnalyzer()

        # Model artifacts (loaded on demand)
        self.model = None
        self.scaler = None
        self.feature_columns = None
        self.model_metadata = None

        # Auto-load latest model if available
        if auto_load_model:
            try:
                self.load_model()
            except Exception as e:
                logger.warning(f"⚠️ Could not auto-load model: {e}")

        logger.info("✓ PredictionService initialized (independent)")

    def load_model(self, version: str = "latest") -> None:
        """
        Load model from repository

        Args:
            version: Model version to load (default: "latest")

        Raises:
            ModelNotFoundError: If model doesn't exist
        """
        try:
            logger.info(f"📥 Loading model version: {version}")

            # Load from repository
            model, scaler, feature_columns, label_encoders, metadata = self.model_repo.load_model(version)

            # Store artifacts
            self.model = model
            self.scaler = scaler
            self.feature_columns = feature_columns
            self.model_metadata = metadata

            # Restore label encoders to preprocessor
            if label_encoders:
                self.data_preprocessor.label_encoders = label_encoders
                logger.info(f"✓ Restored {len(label_encoders)} label encoders")

            logger.info(f"✅ Model loaded: {metadata.model_type} (accuracy: {metadata.accuracy:.4f})")

        except FileNotFoundError as e:
            raise ModelNotFoundError(f"Model not found: {str(e)}") from e
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            raise ModelNotFoundError(f"Failed to load model: {str(e)}") from e

    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Make predictions on DataFrame

        Args:
            df: DataFrame with order data

        Returns:
            Prediction results with probabilities and risk levels

        Raises:
            ModelNotFoundError: If no model is loaded
            PredictionError: If prediction fails
        """
        if self.model is None:
            raise ModelNotFoundError("No model loaded. Call load_model() first or train a model.")

        logger.info(f"🔮 Making predictions for {len(df)} orders")
        start_time = datetime.now()

        try:
            # Step 1: Preprocess data
            processed_df = self._preprocess_prediction_data(df)

            # Step 2: Prepare features
            X = processed_df[self.feature_columns].values

            # Step 3: Scale features
            X_scaled = self.scaler.transform(X)

            # Step 4: Make predictions
            predictions = self.model.predict(X_scaled)
            probabilities = self.model.predict_proba(X_scaled)[:, 1]

            # Step 5: Process predictions (generate explanations, recommendations, etc.)
            prediction_details = self.prediction_analyzer.process_predictions(
                df,
                predictions,
                probabilities
            )

            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            logger.info(f"✅ Predictions complete ({processing_time:.1f}ms)")

            return {
                'success': True,
                'predictions': prediction_details,
                'prediction_count': len(predictions),
                'high_risk_count': int((probabilities > 0.7).sum()),
                'processing_time_ms': processing_time,
                'model_version': self.model_metadata.version if self.model_metadata else 'unknown',
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Prediction failed: {e}")
            raise PredictionError(f"Prediction failed: {str(e)}") from e

    def predict_single(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make prediction for a single order

        Args:
            order_data: Dictionary with order data

        Returns:
            Prediction result for single order
        """
        try:
            # Convert to DataFrame
            df = pd.DataFrame([order_data])

            # Get predictions
            result = self.predict(df)

            # Extract single prediction (predictions is a list of detailed prediction dicts)
            single_prediction = result['predictions'][0] if result['predictions'] else {}

            # Return formatted single prediction
            return {
                **single_prediction,  # Include all details from PredictionAnalyzer
                'processing_time_ms': result['processing_time_ms'],
                'model_version': result['model_version'],
                'timestamp': result['timestamp']
            }

        except Exception as e:
            logger.error(f"❌ Single prediction failed: {e}")
            raise PredictionError(f"Single prediction failed: {str(e)}") from e

    def predict_batch(self, orders: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Make predictions for batch of orders

        Args:
            orders: List of order dictionaries

        Returns:
            Batch prediction results
        """
        try:
            # Convert to DataFrame
            df = pd.DataFrame(orders)

            # Get predictions
            result = self.predict(df)

            # Format batch results
            predictions_list = []
            for i, order in enumerate(orders):
                predictions_list.append(result['predictions'][i])
            print("result['predictions']", result)
            return {
                'success': True,
                'predictions': predictions_list,
                'total_orders': len(orders),
                'successful_predictions': len(predictions_list),
                'summary': {
                    'total_orders': len(orders),
                    'high_risk_count': result['high_risk_count'],
                    'processing_time_ms': result['processing_time_ms']
                },
                'model_version': result['model_version'],
                'timestamp': result['timestamp']
            }

        except Exception as e:
            logger.error(f"❌ Batch prediction failed: {e}")
            raise PredictionError(f"Batch prediction failed: {str(e)}") from e

    def _preprocess_prediction_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess prediction data - Complete preprocessing pipeline

        Args:
            df: Raw prediction data

        Returns:
            Preprocessed DataFrame
        """
        try:
            # Step 1: Handle missing values first
            df = self.data_preprocessor.handle_missing_values(df)

            # Step 2: Clean text fields
            df = self.data_preprocessor.clean_text_fields(df)

            # Step 3: Process phone numbers (creates PHONE_LENGTH, PHONE_VALID, etc.)
            df = self.data_preprocessor.process_phone_numbers(df)

            # Step 4: Process addresses (creates ADDRESS_LENGTH, ADDRESS_WORD_COUNT, ADDRESS_RISK_KEYWORDS)
            df = self.data_preprocessor.process_addresses(df)

            # Step 5: Create customer features
            df = self.data_preprocessor.create_customer_features(df)

            # Step 6: Create all other features (temporal, geographic, etc.)
            df = self.data_preprocessor.create_features(df)

            # Step 7: Encode categorical variables (using existing encoders)
            df = self.data_preprocessor.encode_categorical(df, is_training=False)

            # Step 8: Handle any remaining missing values after feature creation
            df = df.fillna(0)

            logger.info(f"✓ Preprocessing completed: {df.shape[0]} rows, {df.shape[1]} features")
            return df

        except Exception as e:
            logger.error(f"❌ Preprocessing failed: {e}")
            raise PredictionError(f"Data preprocessing failed: {str(e)}") from e

    def _get_risk_level(self, probability: float) -> str:
        """
        Determine risk level from probability

        Args:
            probability: RTO probability (0-1)

        Returns:
            Risk level string
        """
        if probability >= 0.8:
            return "Critical"
        elif probability >= 0.6:
            return "High"
        elif probability >= 0.4:
            return "Medium"
        else:
            return "Low"

    def _get_recommendations(self, probability: float) -> List[str]:
        """
        Get recommendations based on RTO probability

        Args:
            probability: RTO probability (0-1)

        Returns:
            List of recommendation strings
        """
        recommendations = []

        if probability >= 0.7:
            recommendations.extend([
                "High RTO risk - Consider customer verification call",
                "Request prepayment or reduce COD eligibility",
                "Use premium courier service",
                "Schedule delivery confirmation"
            ])
        elif probability >= 0.5:
            recommendations.extend([
                "Moderate RTO risk - Send delivery confirmation SMS",
                "Consider address verification",
                "Monitor delivery status closely"
            ])
        elif probability >= 0.3:
            recommendations.append("Low-moderate risk - Standard delivery procedures")
        else:
            recommendations.append("Low risk - Proceed with standard delivery")

        return recommendations

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about currently loaded model

        Returns:
            Model information dictionary
        """
        if self.model is None:
            return {
                'status': 'no_model_loaded',
                'message': 'No model is currently loaded'
            }

        return {
            'status': 'ready',
            'model_loaded': True,
            'version': self.model_metadata.version if self.model_metadata else 'unknown',
            'model_type': self.model_metadata.model_type if self.model_metadata else 'unknown',
            'accuracy': self.model_metadata.accuracy if self.model_metadata else 0.0,
            'feature_count': len(self.feature_columns) if self.feature_columns else 0,
            'created_at': self.model_metadata.created_at if self.model_metadata else 'unknown'
        }

    def is_model_loaded(self) -> bool:
        """
        Check if a model is currently loaded

        Returns:
            True if model is loaded, False otherwise
        """
        return self.model is not None
