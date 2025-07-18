import time
import threading
from typing import Dict, Union
from collections import defaultdict

# Monitoring and Metrics
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
