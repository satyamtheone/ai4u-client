"""
Monitoring and Metrics Management Module
Handles all monitoring, metrics collection, and performance tracking
"""

import time
import threading
import psutil
import functools
from collections import defaultdict
from typing import Dict, Union, Any
import logging

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Collect and store performance metrics"""
    
    def __init__(self):
        self.metrics = defaultdict(list)
        self.start_times = {}
        self.lock = threading.Lock()
    
    def start_timer(self, operation: str):
        """Start timing an operation"""
        with self.lock:
            self.start_times[operation] = time.time()
    
    def end_timer(self, operation: str):
        """End timing and record duration"""
        with self.lock:
            if operation in self.start_times:
                duration = time.time() - self.start_times[operation]
                self.metrics[f"{operation}_duration"].append(duration)
                del self.start_times[operation]
                return duration
            return None
    
    def record_metric(self, name: str, value: Union[int, float]):
        """Record a custom metric"""
        with self.lock:
            self.metrics[name].append({
                'value': value,
                'timestamp': time.time()
            })
    
    def get_metrics(self) -> Dict:
        """Get all collected metrics"""
        with self.lock:
            return dict(self.metrics)


class MonitoringDecorators:
    """
    Container for monitoring decorators and utilities
    """
    
    @staticmethod
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