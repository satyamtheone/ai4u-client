
class ProductionRTOPredictor:
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
    
    @timeout_handler(300)  # 5 minute timeout
    @retry_on_failure(max_retries=3)
    @monitor_performance
    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        """Enhanced preprocessing with error handling and monitoring"""
        logger.info(f"Starting preprocessing for {'training' if is_training else 'prediction'} data...")
        
        with processing_transaction() as checkpoints:
            try:
                # Validate input data
                self._validate_input_data(df)
                
                # Create checkpoint
                df_checkpoint = df.copy()
                checkpoints.append(('input_validation', df_checkpoint))
                
                # Perform quality checks
                quality_report = self._data_quality_checks(df)
                self.metrics_collector.record_metric('data_quality_score', quality_report['quality_score'])
                
                if quality_report['quality_score'] < 60:
                    logger.warning(f"Low data quality score: {quality_report['quality_score']}")
                
                # Original preprocessing steps (maintaining backward compatibility)
                df = df.copy()
                
                # Enhanced processing with error handling
                processing_steps = [
                    ('handle_missing_values', self._handle_missing_values),
                    ('create_temporal_features', self._create_temporal_features),
                    ('create_geographic_features', self._create_geographic_features),
                    ('create_features', self._create_features),
                    ('create_attempt_features', self._create_attempt_features),
                    ('create_customer_features', self._create_customer_features),
                    ('clean_text_fields', self._clean_text_fields),
                    ('process_phone_numbers', self._process_phone_numbers),
                    ('process_addresses', self._process_addresses),
                ]
                
                for step_name, step_func in processing_steps:
                    try:
                        logger.debug(f"Executing preprocessing step: {step_name}")
                        df = step_func(df)
                        checkpoints.append((step_name, df.copy()))
                        
                    except Exception as e:
                        logger.error(f"Error in preprocessing step {step_name}: {e}")
                        # Try to continue with previous checkpoint
                        if checkpoints:
                            df = checkpoints[-1][1]
                        raise
                
                # Create target variable for training
                if is_training and 'CURRENT_STATUS' in df.columns:
                    df['RTO_TARGET'] = df['CURRENT_STATUS'].apply(self._create_target)
                
                # Encode categorical variables
                df = self._encode_categorical(df, is_training)
                
                # Handle outliers
                df = self._handle_outliers(df)
                
                # Feature scaling if scaler exists
                if hasattr(self, 'scaler') and self.scaler is not None:
                    df = self._scale_features(df)
                
                logger.info("Data preprocessing completed successfully")
                return df
                
            except Exception as e:
                self.health_status['error_count'] += 1
                logger.error(f"Preprocessing failed: {e}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise
    
    @timeout_handler(600)  # 10 minute timeout for training
    @monitor_performance
    def train_model(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Enhanced model training with comprehensive monitoring"""
        logger.info("Starting model training...")
        
        try:
            # Use circuit breaker if enabled
            if self.circuit_breaker:
                return self.circuit_breaker.call(self._train_model_internal, df)
            else:
                return self._train_model_internal(df)
                
        except Exception as e:
            self.health_status['error_count'] += 1
            logger.error(f"Model training failed: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def _train_model_internal(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Internal training method"""
        
        # Create backup before training
        self._create_backup()
        
        # Preprocess training data
        df_processed = self.preprocess_data(df, is_training=True)
        
        # Check if target exists
        if 'RTO_TARGET' not in df_processed.columns:
            raise ValueError("Training data must contain status information for target creation")
        
        # Save processed training data for debugging
        timestamp = datetime.now().strftime('%Y%m%d')
        processed_data_path = Path(self.pipeline_config.output_dir) / f"processed_training_data_{timestamp}.csv"
        df_processed.to_csv(processed_data_path, index=False)
        logger.info(f"Processed training data saved to: {processed_data_path}")
        
        # Check class balance
        self.check_class_balance(df_processed)
        
        # Prepare features and target
        X = self.prepare_features(df_processed)
        y = df_processed['RTO_TARGET'].values
        
        logger.info(f"Training data shape: {X.shape}, Target distribution: {np.bincount(y)}")
        
        # Validate minimum training samples
        if len(X) < self.model_config.min_training_samples:
            raise ValueError(f"Insufficient training data: {len(X)} < {self.model_config.min_training_samples}")
        
        # Split data with stratification
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train multiple models and select the best
        models = {
            'RandomForest': RandomForestClassifier(
                n_estimators=100, max_depth=15, random_state=42, 
                class_weight='balanced', n_jobs=-1
            ),
            'GradientBoosting': GradientBoostingClassifier(
                n_estimators=100, max_depth=6, random_state=42
            ),
            'LogisticRegression': LogisticRegression(
                random_state=42, class_weight='balanced', max_iter=1000
            )
        }
        
        best_model = None
        best_score = 0
        model_results = {}
        
        for name, model in models.items():
            logger.info(f"Training {name}...")
            
            try:
                # Cross-validation
                cv_scores = cross_val_score(
                    model, X_train_scaled, y_train, 
                    cv=self.model_config.cross_validation_folds, 
                    scoring='roc_auc'
                )
                
                # Train on full training set
                model.fit(X_train_scaled, y_train)
                
                # Test predictions
                y_pred = model.predict(X_test_scaled)
                y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
                
                # Calculate metrics
                auc_score = roc_auc_score(y_test, y_pred_proba)
                
                model_results[name] = {
                    'cv_mean': cv_scores.mean(),
                    'cv_std': cv_scores.std(),
                    'test_auc': auc_score,
                    'classification_report': classification_report(y_test, y_pred, output_dict=True)
                }
                
                logger.info(f"{name} - CV AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}, Test AUC: {auc_score:.4f}")
                
                if auc_score > best_score:
                    best_score = auc_score
                    best_model = model
                    
            except Exception as e:
                logger.error(f"Error training {name}: {e}")
                model_results[name] = {'error': str(e)}
        
        if best_model is None:
            raise RuntimeError("No model was successfully trained")
        
        self.model = best_model
        self.last_training_score = best_score
        
        # Store historical data for similarity matching
        self.historical_data = df_processed.copy()
        
        # Calculate performance metrics
        self._calculate_performance_metrics(df_processed)
        
        # Update health status
        self.health_status['model_loaded'] = True
        self.health_status['last_training'] = datetime.now().isoformat()
        
        # Save model snapshot
        self._save_model_snapshot()
        
        logger.info("Model training completed successfully")
        
        return {
            'best_model': type(best_model).__name__,
            'best_score': best_score,
            'model_results': model_results,
            'feature_importance': self._get_feature_importance(),
            'training_timestamp': datetime.now().isoformat(),
            'data_quality_score': getattr(self, '_last_quality_score', None)
        }
    
    @timeout_handler(180)  # 3 minute timeout for predictions
    @monitor_performance
    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Enhanced prediction with comprehensive error handling"""
        if self.model is None:
            raise ModelNotFoundError("Model not trained. Please train the model first.")
        
        logger.info(f"Making predictions for {len(df)} orders...")
        
        try:
            # Use circuit breaker if enabled
            if self.circuit_breaker:
                return self.circuit_breaker.call(self._predict_internal, df)
            else:
                return self._predict_internal(df)
                
        except Exception as e:
            self.health_status['error_count'] += 1
            logger.error(f"Prediction failed: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def _predict_internal(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Internal prediction method"""
        
        # Preprocess prediction data
        df_processed = self.preprocess_data(df, is_training=False)
        
        # Prepare features
        X = self.prepare_features(df_processed)
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        
        # Generate explanations and recommendations
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
                    'risk_level': self._get_risk_level(prob),
                    'explanation': self._generate_explanation(order_data, prob),
                    'recommendations': self._generate_recommendations(order_data, prob),
                    'similar_orders': self._find_similar_orders(order_data),
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
        
        # Update health status
        self.health_status['last_prediction'] = datetime.now().isoformat()
        
        logger.info("Predictions completed successfully")
        
        return {
            'predictions': results,
            'summary': self._generate_summary(df_processed, predictions, probabilities),
            'prediction_timestamp': datetime.now().isoformat(),
            'model_version': getattr(self, 'model_version', 'unknown')
        }