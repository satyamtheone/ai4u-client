class FeatureEngineering:
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
    
    def _create_target(self, status: str) -> int:
        """Create binary target variable from status"""
        if pd.isna(status):
            return 0
        
        status = str(status).upper()
        # RTO cases
        if any(rto_keyword in status for rto_keyword in ['RTO', 'RETURN', 'UNDELIVERABLE', 'UNDELIVERED', 'RTO-INTRANSIT', 'RTO-DELIVERED', 'RTO-OFD']):
            return 1
        
        # Delivered cases
        if 'O-DELIVERED' in status and 'RTO' not in status:
            return 0
        
        # Default to non-RTO for ambiguous cases
        return 0

    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare feature matrix for ML model with enhanced error handling"""
        
        # Select relevant features based on importance
        feature_cols = [
            'CLIENT_NAME_ENCODED', 'COURIER_NAME_ENCODED', 'CUSTOMER_CITY_ENCODED',
            'CUSTOMER_STATE_ENCODED', 'PAYMENT_MODE_ENCODED', 'ZONE_ENCODED',
            'WEIGHT', 'QTY', 'INVOICE_VALUE', 'ZONE_RISK', 'IS_COD',
            'HIGH_VALUE_ORDER', 'WEIGHT_PER_ITEM', 'VALUE_PER_ITEM',
            'PHONE_LENGTH', 'PHONE_VALID', 'ADDRESS_LENGTH', 'ADDRESS_WORD_COUNT',
            'ADDRESS_RISK_KEYWORDS', 'ORDER_HOUR', 'ORDER_DAY_OF_WEEK', 'ORDER_MONTH'
        ]
        
        # Select only available columns
        available_cols = [col for col in feature_cols if col in df.columns]
        
        if not available_cols:
            raise ValueError("No valid feature columns found in the data")
        
        self.feature_columns = available_cols
        X = df[available_cols].copy()
        
        # Handle any remaining missing values
        X = X.fillna(0)
        
        # Validate feature matrix
        if X.isnull().any().any():
            logger.warning("Feature matrix still contains null values after preprocessing")
            X = X.fillna(0)
        
        return X.values
    