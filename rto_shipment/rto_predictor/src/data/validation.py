
class ValidationPipeline:
    """
    Production-ready RTO (Return to Origin) Prediction Pipeline
    
    Enhanced with monitoring, error handling, validation, and fault tolerance
    """
    
    def __init__(self, 
                 preprocessing_config: PreprocessingConfig = None,
                 model_config: ModelConfig = None,
                 pipeline_config: PipelineConfig = None):
        """Initialize the production RTO Predictor"""
        
        # Initialize configurations
        self.preprocessing_config = preprocessing_config or PreprocessingConfig()
        self.model_config = model_config or ModelConfig()
        self.pipeline_config = pipeline_config or PipelineConfig()
        
        # Setup directories
        self._setup_directories()
        
        # Initialize monitoring
        self.metrics_collector = MetricsCollector()
        
        # Initialize circuit breaker
        if self.pipeline_config.enable_circuit_breaker:
            self.circuit_breaker = CircuitBreaker(
                self.pipeline_config.circuit_breaker_threshold,
                self.pipeline_config.circuit_breaker_timeout
            )
        else:
            self.circuit_breaker = None
        
        # Feature importance weights (keeping backward compatibility)
        self.feature_weights = {
            'CLIENT_NAME': 0.1,      # Very Low
            'CUSTOMER_NAME': 0.2,    # Low
            'CUSTOMER_PHONE': 0.95,  # Very High
            'CUSTOMER_ADDRESS': 0.95,# Very High
            'CUSTOMER_CITY': 0.3,    # Low or based on history
            'CUSTOMER_STATE': 0.3,   # Low or based on history
            'PINCODE': 0.3,          # Low or based on history
            'PAYMENT_MODE': 0.8,     # High
            'COURIER_NAME': 0.8,     # High
            'ITEM_DESCRIPTION': 0.7, # High or based on history
            'WEIGHT': 0.2,           # Low
            'QTY': 0.2,              # Low
            'INVOICE_VALUE': 0.2,     # Low
            'ORDER_CREATION_DATE': 0.1, # Very Low
            'COLLECTABLE_AMOUNT': 0.1, # Very Low
            'EDD': 0.3,              # Very Low
            'ZONE': 0.3,             # Low or based on history
        }
        
        # Model components
        self.model = None
        self.label_encoders = {}
        self.scaler = None
        self.tfidf_vectorizer = None
        self.feature_columns = None
        self.historical_data = None
        
        # Performance tracking
        self.performance_metrics = {}
        self.courier_performance = defaultdict(dict)
        self.pincode_stats = defaultdict(dict)
        
        # Health check status
        self.health_status = {
            'model_loaded': False,
            'last_prediction': None,
            'last_training': None,
            'error_count': 0
        }
        
        logger.info("Production RTO Predictor initialized")
    
    def _setup_directories(self):
        """Setup required directories"""
        for dir_attr in ['data_dir', 'model_dir', 'output_dir', 'log_dir', 'backup_dir']:
            dir_path = Path(getattr(self.pipeline_config, dir_attr))
            dir_path.mkdir(exist_ok=True)
    
    @monitor_performance
    def _validate_input_data(self, df: pd.DataFrame) -> None:
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
    
    def _data_quality_checks(self, df: pd.DataFrame) -> Dict[str, Any]:
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
    