"""
Configuration Management Module
Handles all configuration loading, merging, and validation
"""

import os
import json
from pathlib import Path
from typing import Dict
import logging

logger = logging.getLogger(__name__)


class ConfigurationManager:
    """
    Handles all configuration management operations including loading, merging, and validation
    """
    
    def __init__(self):
        pass
    
    def load_config(self, config_path: str) -> Dict:
        """Load configuration from file or use defaults"""
        
        default_config = {
            'data_dir': 'data',
            'model_dir': 'models',
            'output_dir': 'output',
            'log_dir': 'logs',
            'backup_dir': 'backups',
            'preprocessing': {
                'max_processing_time': 300,
                'batch_size': 10000,
                'memory_limit_mb': 2048,
                'required_columns': ['ORDER_NUMBER', 'CURRENT_STATUS', 'CUSTOMER_PHONE', 'CUSTOMER_ADDRESS', 'PAYMENT_MODE']
            },
            'model': {
                'retrain_threshold': 0.1,
                'min_training_samples': 100,
                'model_snapshot_retention_days': 30
            },
            'pipeline': {
                'enable_circuit_breaker': True,
                'circuit_breaker_threshold': 5,
                'circuit_breaker_timeout': 60
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                    # Deep merge configurations
                    for key, value in user_config.items():
                        if isinstance(value, dict) and key in default_config:
                            default_config[key].update(value)
                        else:
                            default_config[key] = value
            except Exception as e:
                logger.warning(f"Error loading config from {config_path}: {e}")
        
        return default_config
    
    def setup_directories(self, config: Dict):
        """Setup required directories"""
        for dir_name in ['data_dir', 'model_dir', 'output_dir', 'log_dir', 'backup_dir']:
            if dir_name in config:
                Path(config[dir_name]).mkdir(exist_ok=True)