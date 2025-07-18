class DataPreprocessor:
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
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced missing value handling with fallbacks"""
        logger.debug("Handling missing values...")
        
        # Critical columns - use specific strategies
        critical_cols = ['CUSTOMER_PHONE', 'CUSTOMER_ADDRESS', 'PAYMENT_MODE']
        
        for col in critical_cols:
            if col in df.columns:
                # Flag missing values as features
                df[f'{col}_MISSING'] = df[col].isna().astype(int)
                
                # Use fallback values from config
                fallback_value = self.preprocessing_config.fallback_values.get(col, 'Unknown')
                df[col] = df[col].fillna(fallback_value)
        
        # Fill missing numerical values with median
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            if col in df.columns:
                median_val = df[col].median()
                if pd.isna(median_val):
                    median_val = 0  # Fallback if all values are missing
                df[col] = df[col].fillna(median_val)
        
        # Fill missing categorical values with mode or 'Unknown'
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if col in df.columns:
                mode_val = df[col].mode()
                fill_value = mode_val[0] if not mode_val.empty else 'Unknown'
                df[col] = df[col].fillna(fill_value)
        
        return df
    
    def _create_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create time-based features"""
        logger.debug("Creating temporal features...")
        
        try:
            if 'ORDER_CREATION_DATE' in df.columns:
                df['ORDER_CREATION_DATE'] = pd.to_datetime(df['ORDER_CREATION_DATE'], errors='coerce')
                df['ORDER_DAY_OF_WEEK'] = df['ORDER_CREATION_DATE'].dt.dayofweek
                df['IS_WEEKEND_ORDER'] = df['ORDER_DAY_OF_WEEK'].isin([5, 6]).astype(int)
                df['ORDER_MONTH'] = df['ORDER_CREATION_DATE'].dt.month
                df['ORDER_HOUR'] = df['ORDER_CREATION_DATE'].dt.hour
            
            if 'DELIVERY_DATE' in df.columns:
                df['DELIVERY_DATE'] = pd.to_datetime(df['DELIVERY_DATE'], errors='coerce')
                df['DELIVERY_DAY_OF_WEEK'] = df['DELIVERY_DATE'].dt.dayofweek
            
            # Time gaps
            if 'ORDER_CREATION_DATE' in df.columns and 'PICKUP_DATE' in df.columns:
                df['PICKUP_DATE'] = pd.to_datetime(df['PICKUP_DATE'], errors='coerce')
                df['ORDER_TO_PICKUP_DAYS'] = (df['PICKUP_DATE'] - df['ORDER_CREATION_DATE']).dt.days
                df['ORDER_TO_PICKUP_DAYS'] = df['ORDER_TO_PICKUP_DAYS'].fillna(0)
        
        except Exception as e:
            logger.warning(f"Error creating temporal features: {e}")
        
        return df
    
    def _create_geographic_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create location-based risk features"""
        logger.debug("Creating geographic features...")
        
        try:
            # Zone-based features
            if 'ZONE' in df.columns:
                metro_zones = ['Metro', 'A', 'Within City']
                df['IS_METRO_ZONE'] = df['ZONE'].isin(metro_zones).astype(int)
            
            # Historical RTO rates by location (if available)
            if hasattr(self, 'pincode_stats') and self.pincode_stats:
                if 'PINCODE' in df.columns:
                    df['PINCODE_RTO_RATE'] = df['PINCODE'].map(
                        {k: v.get('rto_rate', 0.2) for k, v in self.pincode_stats.items()}
                    ).fillna(0.2)  # Default rate
            
        except Exception as e:
            logger.warning(f"Error creating geographic features: {e}")
        
        return df
    
    def _create_attempt_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create features from delivery attempt patterns"""
        logger.debug("Creating attempt features...")
        
        try:
            if 'ATTEMPT_COUNT' in df.columns:
                df['ATTEMPT_COUNT'] = df['ATTEMPT_COUNT'].fillna(0)
                df['HIGH_ATTEMPT_COUNT'] = (df['ATTEMPT_COUNT'] > 2).astype(int)
            
            if 'FIRST_ATTEMPT_DATE' in df.columns and 'PICKUP_DATE' in df.columns:
                df['FIRST_ATTEMPT_DATE'] = pd.to_datetime(df['FIRST_ATTEMPT_DATE'], errors='coerce')
                df['PICKUP_DATE'] = pd.to_datetime(df['PICKUP_DATE'], errors='coerce')
                df['FIRST_ATTEMPT_DELAY'] = (df['FIRST_ATTEMPT_DATE'] - df['PICKUP_DATE']).dt.days
                df['FIRST_ATTEMPT_DELAY'] = df['FIRST_ATTEMPT_DELAY'].fillna(0)
        
        except Exception as e:
            logger.warning(f"Error creating attempt features: {e}")
        
        return df
    
    def _create_customer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create customer-specific features"""
        logger.debug("Creating customer features...")
        
        try:
            if 'CUSTOMER_NAME' in df.columns:
                df['CUSTOMER_NAME_LENGTH'] = df['CUSTOMER_NAME'].astype(str).str.len()
                df['CUSTOMER_NAME_HAS_TITLE'] = df['CUSTOMER_NAME'].astype(str).str.contains(
                    'Mr|Ms|Dr|Mrs', case=False, na=False
                ).astype(int)
        
        except Exception as e:
            logger.warning(f"Error creating customer features: {e}")
        
        return df
    
    # Keep all original methods for backward compatibility
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features for better prediction"""
        
        # Date features
        if 'ORDER_CREATION_DATE' in df.columns:
            try:
                df['ORDER_CREATION_DATE'] = pd.to_datetime(df['ORDER_CREATION_DATE'], errors='coerce')
                df['ORDER_HOUR'] = df['ORDER_CREATION_DATE'].dt.hour
                df['ORDER_DAY_OF_WEEK'] = df['ORDER_CREATION_DATE'].dt.dayofweek
                df['ORDER_MONTH'] = df['ORDER_CREATION_DATE'].dt.month
            except Exception as e:
                logger.warning(f"Error processing ORDER_CREATION_DATE: {e}")
        
        # Weight per quantity ratio
        if 'WEIGHT' in df.columns and 'QTY' in df.columns:
            df['WEIGHT_PER_ITEM'] = df['WEIGHT'] / df['QTY'].replace(0, 1)
        
        # Value per item
        if 'INVOICE_VALUE' in df.columns and 'QTY' in df.columns:
            df['VALUE_PER_ITEM'] = df['INVOICE_VALUE'] / df['QTY'].replace(0, 1)
        
        # High value order flag
        if 'INVOICE_VALUE' in df.columns:
            df['HIGH_VALUE_ORDER'] = (df['INVOICE_VALUE'] > df['INVOICE_VALUE'].quantile(0.75)).astype(int)
        
        # COD flag
        if 'PAYMENT_MODE' in df.columns:
            df['IS_COD'] = (df['PAYMENT_MODE'] == 'COD').astype(int)
        
        # Zone risk factor
        zone_risk = {'Within City': 1, 'Within Zone': 2, 'Rest Of India': 3, 'Special Zone': 4}
        if 'ZONE' in df.columns:
            df['ZONE_RISK'] = df['ZONE'].map(zone_risk).fillna(3)
        
        return df
    
    def _clean_text_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize text fields"""
        
        text_columns = ['CUSTOMER_NAME', 'CUSTOMER_ADDRESS', 'ITEM_DESCRIPTION']
        
        for col in text_columns:
            if col in df.columns:
                try:
                    # Convert to string and clean
                    df[col] = df[col].astype(str)
                    df[col] = df[col].str.lower()
                    df[col] = df[col].str.replace(r'[^\w\s]', ' ', regex=True)
                    df[col] = df[col].str.replace(r'\s+', ' ', regex=True)
                    df[col] = df[col].str.strip()
                except Exception as e:
                    logger.warning(f"Error cleaning text field {col}: {e}")
        
        return df
    
    def _process_phone_numbers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from phone numbers"""
        
        if 'CUSTOMER_PHONE' in df.columns:
            try:
                df['CUSTOMER_PHONE'] = df['CUSTOMER_PHONE'].astype(str)
                
                # Extract phone features
                df['PHONE_LENGTH'] = df['CUSTOMER_PHONE'].str.len()
                df['PHONE_STARTS_WITH'] = df['CUSTOMER_PHONE'].str[:2]
                
                # Check for valid phone patterns
                df['PHONE_VALID'] = df['CUSTOMER_PHONE'].str.match(r'^\d{10}$').astype(int)
                
                # Create phone hash for privacy (first 3 and last 2 digits)
                df['PHONE_PATTERN'] = df['CUSTOMER_PHONE'].str[:3] + 'XXX' + df['CUSTOMER_PHONE'].str[-2:]
            except Exception as e:
                logger.warning(f"Error processing phone numbers: {e}")
        
        return df
    
    def _process_addresses(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from addresses"""
        
        if 'CUSTOMER_ADDRESS' in df.columns:
            try:
                # Address length
                df['ADDRESS_LENGTH'] = df['CUSTOMER_ADDRESS'].str.len()
                
                # Count of address components
                df['ADDRESS_WORD_COUNT'] = df['CUSTOMER_ADDRESS'].str.split().str.len()
                
                # Check for specific keywords that might indicate delivery difficulty
                risky_keywords = ['village', 'remote', 'interior', 'hills', 'tribal']
                df['ADDRESS_RISK_KEYWORDS'] = df['CUSTOMER_ADDRESS'].str.contains(
                    '|'.join(risky_keywords), case=False, na=False
                ).astype(int)
                
                # Address completeness features
                df['ADDRESS_COMPLETENESS'] = df['ADDRESS_LENGTH'] / 100
                df['ADDRESS_HAS_LANDMARK'] = df['CUSTOMER_ADDRESS'].str.contains(
                    'near|opp|beside', case=False, na=False
                ).astype(int)
                df['ADDRESS_HAS_FLAT_NO'] = df['CUSTOMER_ADDRESS'].str.contains(
                    r'\d+', na=False
                ).astype(int)
            except Exception as e:
                logger.warning(f"Error processing addresses: {e}")
        
        return df
    
    def _encode_categorical(self, df: pd.DataFrame, is_training: bool) -> pd.DataFrame:
        """Enhanced categorical encoding with error handling"""
        
        categorical_columns = [
            'CLIENT_NAME', 'COURIER_NAME', 'CUSTOMER_CITY', 
            'CUSTOMER_STATE', 'PAYMENT_MODE', 'ZONE'
        ]
        
        for col in categorical_columns:
            if col in df.columns:
                try:
                    if is_training:
                        # Fit new encoder for training
                        self.label_encoders[col] = LabelEncoder()
                        df[f'{col}_ENCODED'] = self.label_encoders[col].fit_transform(df[col].astype(str))
                    else:
                        # Use existing encoder for prediction
                        if col in self.label_encoders:
                            # Handle unseen categories gracefully
                            known_categories = set(self.label_encoders[col].classes_)
                            df[col] = df[col].astype(str)
                            
                            # Map unseen categories to 'Unknown'
                            df[col] = df[col].apply(lambda x: x if x in known_categories else 'Unknown')
                            
                            # Add 'Unknown' to encoder if not present
                            if 'Unknown' not in known_categories:
                                self.label_encoders[col].classes_ = np.append(
                                    self.label_encoders[col].classes_, 'Unknown'
                                )
                            
                            df[f'{col}_ENCODED'] = self.label_encoders[col].transform(df[col])
                        else:
                            # Default encoding for missing encoder
                            logger.warning(f"No encoder found for {col}, using default value")
                            df[f'{col}_ENCODED'] = 0
                            
                except Exception as e:
                    logger.error(f"Error encoding column {col}: {e}")
                    # Fallback to simple encoding
                    df[f'{col}_ENCODED'] = 0
        
        return df
    
    def _handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle outliers in numerical columns"""
        logger.debug("Handling outliers...")
        
        numerical_columns = ['WEIGHT', 'INVOICE_VALUE', 'QTY', 'COLLECTABLE_AMOUNT']
        
        for col in numerical_columns:
            if col in df.columns:
                try:
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    
                    # Define outlier bounds
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    # Cap outliers instead of removing them
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                    
                except Exception as e:
                    logger.warning(f"Error handling outliers for {col}: {e}")
        
        return df
    
    def _scale_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numerical features if scaler exists"""
        if self.scaler is None:
            return df
        
        try:
            numerical_features = df.select_dtypes(include=[np.number]).columns
            if len(numerical_features) > 0:
                df[numerical_features] = self.scaler.transform(df[numerical_features])
        except Exception as e:
            logger.warning(f"Error scaling features: {e}")
        
        return df
    