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
    
    def validate_input_data(self, df: pd.DataFrame) -> None:
        """Comprehensive input data validation"""
        logger.info("Validating input data...")
        
        # Check if dataframe is empty
        if df.empty:
            raise DataValidationError("Input dataframe is empty")
        
        # Check required columns
        missing_cols = [col for col in self.preprocessing_config.required_columns 
                       if col not in df.columns]
        if missing_cols:
            raise DataValidationError(f"Missing required columns: {missing_cols}")
        
        # Check data types and ranges
        if 'CUSTOMER_PHONE' in df.columns:
            # Check if phone numbers are reasonable
            phone_lengths = df['CUSTOMER_PHONE'].astype(str).str.len()
            if phone_lengths.min() < 5 or phone_lengths.max() > 15:
                logger.warning("Some phone numbers have unusual lengths")
        
        if 'INVOICE_VALUE' in df.columns:
            if df['INVOICE_VALUE'].min() < 0:
                raise DataValidationError("INVOICE_VALUE cannot be negative")
            if df['INVOICE_VALUE'].max() > 1000000:  # 10 lakh
                logger.warning("Some orders have very high invoice values")
        
        # Check for excessive missing values
        missing_percentages = (df.isnull().sum() / len(df)) * 100
        critical_missing = missing_percentages[missing_percentages > 50]
        if not critical_missing.empty:
            logger.warning(f"Columns with >50% missing values: {critical_missing.to_dict()}")
        
        logger.info("Input data validation completed")
    
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