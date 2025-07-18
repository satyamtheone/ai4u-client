"""
Health Monitoring Service Module
Handles comprehensive health checks and system monitoring
"""

import time
import psutil
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class HealthMonitoringService:
    """
    Comprehensive health monitoring service for the RTO pipeline
    """
    
    def __init__(self, pipeline_manager=None):
        self.pipeline_manager = pipeline_manager
        self._start_time = time.time()
    
    def health_check(self) -> Dict[str, Any]:
        """
        Comprehensive health check for the RTO pipeline
        """
        try:
            if not self.pipeline_manager:
                return self._basic_health_check()
            
            health_status = self.pipeline_manager.predictor.get_health_status()
            
            # Add additional checks
            health_status.update({
                'pipeline_status': 'healthy',
                'api_version': '1.0.0',
                'checks': {
                    'model_loaded': health_status['model_loaded'],
                    'memory_ok': health_status['memory_usage_mb'] < 1024,  # Less than 1GB
                    'recent_activity': health_status['last_prediction'] is not None,
                    'error_rate_ok': health_status['error_count'] < 10
                }
            })
            
            # Overall health determination
            all_checks_pass = all(health_status['checks'].values())
            health_status['overall_status'] = 'healthy' if all_checks_pass else 'degraded'
            
            return health_status
            
        except Exception as e:
            return {
                'pipeline_status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _basic_health_check(self) -> Dict[str, Any]:
        """Basic health check without pipeline manager"""
        try:
            return {
                'pipeline_status': 'healthy',
                'api_version': '1.0.0',
                'uptime': time.time() - self._start_time,
                'memory_usage_mb': psutil.Process().memory_info().rss / 1024 / 1024,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'pipeline_status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get detailed system metrics"""
        try:
            process = psutil.Process()
            return {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_usage_percent': psutil.disk_usage('/').percent,
                'process_memory_mb': process.memory_info().rss / 1024 / 1024,
                'process_cpu_percent': process.cpu_percent(),
                'thread_count': process.num_threads(),
                'uptime_seconds': time.time() - self._start_time,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }