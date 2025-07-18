"""
Validation and Analytics Module
Handles prediction validation, confusion matrix calculation, and business cost analysis
"""

import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class ValidationAnalytics:
    """
    Handles prediction validation, confusion matrix calculation, and business cost analysis
    """
    
    def __init__(self, predictor):
        self.predictor = predictor
    
    def validate_predictions(self, results: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate predictions against actual outcomes if available
        
        Args:
            results: Prediction results
            df: Original dataframe with actual outcomes
            
        Returns:
            Enhanced results with validation metrics
        """
        try:
            # Extract actual outcomes
            actual_outcomes = []
            predicted_outcomes = []
            
            for i, pred in enumerate(results['predictions']):
                if i < len(df):
                    actual_status = df.iloc[i]['CURRENT_STATUS']
                    actual_rto = self.predictor.data_preprocessor.create_target(actual_status)
                    predicted_rto = pred['rto_prediction']
                    
                    actual_outcomes.append(actual_rto)
                    predicted_outcomes.append(int(predicted_rto))
            
            if len(actual_outcomes) > 0:
                # Calculate confusion matrix
                validation_metrics = self.calculate_validation_metrics(
                    actual_outcomes, predicted_outcomes
                )
                
                results['validation'] = validation_metrics
                logger.info(f"Validation completed: Accuracy = {validation_metrics['accuracy']:.2%}")
            
        except Exception as e:
            logger.warning(f"Could not validate predictions: {e}")
            results['validation'] = {'error': str(e)}
        
        return results

    def calculate_validation_metrics(self, y_true: List[int], y_pred: List[int]) -> Dict[str, Any]:
        """
        Calculate comprehensive validation metrics including confusion matrix
        
        Args:
            y_true: Actual RTO outcomes (0=Delivered, 1=RTO)
            y_pred: Predicted RTO outcomes (0=Delivered, 1=RTO)
            
        Returns:
            Dictionary with validation metrics
        """
        try:
            # Basic metrics
            accuracy = accuracy_score(y_true, y_pred)
            precision = precision_score(y_true, y_pred, zero_division=0)
            recall = recall_score(y_true, y_pred, zero_division=0)
            f1 = f1_score(y_true, y_pred, zero_division=0)
            
            # Confusion matrix counts (using the function we created earlier)
            cm = confusion_matrix(y_true, y_pred)
            if cm.shape == (2, 2):
                tn, fp, fn, tp = cm.ravel()
                
                confusion_counts = {
                    'true_positives': int(tp),
                    'true_negatives': int(tn),
                    'false_positives': int(fp),
                    'false_negatives': int(fn),
                    'total_orders': int(tp + tn + fp + fn)
                }
                
                # Business-friendly interpretations
                business_metrics = {
                    'correctly_predicted_rto': int(tp),
                    'correctly_predicted_delivered': int(tn),
                    'wrongly_flagged_as_rto': int(fp),
                    'missed_rto_cases': int(fn),
                    'total_actual_rto': int(tp + fn),
                    'total_actual_delivered': int(tn + fp)
                }
            else:
                confusion_counts = {'error': 'Unexpected confusion matrix shape'}
                business_metrics = {}
            
            # Cost analysis (business impact)
            cost_analysis = self.calculate_business_cost(y_true, y_pred)
            
            validation_metrics = {
                'accuracy': float(accuracy),
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'confusion_matrix': confusion_counts,
                'business_metrics': business_metrics,
                'cost_analysis': cost_analysis,
                'validation_timestamp': pd.Timestamp.now().isoformat()
            }
            
            return validation_metrics
            
        except Exception as e:
            return {'error': str(e)}

    def calculate_business_cost(self, y_true: List[int], y_pred: List[int]) -> Dict[str, float]:
        """
        Calculate business cost of prediction errors
        
        Args:
            y_true: Actual outcomes
            y_pred: Predicted outcomes
            
        Returns:
            Dictionary with cost analysis
        """
        try:
            # Define business costs (you can adjust these values)
            COST_FALSE_POSITIVE = 50.0   # Cost of wrongly flagging as RTO (customer service, delays)
            COST_FALSE_NEGATIVE = 200.0  # Cost of missing actual RTO (shipping cost, handling)
            COST_TRUE_POSITIVE = 10.0    # Cost of correctly identifying RTO (prevention cost)
            COST_TRUE_NEGATIVE = 0.0     # No cost for correct delivery prediction
            
            # Calculate costs
            total_cost = 0.0
            cost_breakdown = {
                'false_positive_cost': 0.0,
                'false_negative_cost': 0.0,
                'true_positive_cost': 0.0,
                'true_negative_cost': 0.0
            }
            
            for actual, predicted in zip(y_true, y_pred):
                if actual == 0 and predicted == 1:  # False Positive
                    cost_breakdown['false_positive_cost'] += COST_FALSE_POSITIVE
                elif actual == 1 and predicted == 0:  # False Negative
                    cost_breakdown['false_negative_cost'] += COST_FALSE_NEGATIVE
                elif actual == 1 and predicted == 1:  # True Positive
                    cost_breakdown['true_positive_cost'] += COST_TRUE_POSITIVE
                # True Negative has no cost
            
            total_cost = sum(cost_breakdown.values())
            
            return {
                'total_cost': total_cost,
                'average_cost_per_order': total_cost / len(y_true) if len(y_true) > 0 else 0,
                'cost_breakdown': cost_breakdown,
                'cost_savings_vs_no_model': self.calculate_cost_savings(y_true),
                'cost_assumptions': {
                    'false_positive_cost': COST_FALSE_POSITIVE,
                    'false_negative_cost': COST_FALSE_NEGATIVE,
                    'true_positive_cost': COST_TRUE_POSITIVE
                }
            }
            
        except Exception as e:
            return {'error': str(e)}

    def calculate_cost_savings(self, y_true: List[int]) -> float:
        """Calculate cost savings compared to no prediction model"""
        try:
            # Without model, assume we treat all orders as potential RTO
            COST_TREATING_ALL_AS_RTO = 100.0  # Average cost of extra precautions for all orders
            
            baseline_cost = len(y_true) * COST_TREATING_ALL_AS_RTO
            return baseline_cost
            
        except Exception as e:
            return 0.0

    def validate_recent_predictions(self, prediction_file: str, actual_outcomes_file: str) -> Dict[str, Any]:
        """
        Validate recent predictions against actual outcomes
        
        Args:
            prediction_file: CSV file with predictions
            actual_outcomes_file: CSV file with actual outcomes
            
        Returns:
            Validation results with confusion matrix and business metrics
        """
        try:
            # Load prediction and actual data
            pred_df = pd.read_csv(prediction_file)
            actual_df = pd.read_csv(actual_outcomes_file)
            
            # Merge on order number
            merged = pred_df.merge(actual_df, on='ORDER_NUMBER', how='inner')
            
            if len(merged) == 0:
                return {'error': 'No matching orders found between prediction and actual files'}
            
            # Extract predictions and actuals
            y_pred = merged['rto_prediction'].astype(int).tolist()
            y_true = [self.predictor.data_preprocessor.create_target(status) for status in merged['CURRENT_STATUS']]
            
            # Calculate validation metrics
            validation_results = self.calculate_validation_metrics(y_true, y_pred)
            
            # Add summary
            validation_results['summary'] = {
                'total_validated_orders': len(merged),
                'validation_coverage': len(merged) / len(pred_df) * 100,
                'validation_date': pd.Timestamp.now().isoformat()
            }
            
            return validation_results
            
        except Exception as e:
            logger.error(f"Error validating predictions: {e}")
            return {'error': str(e)}