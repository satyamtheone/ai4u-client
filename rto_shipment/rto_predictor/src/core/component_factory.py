"""
Component Factory Module
Handles creation and initialization of all modular components
"""

from typing import Dict
import logging

logger = logging.getLogger(__name__)


class ComponentFactory:
    """
    Factory class for creating and initializing all modular components
    """
    
    def __init__(self):
        pass
    
    def create_all_components(self, predictor, config: Dict):
        """Create and initialize all modular components"""
        # Import here to avoid circular imports
        from src.pipeline.file_processing_module import FileProcessor
        from src.pipeline.validation_analytics_module import ValidationAnalytics
        from src.pipeline.results_enhancement_module import ResultsEnhancer
        from src.pipeline.training_management_module import TrainingManager
        from src.pipeline.reporting_module import ReportingManager
        from src.pipeline.output_management_module import OutputManager
        
        components = {
            'file_processor': FileProcessor(config),
            'validation_analytics': ValidationAnalytics(predictor),
            'results_enhancer': ResultsEnhancer(),
            'training_manager': TrainingManager(predictor, config),
            'reporting_manager': ReportingManager(predictor, predictor.metrics_collector, config),
            'output_manager': OutputManager(config)
        }
        
        logger.info("All modular components initialized successfully")
        return components