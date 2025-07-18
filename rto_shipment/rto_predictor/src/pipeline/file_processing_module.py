"""
File Processing Module
Handles all file operations including CSV reading, encoding detection, and batch processing
"""

import pandas as pd
import numpy as np
import os
from pathlib import Path
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class DataValidationError(Exception):
    """Custom exception for data validation errors"""
    pass


class ModelNotFoundError(Exception):
    """Custom exception for model not found errors"""
    pass


class FileProcessor:
    """
    Handles all file processing operations including CSV reading, validation, and batch processing
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    def read_csv_with_encoding_detection(self, csv_path: str) -> pd.DataFrame:
        """Read CSV with automatic encoding detection"""
        try:
            # Try different encodings if needed
            for encoding in ['utf-8', 'latin1', 'cp1252']:
                try:
                    df = pd.read_csv(csv_path, encoding=encoding)
                    logger.info(f"Successfully read CSV with {encoding} encoding")
                    return df
                except UnicodeDecodeError:
                    continue
            else:
                raise DataValidationError("Could not read CSV with any supported encoding")
                
        except Exception as e:
            raise DataValidationError(f"Error reading CSV file: {e}")
    
    def validate_file_and_get_info(self, csv_path: str) -> Dict[str, Any]:
        """Validate file exists and get file information"""
        # Validate file exists and is readable
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV file not found: {csv_path}")
        
        # Check file size and warn if very large
        file_size_mb = os.path.getsize(csv_path) / (1024 * 1024)
        if file_size_mb > 100:  # 100MB threshold
            logger.warning(f"Large file detected: {file_size_mb:.2f}MB. Consider batch processing.")
        
        return {
            'file_size_mb': file_size_mb,
            'file_exists': True,
            'file_path': csv_path
        }
    
    def validate_dataframe_content(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate and clean dataframe content"""
        logger.info(f"Loaded {len(df)} orders from CSV")
        
        # Enhanced validation
        if df.empty:
            raise DataValidationError("CSV file is empty")
        
        # Check for minimum required columns
        required_cols = ['ORDER_NUMBER']  # At minimum we need order numbers
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing recommended columns: {missing_cols}")
        
        # Check for duplicate order numbers
        if 'ORDER_NUMBER' in df.columns:
            duplicates = df['ORDER_NUMBER'].duplicated().sum()
            if duplicates > 0:
                logger.warning(f"Found {duplicates} duplicate order numbers")
                # Optionally remove duplicates
                df = df.drop_duplicates(subset=['ORDER_NUMBER'], keep='first')
                logger.info(f"Removed duplicates, processing {len(df)} unique orders")
        
        return df
    
    def process_in_batches(self, df: pd.DataFrame, batch_size: int, predictor) -> Dict[str, Any]:
        """Process large dataframes in batches"""
        
        all_predictions = []
        batch_summaries = []
        
        num_batches = len(df) // batch_size + (1 if len(df) % batch_size > 0 else 0)
        
        for i in range(num_batches):
            start_idx = i * batch_size
            end_idx = min((i + 1) * batch_size, len(df))
            
            batch_df = df.iloc[start_idx:end_idx]
            
            logger.info(f"Processing batch {i+1}/{num_batches} ({len(batch_df)} orders)")
            
            try:
                batch_results = predictor.predict(batch_df)
                all_predictions.extend(batch_results['predictions'])
                batch_summaries.append(batch_results['summary'])
                
            except Exception as e:
                logger.error(f"Error processing batch {i+1}: {e}")
                # Continue with other batches
                continue
        
        # Combine results
        combined_results = {
            'predictions': all_predictions,
            'summary': self.combine_batch_summaries(batch_summaries),
            'batch_processing': True,
            'total_batches': num_batches
        }
        
        return combined_results
    
    def combine_batch_summaries(self, batch_summaries: List[Dict]) -> Dict:
        """Combine summaries from multiple batches"""
        
        if not batch_summaries:
            return {}
        
        combined = {
            'total_orders': sum(s.get('total_orders', 0) for s in batch_summaries),
            'predicted_rto': sum(s.get('predicted_rto', 0) for s in batch_summaries),
            'risk_distribution': {
                'high_risk': sum(s.get('risk_distribution', {}).get('high_risk', 0) for s in batch_summaries),
                'medium_risk': sum(s.get('risk_distribution', {}).get('medium_risk', 0) for s in batch_summaries),
                'low_risk': sum(s.get('risk_distribution', {}).get('low_risk', 0) for s in batch_summaries)
            }
        }
        
        # Calculate derived metrics
        if combined['total_orders'] > 0:
            combined['rto_rate'] = combined['predicted_rto'] / combined['total_orders']
            combined['average_risk_score'] = np.mean([
                s.get('average_risk_score', 0.5) for s in batch_summaries
            ])
        
        return combined