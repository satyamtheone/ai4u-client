"""
Training Service - Independent Model Training
No dependencies on Prediction or Analytics services
"""

import pandas as pd
import numpy as np
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

from src.repositories.model_repository import ModelRepository
from src.pipeline.data_preprocessing_module import DataPreprocessor
from src.pipeline.model_training_module import ModelTrainer
from src.pipeline.data_validation_module import DataValidator
from src.pipeline.dataclass_configurations import ModelConfig, PreprocessingConfig, PipelineConfig
from src.core.exceptions import *

logger = logging.getLogger(__name__)


class TrainingService:
    """
    Independent Training Service

    Responsibilities:
    - Validate and preprocess training data
    - Train ML models
    - Save trained models via repository

    NO dependencies on:
    - PredictionService
    - AnalyticsService
    """

    def __init__(
        self,
        model_repository: ModelRepository,
        preprocessing_config: Optional[PreprocessingConfig] = None,
        model_config: Optional[ModelConfig] = None,
        pipeline_config: Optional[PipelineConfig] = None
    ):
        """
        Initialize training service with dependency injection

        Args:
            model_repository: Repository for model persistence
            preprocessing_config: Preprocessing configuration
            model_config: Model training configuration
            pipeline_config: Pipeline configuration
        """
        self.model_repo = model_repository
        self.preprocessing_config = preprocessing_config or PreprocessingConfig()
        self.model_config = model_config or ModelConfig()
        self.pipeline_config = pipeline_config or PipelineConfig()

        # Initialize training-specific components only
        self.data_validator = DataValidator(self.preprocessing_config)
        self.data_preprocessor = DataPreprocessor(self.preprocessing_config)
        self.model_trainer = ModelTrainer(self.model_config, self.pipeline_config)

        logger.info("✓ TrainingService initialized (independent)")

    def train_from_dataframe(self, df: pd.DataFrame, description: str = None) -> Dict[str, Any]:
        """
        Train model from pandas DataFrame

        Args:
            df: Training data with RTO_STATUS column
            description: Optional description for this training run

        Returns:
            Training results with metrics

        Raises:
            DataValidationError: If data validation fails
            TrainingError: If model training fails
        """
        logger.info(f"🚀 Starting training with {len(df)} records")

        try:
            # Step 1: Validate input data
            validation_result = self.data_validator.validate_data(df, is_training=True)
            if not validation_result['valid']:
                raise DataValidationError(f"Validation failed: {validation_result['errors']}")

            # Step 2: Check for required RTO_STATUS column
            if 'RTO_STATUS' not in df.columns:
                raise DataValidationError("Training data must contain RTO_STATUS column")

            # Step 3: Preprocess data
            logger.info("📊 Preprocessing training data...")
            processed_df = self._preprocess_training_data(df)

            # Step 4: Log class balance
            self._log_class_balance(processed_df)

            # Step 5: Prepare features and target
            feature_columns = [col for col in processed_df.columns if col != 'RTO_TARGET']
            X = processed_df[feature_columns].values
            y = processed_df['RTO_TARGET'].values

            logger.info(f"📈 Training with {len(feature_columns)} features")

            # Step 6: Train model
            training_result = self.model_trainer.train_model_internal(X, y, feature_columns)

            # Step 7: Save model via repository
            model_version = self.model_repo.save_model(
                model=self.model_trainer.model,
                scaler=self.model_trainer.scaler,
                feature_columns=feature_columns,
                label_encoders=self.data_preprocessor.label_encoders,
                metadata={
                    'model_type': training_result.get('best_model', 'Unknown'),
                    'accuracy': training_result.get('best_score', 0.0),
                    'training_samples': len(df),
                    'description': description
                }
            )

            logger.info(f"✅ Training completed. Best model: {training_result.get('best_model')}")

            return {
                'success': True,
                'model': training_result.get('best_model'),
                'best_model': training_result.get('best_model'),
                'best_score': training_result.get('best_score'),
                'accuracy': training_result.get('best_score'),
                'training_samples': len(df),
                'model_version': model_version,
                'timestamp': datetime.now().isoformat(),
                'feature_importance': training_result.get('feature_importance', {}),
                'model_results': training_result.get('model_results', {}),
                'description': description
            }

        except (DataValidationError, TrainingError) as e:
            logger.error(f"❌ Training failed: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error during training: {e}")
            raise TrainingError(f"Model training failed: {str(e)}") from e

    def train_from_csv(self, csv_path: str, description: str = None) -> Dict[str, Any]:
        """
        Train model from CSV file

        Args:
            csv_path: Path to CSV file with training data
            description: Optional description for this training run

        Returns:
            Training results

        Raises:
            DataValidationError: If CSV loading or validation fails
        """
        logger.info(f"📂 Loading training data from {csv_path}")

        try:
            df = pd.read_csv(csv_path)
            return self.train_from_dataframe(df, description)
        except FileNotFoundError as e:
            raise DataValidationError(f"CSV file not found: {csv_path}") from e
        except pd.errors.EmptyDataError as e:
            raise DataValidationError(f"CSV file is empty: {csv_path}") from e
        except Exception as e:
            logger.error(f"❌ Failed to load CSV: {e}")
            raise DataValidationError(f"Failed to load training data: {str(e)}") from e

    def _preprocess_training_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess training data - Complete preprocessing pipeline

        Args:
            df: Raw training data

        Returns:
            Preprocessed DataFrame with features
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

            # Step 7: Encode categorical variables (create new encoders for training)
            df = self.data_preprocessor.encode_categorical(df, is_training=True)

            # Step 8: Handle any remaining missing values after feature creation
            df = df.fillna(0)

            logger.info(f"✓ Training data preprocessing completed: {df.shape[0]} rows, {df.shape[1]} features")
            return df

        except Exception as e:
            logger.error(f"❌ Preprocessing failed: {e}")
            raise DataValidationError(f"Data preprocessing failed: {str(e)}") from e

    def _log_class_balance(self, df: pd.DataFrame, target_col: str = 'RTO_TARGET'):
        """
        Log class distribution for monitoring

        Args:
            df: Preprocessed DataFrame
            target_col: Target column name
        """
        try:
            value_counts = df[target_col].value_counts()
            total = value_counts.sum()

            logger.info("📊 Class Distribution:")
            for cls, count in value_counts.items():
                pct = count / total * 100
                label = "RTO" if cls == 1 else "Delivered"
                logger.info(f"   {label} ({cls}): {count} ({pct:.2f}%)")

        except Exception as e:
            logger.warning(f"⚠️ Could not log class balance: {e}")

    def validate_training_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate training data without actually training

        Args:
            df: Training data to validate

        Returns:
            Validation result dictionary
        """
        try:
            validation_result = self.data_validator.validate_data(df, is_training=True)

            # Add additional checks
            checks = {
                'has_rto_status': 'RTO_STATUS' in df.columns,
                'row_count': len(df),
                'meets_minimum': len(df) >= self.model_config.min_training_samples,
                'columns': list(df.columns)
            }

            return {
                **validation_result,
                **checks
            }

        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            return {
                'valid': False,
                'errors': [str(e)]
            }

    def get_training_info(self) -> Dict[str, Any]:
        """
        Get information about training service configuration

        Returns:
            Service configuration and status
        """
        return {
            'service': 'TrainingService',
            'status': 'ready',
            'min_training_samples': self.model_config.min_training_samples,
            'cross_validation_folds': self.model_config.cross_validation_folds,
            'retrain_threshold': self.model_config.retrain_threshold,
            'models_available': len(self.model_repo.list_models())
        }
