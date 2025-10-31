# rto_predictor/__init__.py
"""
Enhanced RTO (Return to Origin) Prediction Pipeline

A comprehensive machine learning pipeline for predicting return-to-origin (RTO) likelihood 
in e-commerce deliveries, featuring cost-sensitive learning, ensemble methods, and 
comprehensive reporting.

Key Features:
- Cost-sensitive machine learning with optimized business outcomes
- Advanced feature engineering with customer history and behavioral patterns
- Ensemble model training with automatic selection
- Comprehensive prediction validation and business impact analysis
- Production-grade monitoring, health checks, and fault tolerance
- Detailed courier and pincode performance analytics
- Configurable cost parameters and business rules
"""

__version__ = "2.0.0"
__author__ = "RTO Prediction Team"
__email__ = "team@rtoprediction.com"

from src.main import ProductionRTOPipelineManager, ProductionRTOPredictor
from src.pipeline.dataclass_configurations import PreprocessingConfig, ModelConfig, PipelineConfig
from src.core.exceptions import *

# Make key classes easily accessible
__all__ = [
    'ProductionRTOPipelineManager',
    'ProductionRTOPredictor',
    'PreprocessingConfig',
    'ModelConfig',
    'PipelineConfig'
]