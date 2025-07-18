import time
import psutil
import threading
import functools

# Custom exceptions
from core.exceptions import  ProcessingTimeoutError

# Decorators for monitoring and error handling
def monitor_performance(func_or_collector=None):
    """Decorator to monitor function performance"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract metrics collector from self if it's a method
            metrics_collector = None
            if args and hasattr(args[0], 'metrics_collector'):
                metrics_collector = args[0].metrics_collector
            elif hasattr(func_or_collector, 'record_metric'):
                metrics_collector = func_or_collector
            
            operation_name = f"{func.__module__}.{func.__name__}"
            
            if metrics_collector:
                metrics_collector.start_timer(operation_name)
            
            try:
                # Monitor memory usage
                process = psutil.Process()
                memory_before = process.memory_info().rss / 1024 / 1024  # MB
                
                result = func(*args, **kwargs)
                
                memory_after = process.memory_info().rss / 1024 / 1024  # MB
                memory_used = memory_after - memory_before
                
                if metrics_collector:
                    duration = metrics_collector.end_timer(operation_name)
                    metrics_collector.record_metric(f"{operation_name}_memory_mb", memory_used)
                
                return result
                
            except Exception as e:
                if metrics_collector:
                    metrics_collector.end_timer(operation_name)
                    metrics_collector.record_metric(f"{operation_name}_errors", 1)
                raise
        return wrapper
    
    # Handle both @monitor_performance and @monitor_performance(collector)
    if callable(func_or_collector):
        return decorator(func_or_collector)
    else:
        return decorator

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