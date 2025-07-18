"""
Results Enhancement Module
Handles result enhancement, data quality scoring, and confidence analysis
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class ResultsEnhancer:
    """
    Handles enhancement of prediction results with additional analytics and insights
    """
    
    def __init__(self):
        pass
    
    def enhance_results_summary(self, results: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Enhance results with additional analytics and insights
        
        Args:
            results: Original prediction results
            df: Original dataframe
            
        Returns:
            Enhanced results with additional insights
        """
        try:
            summary = results.get('summary', {})
            
            # Add data quality metrics
            data_quality = {
                'input_data_quality': {
                    'total_rows': len(df),
                    'missing_values_pct': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
                    'duplicate_orders': df.duplicated().sum() if len(df) > 0 else 0,
                    'data_completeness_score': self.calculate_completeness_score(df)
                }
            }
            
            # Add prediction confidence analysis
            if 'predictions' in results:
                probabilities = [p.get('rto_probability', 0) for p in results['predictions']]
                confidence_analysis = {
                    'prediction_confidence': {
                        'avg_confidence': np.mean(probabilities),
                        'min_confidence': np.min(probabilities),
                        'max_confidence': np.max(probabilities),
                        'low_confidence_count': sum(1 for p in probabilities if 0.3 <= p <= 0.7),
                        'high_confidence_count': sum(1 for p in probabilities if p < 0.3 or p > 0.7)
                    }
                }
            else:
                confidence_analysis = {}
            
            # Merge all enhancements
            enhanced_summary = {
                **summary,
                **data_quality,
                **confidence_analysis,
                'enhancement_timestamp': pd.Timestamp.now().isoformat()
            }
            
            results['summary'] = enhanced_summary
            
        except Exception as e:
            logger.warning(f"Could not enhance results summary: {e}")
        
        return results

    def calculate_completeness_score(self, df: pd.DataFrame) -> float:
        """Calculate data completeness score (0-100)"""
        try:
            total_cells = len(df) * len(df.columns)
            missing_cells = df.isnull().sum().sum()
            completeness = ((total_cells - missing_cells) / total_cells) * 100
            return round(completeness, 2)
        except:
            return 0.0