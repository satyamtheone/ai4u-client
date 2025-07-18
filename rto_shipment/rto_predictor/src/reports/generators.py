# Transaction management for rollback capability
@contextmanager
def processing_transaction():
    """Context manager for processing transactions with rollback"""
    checkpoints = []
    try:
        yield checkpoints
    except Exception as e:
        logger.error(f"Transaction failed: {e}")
        # Perform rollback operations here if needed
        raise

 def _generate_explanation(self, order_data: pd.Series, probability: float) -> str:
        """Generate explanation for the prediction"""
        
        explanations = []
        
        try:
            # Payment mode impact
            if order_data.get('IS_COD', 0) == 1:
                explanations.append("COD payment increases RTO risk")
            else:
                explanations.append("Prepaid payment reduces RTO risk")
            
            # Zone impact
            zone_risk = order_data.get('ZONE_RISK', 2)
            if zone_risk >= 3:
                explanations.append("Delivery to remote/special zone increases risk")
            
            # Address quality
            if order_data.get('ADDRESS_RISK_KEYWORDS', 0) == 1:
                explanations.append("Address contains risky keywords")
            
            # Phone validity
            if order_data.get('PHONE_VALID', 1) == 0:
                explanations.append("Invalid phone number format increases risk")
            
            # Value impact
            if order_data.get('HIGH_VALUE_ORDER', 0) == 1:
                explanations.append("High-value order may have higher scrutiny")
            
        except Exception as e:
            logger.warning(f"Error generating explanation: {e}")
            explanations.append("Risk assessment completed with standard factors")
        
        return "; ".join(explanations) if explanations else "Standard risk factors detected"
    
    def _generate_recommendations(self, order_data: pd.Series, probability: float) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        try:
            if probability > 0.7:  # High risk
                recommendations.extend([
                    "Consider calling customer to confirm address and availability",
                    "Use premium courier service for better delivery success",
                    "Send SMS/WhatsApp notifications before delivery attempt"
                ])
            
            if order_data.get('IS_COD', 0) == 1:
                recommendations.append("Encourage prepaid payment for better delivery rates")
            
            if order_data.get('PHONE_VALID', 1) == 0:
                recommendations.append("Verify and update customer phone number")
            
            if order_data.get('ADDRESS_RISK_KEYWORDS', 0) == 1:
                recommendations.append("Get detailed address with local landmarks")
            
            # Courier-specific recommendations
            courier = order_data.get('COURIER_NAME_ENCODED', 0)
            if courier in self.courier_performance:
                perf = self.courier_performance[courier]
                if perf.get('success_rate', 0.5) < 0.7:
                    recommendations.append("Consider switching to a more reliable courier")
                    
        except Exception as e:
            logger.warning(f"Error generating recommendations: {e}")
            recommendations.append("Follow standard delivery procedures")
        
        return recommendations
    
    
def _generate_summary(self, df: pd.DataFrame, predictions: np.ndarray, probabilities: np.ndarray) -> Dict:
        """Generate summary of predictions and insights"""
        
        try:
            total_orders = len(predictions)
            predicted_rto = np.sum(predictions)
            avg_risk = np.mean(probabilities)
            
            # Risk distribution
            high_risk = np.sum(probabilities > 0.7)
            medium_risk = np.sum((probabilities >= 0.3) & (probabilities <= 0.7))
            low_risk = np.sum(probabilities < 0.3)
            
            # Courier analysis
            courier_risk = {}
            if 'COURIER_NAME' in df.columns:
                for courier in df['COURIER_NAME'].unique():
                    courier_mask = df['COURIER_NAME'] == courier
                    courier_orders = np.sum(courier_mask)
                    courier_avg_risk = np.mean(probabilities[courier_mask])
                    courier_risk[courier] = {
                        'orders': int(courier_orders),
                        'avg_risk': float(courier_avg_risk)
                    }
            
            return {
                'total_orders': int(total_orders),
                'predicted_rto': int(predicted_rto),
                'rto_rate': float(predicted_rto / total_orders),
                'average_risk_score': float(avg_risk),
                'risk_distribution': {
                    'high_risk': int(high_risk),
                    'medium_risk': int(medium_risk),
                    'low_risk': int(low_risk)
                },
                'courier_risk_analysis': courier_risk,
                'summary_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return {
                'total_orders': len(predictions),
                'error': str(e),
                'summary_timestamp': datetime.now().isoformat()
            }
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
                    'performance_grade': self._get_performance_grade(stats.get('success_rate', 0))
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
                        'recommendation': self._get_pincode_recommendation(self.pincode_stats[pincode]),
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
    
    def _get_performance_grade(self, success_rate: float) -> str:
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
    
    def _get_pincode_recommendation(self, stats: Dict) -> str:
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


    