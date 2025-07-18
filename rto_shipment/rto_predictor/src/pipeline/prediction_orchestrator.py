"""
Prediction Orchestrator Module
Orchestrates the prediction workflow using all components
"""

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class PredictionOrchestrator:
    """
    Orchestrates the complete prediction workflow using modular components
    """
    
    def __init__(self, components: Dict, predictor, model_service):
        self.components = components
        self.predictor = predictor
        self.model_service = model_service
    
    def execute_prediction_workflow(self, csv_path: str, batch_size: int = None, validate_predictions: bool = False) -> Dict[str, Any]:
        """
        Execute the complete prediction workflow
        
        Args:
            csv_path: Path to CSV file with new orders
            batch_size: Optional batch size for processing large files
            validate_predictions: If True and actual outcomes are available, validate predictions
            
        Returns:
            Prediction results with optional validation metrics
        """
        # Step 1: File processing
        file_info = self.components['file_processor'].validate_file_and_get_info(csv_path)
        df = self.components['file_processor'].read_csv_with_encoding_detection(csv_path)
        df = self.components['file_processor'].validate_dataframe_content(df)
        
        # Step 2: Model management
        self.model_service.ensure_model_loaded()
        
        # Step 3: Batch processing decision
        batch_size = batch_size or self.predictor.preprocessing_config.batch_size
        
        if len(df) > batch_size:
            logger.info(f"Processing large file in batches of {batch_size}")
            results = self.components['file_processor'].process_in_batches(df, batch_size, self.predictor)
        else:
            # Make predictions
            results = self.predictor.predict(df)
        
        # Step 4: Validation (if requested)
        if validate_predictions and 'CURRENT_STATUS' in df.columns:
            logger.info("Validating predictions against actual outcomes...")
            results = self.components['validation_analytics'].validate_predictions(results, df)
        
        # Step 5: Results enhancement
        results = self.components['results_enhancer'].enhance_results_summary(results, df)
        
        # Step 6: Save results
        self.components['output_manager'].save_prediction_results(results, csv_path, self.predictor)
        
        logger.info(f"Successfully processed {len(results['predictions'])} orders")
        return results