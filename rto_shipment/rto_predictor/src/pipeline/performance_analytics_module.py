"""
Performance Analytics Module
Handles courier performance, pincode analysis, and reporting
"""

import pandas as pd
import numpy as np
from datetime import datetime
from collections import defaultdict
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class PerformanceAnalytics:
    """
    Handles courier performance analytics, pincode analysis, and reporting
    """
    
    def __init__(self):
        self.courier_performance = defaultdict(dict)
        self.pincode_stats = defaultdict(dict)
    
    def calculate_performance_metrics(self, df: pd.DataFrame):
        """Calculate courier and pincode performance metrics"""
        
        if 'CURRENT_STATUS' not in df.columns:
            return
        
        try:
            # Courier performance
            courier_stats = df.groupby('COURIER_NAME').agg({
                'RTO_TARGET': ['count', 'sum', 'mean'],
                'INVOICE_VALUE': 'mean',
                'TAT': 'mean'
            }).round(3)
            
            for courier in courier_stats.index:
                total_orders = courier_stats.loc[courier, ('RTO_TARGET', 'count')]
                rto_orders = courier_stats.loc[courier, ('RTO_TARGET', 'sum')]
                success_rate = 1 - courier_stats.loc[courier, ('RTO_TARGET', 'mean')]
                
                self.courier_performance[courier] = {
                    'total_orders': int(total_orders),
                    'rto_orders': int(rto_orders),
                    'success_rate': float(success_rate),
                    'avg_value': float(courier_stats.loc[courier, ('INVOICE_VALUE', 'mean')]),
                    'avg_tat': float(courier_stats.loc[courier, ('TAT', 'mean')])
                }
            
            # Pincode performance
            pincode_stats = df.groupby('PINCODE').agg({
                'RTO_TARGET': ['count', 'sum', 'mean'],
                'COURIER_NAME': lambda x: x.mode().iloc[0] if not x.mode().empty else 'Unknown'
            }).round(3)
            
            for pincode in pincode_stats.index:
                total_orders = pincode_stats.loc[pincode, ('RTO_TARGET', 'count')]
                if total_orders >= 5:  # Only consider pincodes with sufficient data
                    rto_rate = pincode_stats.loc[pincode, ('RTO_TARGET', 'mean')]
                    self.pincode_stats[pincode] = {
                        'total_orders': int(total_orders),
                        'rto_rate': float(rto_rate),
                        'delivery_success_rate': float(1 - rto_rate),
                        'primary_courier': pincode_stats.loc[pincode, ('COURIER_NAME', '<lambda>')]
                    }
                    
        except Exception as e:
            logger.error(f"Error calculating performance metrics: {e}")
    
    def get_courier_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive courier performance report"""
        
        report = {
            'total_couriers': len(self.courier_performance),
            'courier_rankings': [],
            'recommendations': [],
            'report_timestamp': datetime.now().isoformat()
        }
        
        try:
            # Sort couriers by success rate
            sorted_couriers = sorted(
                self.courier_performance.items(),
                key=lambda x: x[1].get('success_rate', 0),
                reverse=True
            )
            
            for courier, stats in sorted_couriers:
                courier_info = {
                    'courier_name': courier,
                    'success_rate': stats.get('success_rate', 0),
                    'total_orders': stats.get('total_orders', 0),
                    'rto_orders': stats.get('rto_orders', 0),
                    'avg_order_value': stats.get('avg_value', 0),
                    'avg_tat': stats.get('avg_tat', 0),
                    'performance_grade': self.get_performance_grade(stats.get('success_rate', 0))
                }
                report['courier_rankings'].append(courier_info)
            
            # Generate recommendations
            if sorted_couriers:
                best_courier = sorted_couriers[0]
                worst_courier = sorted_couriers[-1] if len(sorted_couriers) > 1 else None
                
                if best_courier[1].get('success_rate', 0) > 0.85:
                    report['recommendations'].append(
                        f"Consider increasing volume with {best_courier[0]} (success rate: {best_courier[1].get('success_rate', 0):.2%})"
                    )
                
                if worst_courier and worst_courier[1].get('success_rate', 0) < 0.6:
                    report['recommendations'].append(
                        f"Review partnership with {worst_courier[0]} (success rate: {worst_courier[1].get('success_rate', 0):.2%})"
                    )
                    
        except Exception as e:
            logger.error(f"Error generating courier performance report: {e}")
            report['error'] = str(e)
        
        return report
    
    def get_pincode_analysis(self, pincode: str = None) -> Dict[str, Any]:
        """Get delivery analysis for specific pincode or all pincodes"""
        
        try:
            if pincode:
                if pincode in self.pincode_stats:
                    return {
                        'pincode': pincode,
                        'stats': self.pincode_stats[pincode],
                        'recommendation': self.get_pincode_recommendation(self.pincode_stats[pincode]),
                        'analysis_timestamp': datetime.now().isoformat()
                    }
                else:
                    return {
                        'pincode': pincode, 
                        'message': 'No historical data available',
                        'analysis_timestamp': datetime.now().isoformat()
                    }
            
            # Return analysis for all pincodes
            analysis = {
                'total_pincodes_analyzed': len(self.pincode_stats),
                'high_risk_pincodes': [],
                'low_risk_pincodes': [],
                'summary': {},
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            rto_rates = [stats['rto_rate'] for stats in self.pincode_stats.values()]
            if rto_rates:
                analysis['summary'] = {
                    'avg_rto_rate': np.mean(rto_rates),
                    'median_rto_rate': np.median(rto_rates),
                    'max_rto_rate': np.max(rto_rates),
                    'min_rto_rate': np.min(rto_rates)
                }
            
            # Categorize pincodes
            for pincode, stats in self.pincode_stats.items():
                if stats['rto_rate'] > 0.3:  # High risk
                    analysis['high_risk_pincodes'].append({
                        'pincode': pincode,
                        'rto_rate': stats['rto_rate'],
                        'total_orders': stats['total_orders']
                    })
                elif stats['rto_rate'] < 0.1:  # Low risk
                    analysis['low_risk_pincodes'].append({
                        'pincode': pincode,
                        'rto_rate': stats['rto_rate'],
                        'total_orders': stats['total_orders']
                    })
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in pincode analysis: {e}")
            return {
                'error': str(e),
                'analysis_timestamp': datetime.now().isoformat()
            }
    
    def get_performance_grade(self, success_rate: float) -> str:
        """Get performance grade based on success rate"""
        if success_rate >= 0.9:
            return "A+"
        elif success_rate >= 0.8:
            return "A"
        elif success_rate >= 0.7:
            return "B"
        elif success_rate >= 0.6:
            return "C"
        else:
            return "D"
    
    def get_pincode_recommendation(self, stats: Dict) -> str:
        """Get recommendation for a specific pincode"""
        rto_rate = stats.get('rto_rate', 0)
        total_orders = stats.get('total_orders', 0)
        
        if total_orders < 10:
            return "Insufficient data for reliable analysis"
        elif rto_rate > 0.3:
            return "High-risk pincode. Consider premium courier or customer verification"
        elif rto_rate < 0.1:
            return "Low-risk pincode. Reliable delivery area"
        else:
            return "Moderate risk. Standard delivery procedures recommended"