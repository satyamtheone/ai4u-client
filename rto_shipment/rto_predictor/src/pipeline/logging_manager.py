"""
Logging Management Module
Handles all logging setup and configuration
"""

import os
import logging
import time


class LoggingManager:
    """
    Handles all logging operations including setup and configuration
    """
    
    def __init__(self):
        pass
    
    def setup_production_logging(self, log_dir: str):
        """Setup production logging configuration"""
        os.makedirs(log_dir, exist_ok=True)
        
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        logging.basicConfig(
            level=logging.INFO,
            format=log_format,
            handlers=[
                logging.FileHandler(os.path.join(log_dir, 'pipeline.log')),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)


def monitor_performance(func):
    """Performance monitoring decorator"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logging.getLogger(__name__).info(f"Function {func.__name__} executed in {execution_time:.2f} seconds")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logging.getLogger(__name__).error(f"Function {func.__name__} failed after {execution_time:.2f} seconds: {e}")
            raise
    return wrapper