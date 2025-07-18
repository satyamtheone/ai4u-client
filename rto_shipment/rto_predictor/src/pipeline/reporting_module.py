"""
Reporting Module
Handles performance reporting and system health monitoring
"""

import pandas as pd
import json
import sys
import psutil
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class ReportingManager:
    """
    Handles performance reporting and system health monitoring
    """
    
    def __init__(self, predictor, metrics_collector, config: Dict[str, Any]):
        self.predictor = predictor
        self.metrics_collector = metrics_collector
        self.config = config
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report with system metrics"""
        
        logger.info("Generating performance report")
        
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'system_health': self.predictor.get_health_status(),
                'courier_performance': self.predictor.get_courier_performance_report(),
                'pincode_analysis': self.predictor.get_pincode_analysis(),
                'model_info': {
                    'model_type': type(self.predictor.model).__name__ if self.predictor.model else None,
                    'feature_count': len(self.predictor.feature_columns) if self.predictor.feature_columns else 0,
                    'feature_importance': self.predictor.model_trainer.get_feature_importance(),
                    'model_version': getattr(self.predictor, 'model_version', 'unknown')
                },
                'performance_metrics': self.metrics_collector.get_metrics()
            }
            
            # Save report
            report_path = Path(self.config['output_dir']) / f"performance_report_{datetime.now().strftime('%Y%m%d')}.json"
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            
            logger.info(f"Performance report saved to {report_path}")
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating performance report: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }