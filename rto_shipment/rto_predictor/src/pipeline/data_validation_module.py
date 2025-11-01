"""
Data Validation and Quality Assessment Module
Handles all data validation, quality checks, and input verification
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class DataValidationError(Exception):
    """Custom exception for data validation errors"""
    pass


class DataQualityError(Exception):
    """Custom exception for data quality issues"""
    pass


class DataValidator:
    """
    Handles all data validation and quality assessment operations
    """
    
    def __init__(self, preprocessing_config):
        self.preprocessing_config = preprocessing_config
    
    def validate_data(self, df: pd.DataFrame, is_training: bool = False) -> Dict[str, Any]:
        """
        Validate data and return validation results

        Args:
            df: DataFrame to validate
            is_training: Whether this is training data (requires RTO_STATUS)

        Returns:
            Dictionary with validation results
        """
        logger.info("Validating input data...")
        errors = []
        warnings = []

        try:
            # Check if dataframe is empty
            if df.empty:
                errors.append("Input dataframe is empty")
                return {'valid': False, 'errors': errors, 'warnings': warnings}

            # Check required columns
            missing_cols = [col for col in self.preprocessing_config.required_columns
                           if col not in df.columns]
            if missing_cols:
                errors.append(f"Missing required columns: {missing_cols}")

            # For training data, check for RTO_STATUS column
            if is_training and 'RTO_STATUS' not in df.columns:
                errors.append("Training data must contain RTO_STATUS column")

            # Check data types and ranges
            if 'CUSTOMER_PHONE' in df.columns:
                phone_lengths = df['CUSTOMER_PHONE'].astype(str).str.len()
                if phone_lengths.min() < 5 or phone_lengths.max() > 15:
                    warnings.append("Some phone numbers have unusual lengths")

            if 'INVOICE_VALUE' in df.columns:
                if df['INVOICE_VALUE'].min() < 0:
                    errors.append("INVOICE_VALUE cannot be negative")
                if df['INVOICE_VALUE'].max() > 1000000:  # 10 lakh
                    warnings.append("Some orders have very high invoice values")

            # Check for excessive missing values
            missing_percentages = (df.isnull().sum() / len(df)) * 100
            critical_missing = missing_percentages[missing_percentages > 50]
            if not critical_missing.empty:
                warnings.append(f"Columns with >50% missing values: {list(critical_missing.index)}")

            logger.info("Input data validation completed")

            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings,
                'row_count': len(df),
                'column_count': len(df.columns)
            }

        except Exception as e:
            logger.error(f"Validation error: {e}")
            return {
                'valid': False,
                'errors': [str(e)],
                'warnings': warnings
            }

    def validate_input_data(self, df: pd.DataFrame) -> None:
        """Comprehensive input data validation (raises exceptions)"""
        result = self.validate_data(df, is_training=False)
        if not result['valid']:
            raise DataValidationError(f"Validation failed: {result['errors']}")
    
    def data_quality_checks(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive data quality assessment"""
        quality_report = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'duplicate_rows': df.duplicated().sum(),
            'missing_value_percentage': (df.isnull().sum() / len(df) * 100).to_dict(),
            'data_types_correct': True,
            'outlier_count': 0,
            'quality_score': 0.0,
            'timestamp': datetime.now().isoformat()
        }
        
        # Check for critical quality issues
        if quality_report['duplicate_rows'] > len(df) * 0.1:  # >10% duplicates
            raise DataQualityError(f"Too many duplicate rows: {quality_report['duplicate_rows']}")
        
        # Calculate quality score
        missing_penalty = sum([pct for pct in quality_report['missing_value_percentage'].values() if pct > 10])
        duplicate_penalty = (quality_report['duplicate_rows'] / len(df)) * 50
        
        quality_report['quality_score'] = max(0, 100 - missing_penalty - duplicate_penalty)
        
        return quality_report