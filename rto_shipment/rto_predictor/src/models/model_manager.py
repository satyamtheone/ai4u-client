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
    
    def _create_backup(self):
        """Create backup of current model before training"""
        if self.model is not None:
            try:
                backup_dir = Path(self.pipeline_config.backup_dir) / datetime.now().strftime('%Y_%m_%d_%H')
                backup_dir.mkdir(exist_ok=True)
                
                joblib.dump(self.model, backup_dir / "model_backup.pkl")
                joblib.dump(self.label_encoders, backup_dir / "encoders_backup.pkl")
                joblib.dump(self.scaler, backup_dir / "scaler_backup.pkl")
                
                logger.info(f"Model backup created at: {backup_dir}")
                
            except Exception as e:
                logger.warning(f"Failed to create backup: {e}")
    
    def _save_model_snapshot(self):
        """Save model snapshot with timestamp and versioning"""
        
        timestamp = datetime.now().strftime("%Y_%m_%d_%H")
        snapshot_dir = Path(self.pipeline_config.model_dir) / timestamp
        snapshot_dir.mkdir(exist_ok=True)
        
        try:
            # Save model and preprocessors
            joblib.dump(self.model, snapshot_dir / "model.pkl")
            joblib.dump(self.label_encoders, snapshot_dir / "label_encoders.pkl")
            joblib.dump(self.scaler, snapshot_dir / "scaler.pkl")
            joblib.dump(self.feature_columns, snapshot_dir / "feature_columns.pkl")
            
            # Save configuration
            config_data = {
                'preprocessing_config': {
                    'max_processing_time': self.preprocessing_config.max_processing_time,
                    'batch_size': self.preprocessing_config.batch_size,
                    'required_columns': self.preprocessing_config.required_columns
                },
                'model_config': {
                    'retrain_threshold': self.model_config.retrain_threshold,
                    'min_training_samples': self.model_config.min_training_samples
                },
                'model_version': timestamp
            }
            
            with open(snapshot_dir / "config.json", 'w') as f:
                json.dump(config_data, f, indent=2)
            
            # Save performance metrics
            with open(snapshot_dir / "performance_metrics.json", 'w') as f:
                json.dump({
                    'courier_performance': dict(self.courier_performance),
                    'pincode_stats': dict(self.pincode_stats),
                    'feature_importance': self._get_feature_importance(),
                    'health_status': self.health_status,
                    'timestamp': datetime.now().isoformat()
                }, f, indent=2)
            
            # Create symlink to latest
            latest_link = Path(self.pipeline_config.model_dir) / "latest"
            if latest_link.exists():
                latest_link.unlink()
            latest_link.symlink_to(snapshot_dir)
            
            # Store model version
            self.model_version = timestamp
            
            logger.info(f"Model snapshot saved to {snapshot_dir}")
            
            # Cleanup old snapshots
            self._cleanup_old_snapshots()
            
        except Exception as e:
            logger.error(f"Error saving model snapshot: {e}")
    
    def _cleanup_old_snapshots(self):
        """Clean up old model snapshots based on retention policy"""
        try:
            model_dir = Path(self.pipeline_config.model_dir)
            snapshots = [d for d in model_dir.iterdir() if d.is_dir() and d.name != 'latest']
            
            # Sort by creation time
            snapshots.sort(key=lambda x: x.stat().st_ctime, reverse=True)
            
            # Keep only recent snapshots based on retention policy
            retention_days = self.model_config.model_snapshot_retention_days
            cutoff_time = time.time() - (retention_days * 24 * 60 * 60)
            
            for snapshot in snapshots:
                if snapshot.stat().st_ctime < cutoff_time:
                    import shutil
                    shutil.rmtree(snapshot)
                    logger.info(f"Cleaned up old snapshot: {snapshot}")
                    
        except Exception as e:
            logger.warning(f"Error cleaning up old snapshots: {e}")
    
    def load_model_snapshot(self, date: str = None):
        """Load model snapshot from specific date or latest"""
        
        model_dir = Path(self.pipeline_config.model_dir)
        
        if date is None:
            # Use latest symlink if available
            latest_link = model_dir / "latest"
            if latest_link.exists():
                snapshot_dir = latest_link.resolve()
            else:
                # Find latest snapshot
                snapshots = [d for d in model_dir.iterdir() if d.is_dir() and d.name != 'latest']
                if not snapshots:
                    raise ModelNotFoundError("No model snapshots found")
                snapshot_dir = max(snapshots, key=lambda x: x.name)
        else:
            snapshot_dir = model_dir / date
            if not snapshot_dir.exists():
                raise ModelNotFoundError(f"No snapshot found for date {date}")
        
        try:
            # Load model and preprocessors
            self.model = joblib.load(snapshot_dir / "model.pkl")
            self.label_encoders = joblib.load(snapshot_dir / "label_encoders.pkl")
            self.scaler = joblib.load(snapshot_dir / "scaler.pkl")
            self.feature_columns = joblib.load(snapshot_dir / "feature_columns.pkl")
            
            # Load configuration if available
            config_file = snapshot_dir / "config.json"
            if config_file.exists():
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
                    self.model_version = config_data.get('model_version', 'unknown')
            
            # Load performance metrics
            metrics_file = snapshot_dir / "performance_metrics.json"
            if metrics_file.exists():
                with open(metrics_file, 'r') as f:
                    metrics = json.load(f)
                    self.courier_performance = defaultdict(dict, metrics.get('courier_performance', {}))
                    self.pincode_stats = defaultdict(dict, metrics.get('pincode_stats', {}))
            
            # Update health status
            self.health_status['model_loaded'] = True
            
            logger.info(f"Model snapshot loaded from {snapshot_dir}")
            
        except Exception as e:
            logger.error(f"Error loading model snapshot: {e}")
            raise ModelNotFoundError(f"Failed to load model: {e}")
    
    def retrain_with_new_data(self, new_data: pd.DataFrame, retrain_threshold: float = None) -> Optional[Dict[str, Any]]:
        """
        Retrain model with new data if performance degradation is detected
        
        Args:
            new_data: New training data
            retrain_threshold: Minimum performance degradation to trigger retraining
        """
        if retrain_threshold is None:
            retrain_threshold = self.model_config.retrain_threshold
            
        logger.info("Checking if retraining is needed...")
        
        if self.model is None:
            logger.info("No existing model found. Training from scratch...")
            return self.train_model(new_data)
        
        try:
            # Evaluate current model on new data (if it has labels)
            if 'CURRENT_STATUS' in new_data.columns:
                new_data_processed = self.preprocess_data(new_data, is_training=True)
                X_new = self.prepare_features(new_data_processed)
                y_new = new_data_processed['RTO_TARGET'].values
                
                if len(X_new) > 0:
                    X_new_scaled = self.scaler.transform(X_new)
                    current_score = roc_auc_score(y_new, self.model.predict_proba(X_new_scaled)[:, 1])
                    
                    # If performance degradation exceeds threshold, retrain
                    baseline_score = getattr(self, 'last_training_score', 0.8)
                    performance_drop = baseline_score - current_score
                    
                    logger.info(f"Performance check: baseline={baseline_score:.4f}, current={current_score:.4f}, drop={performance_drop:.4f}")
                    
                    if performance_drop > retrain_threshold:
                        logger.info(f"Performance degraded beyond threshold ({retrain_threshold}). Retraining...")
                        
                        # Combine with historical data if available
                        if self.historical_data is not None:
                            combined_data = pd.concat([self.historical_data, new_data], ignore_index=True)
                        else:
                            combined_data = new_data
                        
                        return self.train_model(combined_data)
                    else:
                        logger.info(f"Performance acceptable. No retraining needed.")
                        return None
            
            # If no performance evaluation possible, just add to historical data
            logger.info("Adding new data to historical dataset...")
            if self.historical_data is not None:
                self.historical_data = pd.concat([self.historical_data, new_data], ignore_index=True)
            else:
                self.historical_data = new_data.copy()
            
            return None
            
        except Exception as e:
            logger.error(f"Error in retrain evaluation: {e}")
            return None
    