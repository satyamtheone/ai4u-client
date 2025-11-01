"""
Service Container - Dependency Injection Container
Manages all service dependencies and lifecycle
"""

import logging
from pathlib import Path
from typing import Optional

from src.repositories.model_repository import ModelRepository
from src.services.training_service import TrainingService
from src.services.prediction_service import PredictionService
from src.services.analytics_service import AnalyticsService
from src.pipeline.dataclass_configurations import ModelConfig, PreprocessingConfig, PipelineConfig

logger = logging.getLogger(__name__)


class ServiceContainer:
    """
    Dependency Injection Container

    Centralized container for all services and dependencies
    Implements Service Locator and Dependency Injection patterns

    Benefits:
    - Single source of truth for dependencies
    - Easy to test (mock container)
    - Explicit dependency graph
    - Lifecycle management
    """

    def __init__(
        self,
        preprocessing_config: Optional[PreprocessingConfig] = None,
        model_config: Optional[ModelConfig] = None,
        pipeline_config: Optional[PipelineConfig] = None
    ):
        """
        Initialize service container with configurations

        Args:
            preprocessing_config: Preprocessing configuration
            model_config: Model training configuration
            pipeline_config: Pipeline configuration
        """
        logger.info("🏗️ Initializing ServiceContainer...")

        # Store configurations
        self.preprocessing_config = preprocessing_config or PreprocessingConfig()
        self.model_config = model_config or ModelConfig()
        self.pipeline_config = pipeline_config or PipelineConfig()

        # Initialize repositories (infrastructure layer)
        self._init_repositories()

        # Initialize services (business logic layer)
        self._init_services()

        logger.info("✅ ServiceContainer initialized with all services")

    def _init_repositories(self):
        """Initialize all repositories"""
        logger.info("📦 Initializing repositories...")

        # Model Repository
        self.model_repository = ModelRepository(
            model_dir=str(self.pipeline_config.model_dir)
        )

        logger.info("✓ Repositories initialized")

    def _init_services(self):
        """Initialize all services with dependency injection"""
        logger.info("🔧 Initializing services...")

        # Training Service (independent)
        self.training_service = TrainingService(
            model_repository=self.model_repository,
            preprocessing_config=self.preprocessing_config,
            model_config=self.model_config,
            pipeline_config=self.pipeline_config
        )

        # Prediction Service (independent)
        self.prediction_service = PredictionService(
            model_repository=self.model_repository,
            preprocessing_config=self.preprocessing_config,
            auto_load_model=True  # Auto-load on init
        )

        # Analytics Service (independent)
        self.analytics_service = AnalyticsService(
            data_dir=str(self.pipeline_config.data_dir)
        )

        logger.info("✓ Services initialized")

    def get_training_service(self) -> TrainingService:
        """
        Get Training Service instance

        Returns:
            TrainingService instance
        """
        return self.training_service

    def get_prediction_service(self) -> PredictionService:
        """
        Get Prediction Service instance

        Returns:
            PredictionService instance
        """
        return self.prediction_service

    def get_analytics_service(self) -> AnalyticsService:
        """
        Get Analytics Service instance

        Returns:
            AnalyticsService instance
        """
        return self.analytics_service

    def get_model_repository(self) -> ModelRepository:
        """
        Get Model Repository instance

        Returns:
            ModelRepository instance
        """
        return self.model_repository

    def reload_services(self):
        """
        Reload all services

        Useful after configuration changes
        """
        logger.info("🔄 Reloading services...")
        self._init_repositories()
        self._init_services()
        logger.info("✅ Services reloaded")

    def get_service_status(self) -> dict:
        """
        Get status of all services

        Returns:
            Dictionary with service statuses
        """
        return {
            'training_service': self.training_service.get_training_info(),
            'prediction_service': self.prediction_service.get_model_info(),
            'analytics_service': self.analytics_service.get_analytics_info(),
            'model_repository': {
                'status': 'ready',
                'models_available': len(self.model_repository.list_models()),
                'latest_version': self.model_repository.get_latest_version()
            }
        }


# Global container instance (singleton pattern)
_container_instance: Optional[ServiceContainer] = None


def get_container(
    preprocessing_config: Optional[PreprocessingConfig] = None,
    model_config: Optional[ModelConfig] = None,
    pipeline_config: Optional[PipelineConfig] = None
) -> ServiceContainer:
    """
    Get or create global service container instance

    Implements Singleton pattern for container

    Args:
        preprocessing_config: Preprocessing configuration
        model_config: Model configuration
        pipeline_config: Pipeline configuration

    Returns:
        ServiceContainer instance
    """
    global _container_instance

    if _container_instance is None:
        _container_instance = ServiceContainer(
            preprocessing_config=preprocessing_config,
            model_config=model_config,
            pipeline_config=pipeline_config
        )

    return _container_instance


def reset_container():
    """
    Reset global container instance

    Useful for testing
    """
    global _container_instance
    _container_instance = None
    logger.info("🔄 Container reset")
