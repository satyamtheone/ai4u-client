class ProductionRTOPipelineManager:
    """
    Production-ready pipeline manager for end-to-end RTO prediction workflow
    Enhanced with monitoring, error handling, and fault tolerance
    """
    
    def __init__(self, config_path: str = None):
        """Initialize production pipeline manager"""
        
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Setup logging
        global logger
        logger = setup_production_logging(self.config.get('log_dir', 'logs'))
        
        # Initialize predictor with production configs
        preprocessing_config = PreprocessingConfig(**self.config.get('preprocessing', {}))
        model_config = ModelConfig(**self.config.get('model', {}))
        pipeline_config = PipelineConfig(**self.config.get('pipeline', {}))
        
        self.predictor = ProductionRTOPredictor(
            preprocessing_config, model_config, pipeline_config
        )
        
        # Setup directories
        self.setup_directories()
        
        # Initialize monitoring
        self.metrics_collector = self.predictor.metrics_collector
        self._start_time = time.time()
        
        logger.info("Production RTO Pipeline Manager initialized")
    
   
    @monitor_performance
    def process_new_orders(self, csv_path: str, batch_size: int = None, validate_predictions: bool = False) -> Dict[str, Any]:
        """
        Process new orders from CSV file with enhanced error handling and validation
        
        Args:
            csv_path: Path to CSV file with new orders
            batch_size: Optional batch size for processing large files
            validate_predictions: If True and actual outcomes are available, validate predictions
            
        Returns:
            Prediction results with optional validation metrics
        """
        logger.info(f"Processing new orders from {csv_path}")
        
        try:
            # Validate file exists and is readable
            if not os.path.exists(csv_path):
                raise FileNotFoundError(f"CSV file not found: {csv_path}")
            
            # Check file size and warn if very large
            file_size_mb = os.path.getsize(csv_path) / (1024 * 1024)
            if file_size_mb > 100:  # 100MB threshold
                logger.warning(f"Large file detected: {file_size_mb:.2f}MB. Consider batch processing.")
            
            # Read CSV with error handling and encoding detection
            try:
                # Try different encodings if needed
                for encoding in ['utf-8', 'latin1', 'cp1252']:
                    try:
                        df = pd.read_csv(csv_path, encoding=encoding)
                        logger.info(f"Successfully read CSV with {encoding} encoding")
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    raise DataValidationError("Could not read CSV with any supported encoding")
                    
            except Exception as e:
                raise DataValidationError(f"Error reading CSV file: {e}")
            
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
            
            # Load latest model if not already loaded
            if self.predictor.model is None:
                try:
                    self.predictor.load_model_snapshot()
                    logger.info("Loaded latest model snapshot")
                except Exception as e:
                    logger.error(f"No trained model found: {e}")
                    raise ModelNotFoundError("No trained model available. Please train the model first.")
            
            # Process in batches if file is large
            batch_size = batch_size or self.predictor.preprocessing_config.batch_size
            
            if len(df) > batch_size:
                logger.info(f"Processing large file in batches of {batch_size}")
                results = self._process_in_batches(df, batch_size)
            else:
                # Make predictions
                results = self.predictor.predict(df)
            
            # Enhanced results with validation if actual outcomes available
            if validate_predictions and 'CURRENT_STATUS' in df.columns:
                logger.info("Validating predictions against actual outcomes...")
                results = self._validate_predictions(results, df)
            
            # Enhanced results summary
            results = self._enhance_results_summary(results, df)
            
            # Save results with metadata
            self._save_prediction_results(results, csv_path)
            
            logger.info(f"Successfully processed {len(results['predictions'])} orders")
            return results
            
        except Exception as e:
            logger.error(f"Error processing new orders: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Log error metrics
            if hasattr(self, 'metrics_collector'):
                self.metrics_collector.record_metric('processing_errors', 1)
            
            # Return error result instead of crashing
            return {
                'error': str(e),
                'predictions': [],
                'summary': {'total_orders': 0, 'error': str(e)},
                'processing_timestamp': pd.Timestamp.now().isoformat()
            }

    
    def _process_in_batches(self, df: pd.DataFrame, batch_size: int) -> Dict[str, Any]:
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
                batch_results = self.predictor.predict(batch_df)
                all_predictions.extend(batch_results['predictions'])
                batch_summaries.append(batch_results['summary'])
                
            except Exception as e:
                logger.error(f"Error processing batch {i+1}: {e}")
                # Continue with other batches
                continue
        
        # Combine results
        combined_results = {
            'predictions': all_predictions,
            'summary': self._combine_batch_summaries(batch_summaries),
            'batch_processing': True,
            'total_batches': num_batches
        }
        
        return combined_results
    
    def _combine_batch_summaries(self, batch_summaries: List[Dict]) -> Dict:
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
    