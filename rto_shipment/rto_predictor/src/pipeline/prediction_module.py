"""
Prediction and Analysis Module
Handles prediction generation, explanations, recommendations, and similarity analysis
"""

import pandas as pd
import numpy as np
from datetime import datetime
from scipy.spatial.distance import cosine
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class PredictionAnalyzer:
    """
    Handles prediction generation, explanations, recommendations, and similarity analysis
    """
    
    def __init__(self):
        self.historical_data = None
        self.courier_performance = {}
        self.pincode_stats = {}
    
    def get_risk_level(self, probability: float) -> str:
        """Categorize risk level based on probability"""
        if probability < 0.3:
            return "Low"
        elif probability < 0.7:
            return "Medium"
        else:
            return "High"
    
    def generate_explanation(self, order_data: pd.Series, probability: float) -> str:
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
    
    def generate_recommendations(self, order_data: pd.Series, probability: float) -> List[str]:
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
    
    def find_similar_orders(self, order_data: pd.Series) -> List[Dict]:
        """Find top 5 similar historical orders with error handling"""
        
        if self.historical_data is None or len(self.historical_data) == 0:
            return []
        
        try:
            # Select features for similarity calculation
            similarity_features = [
                'COURIER_NAME_ENCODED', 'CUSTOMER_CITY_ENCODED', 'ZONE_RISK',
                'IS_COD', 'WEIGHT_PER_ITEM', 'VALUE_PER_ITEM'
            ]
            
            available_features = [f for f in similarity_features if f in order_data.index]
            
            if not available_features:
                return []
            
            # Calculate similarity with historical orders
            order_vector = order_data[available_features].values.reshape(1, -1)
            historical_vectors = self.historical_data[available_features].values
            
            # Handle missing values
            order_vector = np.nan_to_num(order_vector)
            historical_vectors = np.nan_to_num(historical_vectors)
            
            # Calculate cosine similarities
            similarities = []
            for i, hist_vector in enumerate(historical_vectors):
                try:
                    sim = 1 - cosine(order_vector.flatten(), hist_vector)
                    similarities.append((i, sim))
                except:
                    similarities.append((i, 0))
            
            # Get top 5 most similar orders
            similarities.sort(key=lambda x: x[1], reverse=True)
            top_similar = similarities[:5]
            
            similar_orders = []
            for idx, similarity in top_similar:
                hist_order = self.historical_data.iloc[idx]
                similar_orders.append({
                    'similarity_score': float(similarity),
                    'order_number': str(hist_order.get('ORDER_NUMBER', 'Unknown')),
                    'status': str(hist_order.get('CURRENT_STATUS', 'Unknown')),
                    'courier': str(hist_order.get('COURIER_NAME', 'Unknown')),
                    'city': str(hist_order.get('CUSTOMER_CITY', 'Unknown')),
                    'payment_mode': str(hist_order.get('PAYMENT_MODE', 'Unknown'))
                })
            
            return similar_orders
            
        except Exception as e:
            logger.warning(f"Error finding similar orders: {e}")
            return []
    
    def generate_summary(self, df: pd.DataFrame, predictions: np.ndarray, probabilities: np.ndarray) -> Dict:
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
    
    def process_predictions(self, df_processed: pd.DataFrame, predictions: np.ndarray, probabilities: np.ndarray) -> List[Dict]:
        """Process predictions and generate detailed results"""
        
        results = []
        for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
            try:
                order_data = df_processed.iloc[i]
                
                result = {
                    'order_index': i,
                    'order_number': str(order_data.get('ORDER_NUMBER', f'ORDER_{i}')),
                    'order_current_status': str(order_data.get('CURRENT_STATUS', 'Unknown')),
                    'payment_mode': str(order_data.get('PAYMENT_MODE', 'Unknown')),
                    'cod_value': float(order_data.get('COLLECTABLE_AMOUNT', 0)),
                    'order_created_at': str(order_data.get('ORDER_CREATION_DATE', 'Unknown')),
                    'rto_prediction': bool(pred),
                    'rto_probability': float(prob),
                    'risk_level': self.get_risk_level(prob),
                    'explanation': self.generate_explanation(order_data, prob),
                    'recommendations': self.generate_recommendations(order_data, prob),
                    'similar_orders': self.find_similar_orders(order_data),
                    'prediction_timestamp': datetime.now().isoformat()
                }
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error processing order {i}: {e}")
                # Add minimal result for failed orders
                results.append({
                    'order_index': i,
                    'error': str(e),
                    'rto_prediction': False,
                    'rto_probability': 0.5,
                    'risk_level': 'Medium'
                })
        
        return results