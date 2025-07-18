"""
Fault Tolerance Management Module
Handles circuit breakers, timeouts, retries, and service availability
"""

import time
import threading
import functools
from typing import Any
import logging

logger = logging.getLogger(__name__)


class RTOPipelineError(Exception):
    """Base exception for RTO Pipeline"""
    pass


class ProcessingTimeoutError(RTOPipelineError):
    """Processing timeout exceeded"""
    pass


class ServiceUnavailableError(RTOPipelineError):
    """Service is temporarily unavailable"""
    pass


class CircuitBreaker:
    """Circuit breaker for fault tolerance"""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.lock = threading.Lock()
    
    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        with self.lock:
            if self.state == "OPEN":
                if time.time() - self.last_failure_time > self.timeout:
                    self.state = "HALF_OPEN"
                else:
                    raise ServiceUnavailableError("Service is temporarily unavailable")
        
        try:
            result = func(*args, **kwargs)
            with self.lock:
                if self.state == "HALF_OPEN":
                    self.state = "CLOSED"
                    self.failure_count = 0
            return result
        except Exception as e:
            with self.lock:
                self.failure_count += 1
                self.last_failure_time = time.time()
                if self.failure_count >= self.failure_threshold:
                    self.state = "OPEN"
            raise


class FaultToleranceDecorators:
    """
    Container for fault tolerance decorators
    """
    
    @staticmethod
    def timeout_handler(timeout_seconds: int):
        """Decorator to add timeout protection"""
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                result = [None]
                exception = [None]
                
                def target():
                    try:
                        result[0] = func(*args, **kwargs)
                    except Exception as e:
                        exception[0] = e
                
                thread = threading.Thread(target=target)
                thread.daemon = True
                thread.start()
                thread.join(timeout_seconds)
                
                if thread.is_alive():
                    raise ProcessingTimeoutError(f"Function {func.__name__} timed out after {timeout_seconds} seconds")
                
                if exception[0]:
                    raise exception[0]
                
                return result[0]
            return wrapper
        return decorator

    @staticmethod
    def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
        """Decorator to retry on failure"""
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                last_exception = None
                
                for attempt in range(max_retries):
                    try:
                        return func(*args, **kwargs)
                    except Exception as e:
                        last_exception = e
                        if attempt < max_retries - 1:
                            time.sleep(delay * (2 ** attempt))  # Exponential backoff
                            logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}: {e}")
                        else:
                            logger.error(f"All {max_retries} attempts failed for {func.__name__}")
                
                raise last_exception
            return wrapper
        return decorator