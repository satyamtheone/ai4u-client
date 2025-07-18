# Health Check Endpoint
def health_check(pipeline_manager: ProductionRTOPipelineManager) -> Dict[str, Any]:
    """
    Comprehensive health check for the RTO pipeline
    """
    try:
        health_status = pipeline_manager.predictor.get_health_status()
        
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
    
 def get_health_status(self) -> Dict[str, Any]:
        """Get system health status"""
        return {
            **self.health_status,
            'circuit_breaker_state': self.circuit_breaker.state if self.circuit_breaker else 'disabled',
            'memory_usage_mb': psutil.Process().memory_info().rss / 1024 / 1024,
            'metrics': self.metrics_collector.get_metrics(),
            'uptime': time.time() - getattr(self, '_start_time', time.time())
        }

