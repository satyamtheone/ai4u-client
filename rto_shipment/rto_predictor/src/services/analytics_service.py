"""
Analytics Service - Independent Analytics and Insights
No dependencies on Training or Prediction services
"""

import pandas as pd
import numpy as np
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

from src.pipeline.performance_analytics_module import PerformanceAnalytics
from src.core.exceptions import *

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Independent Analytics Service

    Responsibilities:
    - Generate courier performance reports
    - Analyze pincode statistics
    - Provide business insights
    - Track system metrics

    NO dependencies on:
    - TrainingService
    - PredictionService
    """

    def __init__(self, data_dir: Optional[str] = None):
        """
        Initialize analytics service

        Args:
            data_dir: Directory for analytics data storage
        """
        self.data_dir = Path(data_dir) if data_dir else Path("data")
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Initialize performance analytics module
        self.performance_analytics = PerformanceAnalytics()

        logger.info("✓ AnalyticsService initialized (independent)")

    def get_courier_performance(self) -> Dict[str, Any]:
        """
        Get courier performance analytics

        Returns:
            Courier performance report with statistics
        """
        try:
            logger.info("📊 Generating courier performance report")

            # Get courier stats from performance analytics
            courier_stats = self.performance_analytics.courier_performance

            if not courier_stats:
                return {
                    'success': True,
                    'message': 'No courier data available yet',
                    'couriers': []
                }

            # Format courier performance data
            courier_list = []
            for courier_name, stats in courier_stats.items():
                courier_list.append({
                    'courier_name': courier_name,
                    'total_orders': stats.get('total_orders', 0),
                    'rto_count': stats.get('rto_count', 0),
                    'success_count': stats.get('success_count', 0),
                    'rto_rate': stats.get('rto_rate', 0.0),
                    'success_rate': stats.get('success_rate', 100.0),
                    'avg_delivery_time': stats.get('avg_delivery_time', 0.0)
                })

            # Sort by success rate (best first)
            courier_list.sort(key=lambda x: x['success_rate'], reverse=True)

            # Calculate aggregate stats
            total_orders = sum(c['total_orders'] for c in courier_list)
            total_rto = sum(c['rto_count'] for c in courier_list)

            return {
                'success': True,
                'couriers': courier_list,
                'summary': {
                    'total_couriers': len(courier_list),
                    'total_orders': total_orders,
                    'total_rto': total_rto,
                    'overall_rto_rate': (total_rto / total_orders * 100) if total_orders > 0 else 0.0,
                    'best_performer': courier_list[0]['courier_name'] if courier_list else None,
                    'worst_performer': courier_list[-1]['courier_name'] if courier_list else None
                },
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Failed to get courier performance: {e}")
            raise AnalyticsError(f"Courier performance analysis failed: {str(e)}") from e

    def get_pincode_analysis(self, pincode: Optional[str] = None) -> Dict[str, Any]:
        """
        Get pincode-level analytics

        Args:
            pincode: Specific pincode to analyze (optional)

        Returns:
            Pincode analytics report
        """
        try:
            logger.info(f"📍 Analyzing pincode: {pincode or 'all'}")

            pincode_stats = self.performance_analytics.pincode_stats

            if not pincode_stats:
                return {
                    'success': True,
                    'message': 'No pincode data available yet',
                    'pincodes': []
                }

            if pincode:
                # Get specific pincode data
                pincode_data = pincode_stats.get(pincode, {})
                if not pincode_data:
                    return {
                        'success': False,
                        'message': f'No data found for pincode {pincode}'
                    }

                return {
                    'success': True,
                    'pincode': pincode,
                    'data': pincode_data,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                # Get all pincode data
                pincode_list = []
                for code, stats in pincode_stats.items():
                    pincode_list.append({
                        'pincode': code,
                        'total_orders': stats.get('total_orders', 0),
                        'rto_count': stats.get('rto_count', 0),
                        'rto_rate': stats.get('rto_rate', 0.0),
                        'zone': stats.get('zone', 'Unknown'),
                        'risk_level': self._get_pincode_risk_level(stats.get('rto_rate', 0.0))
                    })

                # Sort by RTO rate (highest risk first)
                pincode_list.sort(key=lambda x: x['rto_rate'], reverse=True)

                # Calculate aggregate stats
                total_orders = sum(p['total_orders'] for p in pincode_list)
                total_rto = sum(p['rto_count'] for p in pincode_list)
                high_risk_count = sum(1 for p in pincode_list if p['rto_rate'] > 30)

                return {
                    'success': True,
                    'pincodes': pincode_list[:100],  # Return top 100
                    'summary': {
                        'total_pincodes': len(pincode_list),
                        'total_orders': total_orders,
                        'total_rto': total_rto,
                        'overall_rto_rate': (total_rto / total_orders * 100) if total_orders > 0 else 0.0,
                        'high_risk_pincodes': high_risk_count,
                        'highest_risk_pincode': pincode_list[0]['pincode'] if pincode_list else None
                    },
                    'timestamp': datetime.now().isoformat()
                }

        except Exception as e:
            logger.error(f"❌ Failed to get pincode analysis: {e}")
            raise AnalyticsError(f"Pincode analysis failed: {str(e)}") from e

    def get_performance_trends(self, days: int = 30) -> Dict[str, Any]:
        """
        Get performance trends over time

        Args:
            days: Number of days to analyze

        Returns:
            Performance trends report
        """
        try:
            logger.info(f"📈 Analyzing performance trends for last {days} days")

            # Get historical data from performance analytics
            # This is a placeholder - actual implementation would query stored metrics
            return {
                'success': True,
                'message': f'Trend analysis for last {days} days',
                'trends': {
                    'rto_rate_trend': 'decreasing',  # Placeholder
                    'prediction_accuracy_trend': 'improving',  # Placeholder
                    'order_volume_trend': 'stable'  # Placeholder
                },
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Failed to get performance trends: {e}")
            raise AnalyticsError(f"Trend analysis failed: {str(e)}") from e

    def get_system_metrics(self) -> Dict[str, Any]:
        """
        Get system-level metrics and health indicators

        Returns:
            System metrics report
        """
        try:
            logger.info("💻 Collecting system metrics")

            # Get basic system metrics
            import psutil

            return {
                'success': True,
                'metrics': {
                    'cpu_usage': psutil.cpu_percent(interval=1),
                    'memory_usage': psutil.virtual_memory().percent,
                    'disk_usage': psutil.disk_usage('/').percent
                },
                'analytics_status': {
                    'courier_data_available': len(self.performance_analytics.courier_performance) > 0,
                    'pincode_data_available': len(self.performance_analytics.pincode_stats) > 0,
                    'total_couriers_tracked': len(self.performance_analytics.courier_performance),
                    'total_pincodes_tracked': len(self.performance_analytics.pincode_stats)
                },
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Failed to get system metrics: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def get_business_insights(self) -> Dict[str, Any]:
        """
        Generate business insights from analytics data

        Returns:
            Business insights and recommendations
        """
        try:
            logger.info("💡 Generating business insights")

            insights = []
            recommendations = []

            # Analyze courier performance
            courier_report = self.get_courier_performance()
            if courier_report['success'] and courier_report.get('couriers'):
                summary = courier_report['summary']

                # Insight about overall RTO rate
                overall_rto = summary['overall_rto_rate']
                if overall_rto > 25:
                    insights.append({
                        'type': 'warning',
                        'category': 'courier_performance',
                        'message': f'Overall RTO rate is high at {overall_rto:.1f}%',
                        'impact': 'high'
                    })
                    recommendations.append({
                        'category': 'courier_optimization',
                        'action': 'Consider switching to better performing couriers',
                        'expected_impact': 'Reduce RTO by 10-15%'
                    })

                # Identify best and worst performers
                if summary.get('best_performer'):
                    insights.append({
                        'type': 'success',
                        'category': 'courier_performance',
                        'message': f"Best performer: {summary['best_performer']}",
                        'impact': 'positive'
                    })

            # Analyze pincode risks
            pincode_report = self.get_pincode_analysis()
            if pincode_report['success'] and pincode_report.get('summary'):
                summary = pincode_report['summary']

                if summary.get('high_risk_pincodes', 0) > 0:
                    insights.append({
                        'type': 'warning',
                        'category': 'geographic_risk',
                        'message': f"{summary['high_risk_pincodes']} pincodes have high RTO risk",
                        'impact': 'high'
                    })
                    recommendations.append({
                        'category': 'risk_mitigation',
                        'action': 'Implement prepayment policy for high-risk pincodes',
                        'expected_impact': 'Reduce RTO by 20-30% in high-risk areas'
                    })

            return {
                'success': True,
                'insights': insights,
                'recommendations': recommendations,
                'insight_count': len(insights),
                'recommendation_count': len(recommendations),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Failed to generate insights: {e}")
            raise AnalyticsError(f"Insight generation failed: {str(e)}") from e

    def _get_pincode_risk_level(self, rto_rate: float) -> str:
        """
        Determine risk level for a pincode based on RTO rate

        Args:
            rto_rate: RTO rate percentage

        Returns:
            Risk level string
        """
        if rto_rate >= 40:
            return "Critical"
        elif rto_rate >= 30:
            return "High"
        elif rto_rate >= 20:
            return "Medium"
        else:
            return "Low"

    def get_analytics_info(self) -> Dict[str, Any]:
        """
        Get information about analytics service

        Returns:
            Service information dictionary
        """
        return {
            'service': 'AnalyticsService',
            'status': 'ready',
            'data_directory': str(self.data_dir),
            'couriers_tracked': len(self.performance_analytics.courier_performance),
            'pincodes_tracked': len(self.performance_analytics.pincode_stats),
            'features': [
                'courier_performance',
                'pincode_analysis',
                'performance_trends',
                'system_metrics',
                'business_insights'
            ]
        }
