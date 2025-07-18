"""
Method Delegation Handler Module
Handles all method delegations to appropriate components
"""

from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


class MethodDelegationHandler:
    """
    Handles delegation of all methods to appropriate modular components
    """
    
    def __init__(self, components: Dict, predictor):
        self.components = components
        self.predictor = predictor
    
    # Validation Analytics Delegations
    def validate_predictions(self, results: Dict[str, Any], df) -> Dict[str, Any]:
        """Validate predictions against actual outcomes - delegates to ValidationAnalytics"""
        return self.components['validation_analytics'].validate_predictions(results, df)

    def calculate_validation_metrics(self, y_true, y_pred) -> Dict[str, Any]:
        """Calculate validation metrics - delegates to ValidationAnalytics"""
        return self.components['validation_analytics'].calculate_validation_metrics(y_true, y_pred)

    def calculate_business_cost(self, y_true, y_pred) -> Dict[str, float]:
        """Calculate business cost - delegates to ValidationAnalytics"""
        return self.components['validation_analytics'].calculate_business_cost(y_true, y_pred)

    def calculate_cost_savings(self, y_true) -> float:
        """Calculate cost savings - delegates to ValidationAnalytics"""
        return self.components['validation_analytics'].calculate_cost_savings(y_true)

    def validate_recent_predictions(self, prediction_file: str, actual_outcomes_file: str) -> Dict[str, Any]:
        """
        Validate recent predictions against actual outcomes
        
        Args:
            prediction_file: CSV file with predictions
            actual_outcomes_file: CSV file with actual outcomes
            
        Returns:
            Validation results with confusion matrix and business metrics
        """
        return self.components['validation_analytics'].validate_recent_predictions(prediction_file, actual_outcomes_file)

    # Results Enhancement Delegations
    def enhance_results_summary(self, results: Dict[str, Any], df) -> Dict[str, Any]:
        """Enhance results summary - delegates to ResultsEnhancer"""
        return self.components['results_enhancer'].enhance_results_summary(results, df)

    def calculate_completeness_score(self, df) -> float:
        """Calculate completeness score - delegates to ResultsEnhancer"""
        return self.components['results_enhancer'].calculate_completeness_score(df)

    # File Processing Delegations
    def process_in_batches(self, df, batch_size: int) -> Dict[str, Any]:
        """Process in batches - delegates to FileProcessor"""
        return self.components['file_processor'].process_in_batches(df, batch_size, self.predictor)
    
    def combine_batch_summaries(self, batch_summaries) -> Dict:
        """Combine batch summaries - delegates to FileProcessor"""
        return self.components['file_processor'].combine_batch_summaries(batch_summaries)

    # Training Management Delegations
    def train_initial_model(self, training_data_path: str) -> Dict[str, Any]:
        """Train initial model - delegates to TrainingManager"""
        results = self.components['training_manager'].train_initial_model(training_data_path)
        
        # Save training results using OutputManager
        self.components['output_manager'].save_training_results(results, training_data_path)
        
        return results
    
    def daily_retrain(self, new_data_path: str = None) -> Optional[Dict[str, Any]]:
        """Perform daily retraining - delegates to TrainingManager"""
        return self.components['training_manager'].daily_retrain(new_data_path)

    # Reporting Delegations
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate performance report - delegates to ReportingManager"""
        return self.components['reporting_manager'].generate_performance_report()

    # Output Management Delegations
    def save_prediction_results(self, results: Dict, original_csv_path: str):
        """Save prediction results - delegates to OutputManager"""
        self.components['output_manager'].save_prediction_results(results, original_csv_path, self.predictor)
    
    def save_training_results(self, results: Dict, training_data_path: str):
        """Save training results - delegates to OutputManager"""
        self.components['output_manager'].save_training_results(results, training_data_path)