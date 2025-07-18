"""
Configuration Dataclasses Module
Centralized configuration management with dataclasses
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class PreprocessingConfig:
    max_processing_time: int = 300  # 5 minutes timeout
    batch_size: int = 10000
    memory_limit_mb: int = 2048
    required_columns: List[str] = field(default_factory=lambda: [
        'ORDER_NUMBER', 'CURRENT_STATUS', 'CUSTOMER_PHONE', 
        'CUSTOMER_ADDRESS', 'PAYMENT_MODE'
    ])
    fallback_values: Dict[str, Any] = field(default_factory=dict)
    max_retries: int = 3
    enable_monitoring: bool = True


@dataclass
class ModelConfig:
    retrain_threshold: float = 0.1
    min_training_samples: int = 100
    model_snapshot_retention_days: int = 30
    enable_auto_retrain: bool = True
    cross_validation_folds: int = 5


@dataclass
class PipelineConfig:
    data_dir: str = 'data'
    model_dir: str = 'models'
    output_dir: str = 'output'
    log_dir: str = 'logs'
    backup_dir: str = 'backups'
    enable_circuit_breaker: bool = True
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: int = 60