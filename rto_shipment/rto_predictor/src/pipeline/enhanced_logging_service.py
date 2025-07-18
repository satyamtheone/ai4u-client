"""
Enhanced Logging Service Module
Handles production-grade logging with multiple handlers and specialized loggers
"""

import os
import logging
from pathlib import Path
from datetime import datetime


class EnhancedLoggingService:
    """
    Production-grade logging service with multiple specialized loggers
    """
    
    def __init__(self):
        self.loggers = {}
    
    def setup_production_logging(self, log_dir: str = "logs"):
        """Setup production-grade logging"""
        Path(log_dir).mkdir(exist_ok=True)
        
        # Configure root logger
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]',
            handlers=[
                logging.FileHandler(Path(log_dir) / 'rto_pipeline.log'),
                logging.FileHandler(Path(log_dir) / f'rto_pipeline_{datetime.now().strftime("%Y%m%d")}.log'),
                logging.StreamHandler()
            ]
        )
        
        # Create separate loggers for different components
        self._setup_specialized_loggers(log_dir)
        
        return logging.getLogger(__name__)
    
    def _setup_specialized_loggers(self, log_dir: str):
        """Setup specialized loggers for different components"""
        # Error logger
        error_logger = logging.getLogger('error')
        error_handler = logging.FileHandler(Path(log_dir) / 'errors.log')
        error_handler.setLevel(logging.ERROR)
        error_logger.addHandler(error_handler)
        self.loggers['error'] = error_logger
        
        # Performance logger
        performance_logger = logging.getLogger('performance')
        perf_handler = logging.FileHandler(Path(log_dir) / 'performance.log')
        performance_logger.addHandler(perf_handler)
        self.loggers['performance'] = performance_logger
        
        # Business logger (for business metrics and insights)
        business_logger = logging.getLogger('business')
        business_handler = logging.FileHandler(Path(log_dir) / 'business.log')
        business_logger.addHandler(business_handler)
        self.loggers['business'] = business_logger
        
        # Security logger (for access and security events)
        security_logger = logging.getLogger('security')
        security_handler = logging.FileHandler(Path(log_dir) / 'security.log')
        security_logger.addHandler(security_handler)
        self.loggers['security'] = security_logger
    
    def get_logger(self, logger_name: str = 'default'):
        """Get a specific logger by name"""
        if logger_name in self.loggers:
            return self.loggers[logger_name]
        return logging.getLogger(logger_name)
    
    def log_error(self, message: str, exception: Exception = None):
        """Log error with optional exception details"""
        error_logger = self.get_logger('error')
        if exception:
            error_logger.error(f"{message}: {exception}", exc_info=True)
        else:
            error_logger.error(message)
    
    def log_performance(self, operation: str, duration: float, additional_info: dict = None):
        """Log performance metrics"""
        perf_logger = self.get_logger('performance')
        log_message = f"Operation: {operation}, Duration: {duration:.2f}s"
        if additional_info:
            log_message += f", Additional: {additional_info}"
        perf_logger.info(log_message)
    
    def log_business_event(self, event_type: str, details: dict):
        """Log business events and metrics"""
        business_logger = self.get_logger('business')
        business_logger.info(f"Event: {event_type}, Details: {details}")
    
    def log_security_event(self, event_type: str, details: dict):
        """Log security-related events"""
        security_logger = self.get_logger('security')
        security_logger.warning(f"Security Event: {event_type}, Details: {details}")