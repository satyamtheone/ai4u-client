"""
Error Handling Manager Module
Handles error management, logging, and recovery operations
"""

import traceback
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class ErrorHandlingManager:
    """
    Handles all error management, logging, and recovery operations
    """
    
    def __init__(self, metrics_collector=None):
        self.metrics_collector = metrics_collector
    
    def handle_processing_error(self, error: Exception, operation: str = "processing") -> Dict[str, Any]:
        """
        Handle processing errors with proper logging and metrics
        
        Args:
            error: The exception that occurred
            operation: Description of the operation that failed
            
        Returns:
            Error result dictionary
        """
        logger.error(f"Error in {operation}: {error}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Log error metrics
        if self.metrics_collector:
            self.metrics_collector.record_metric(f'{operation}_errors', 1)
        
        # Return structured error result
        return {
            'error': str(error),
            'operation': operation,
            'predictions': [],
            'summary': {'total_orders': 0, 'error': str(error)},
            'processing_timestamp': datetime.now().isoformat(),
            'error_type': type(error).__name__
        }
    
    def log_operation_start(self, operation: str, details: str = ""):
        """Log the start of an operation"""
        logger.info(f"Starting {operation}{': ' + details if details else ''}")
    
    def log_operation_success(self, operation: str, details: str = ""):
        """Log successful completion of an operation"""
        logger.info(f"Successfully completed {operation}{': ' + details if details else ''}")
    
    def log_operation_warning(self, operation: str, warning: str):
        """Log a warning during an operation"""
        logger.warning(f"Warning in {operation}: {warning}")