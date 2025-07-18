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
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from file or use defaults"""
        
        default_config = {
            'data_dir': 'data',
            'model_dir': 'models',
            'output_dir': 'output',
            'log_dir': 'logs',
            'backup_dir': 'backups',
            'preprocessing': {
                'max_processing_time': 300,
                'batch_size': 10000,
                'memory_limit_mb': 2048,
                'required_columns': ['ORDER_NUMBER', 'CURRENT_STATUS', 'CUSTOMER_PHONE', 'CUSTOMER_ADDRESS', 'PAYMENT_MODE']
            },
            'model': {
                'retrain_threshold': 0.1,
                'min_training_samples': 100,
                'model_snapshot_retention_days': 30
            },
            'pipeline': {
                'enable_circuit_breaker': True,
                'circuit_breaker_threshold': 5,
                'circuit_breaker_timeout': 60
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                    # Deep merge configurations
                    for key, value in user_config.items():
                        if isinstance(value, dict) and key in default_config:
                            default_config[key].update(value)
                        else:
                            default_config[key] = value
            except Exception as e:
                logger.warning(f"Error loading config from {config_path}: {e}")
        
        return default_config
    
    def setup_directories(self):
        """Setup required directories"""
        for dir_name in ['data_dir', 'model_dir', 'output_dir', 'log_dir', 'backup_dir']:
            if dir_name in self.config:
                Path(self.config[dir_name]).mkdir(exist_ok=True)

    def _validate_predictions(self, results: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate predictions against actual outcomes if available
        
        Args:
            results: Prediction results
            df: Original dataframe with actual outcomes
            
        Returns:
            Enhanced results with validation metrics
        """
        try:
            # Extract actual outcomes
            actual_outcomes = []
            predicted_outcomes = []
            
            for i, pred in enumerate(results['predictions']):
                if i < len(df):
                    actual_status = df.iloc[i]['CURRENT_STATUS']
                    actual_rto = self.predictor._create_target(actual_status)
                    predicted_rto = pred['rto_prediction']
                    
                    actual_outcomes.append(actual_rto)
                    predicted_outcomes.append(int(predicted_rto))
            
            if len(actual_outcomes) > 0:
                # Calculate confusion matrix
                validation_metrics = self._calculate_validation_metrics(
                    actual_outcomes, predicted_outcomes
                )
                
                results['validation'] = validation_metrics
                logger.info(f"Validation completed: Accuracy = {validation_metrics['accuracy']:.2%}")
            
        except Exception as e:
            logger.warning(f"Could not validate predictions: {e}")
            results['validation'] = {'error': str(e)}
        
        return results

    def _calculate_validation_metrics(self, y_true: List[int], y_pred: List[int]) -> Dict[str, Any]:
        """
        Calculate comprehensive validation metrics including confusion matrix
        
        Args:
            y_true: Actual RTO outcomes (0=Delivered, 1=RTO)
            y_pred: Predicted RTO outcomes (0=Delivered, 1=RTO)
            
        Returns:
            Dictionary with validation metrics
        """
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        try:
            # Basic metrics
            accuracy = accuracy_score(y_true, y_pred)
            precision = precision_score(y_true, y_pred, zero_division=0)
            recall = recall_score(y_true, y_pred, zero_division=0)
            f1 = f1_score(y_true, y_pred, zero_division=0)
            
            # Confusion matrix counts (using the function we created earlier)
            cm = confusion_matrix(y_true, y_pred)
            if cm.shape == (2, 2):
                tn, fp, fn, tp = cm.ravel()
                
                confusion_counts = {
                    'true_positives': int(tp),
                    'true_negatives': int(tn),
                    'false_positives': int(fp),
                    'false_negatives': int(fn),
                    'total_orders': int(tp + tn + fp + fn)
                }
                
                # Business-friendly interpretations
                business_metrics = {
                    'correctly_predicted_rto': int(tp),
                    'correctly_predicted_delivered': int(tn),
                    'wrongly_flagged_as_rto': int(fp),
                    'missed_rto_cases': int(fn),
                    'total_actual_rto': int(tp + fn),
                    'total_actual_delivered': int(tn + fp)
                }
            else:
                confusion_counts = {'error': 'Unexpected confusion matrix shape'}
                business_metrics = {}
            
            # Cost analysis (business impact)
            cost_analysis = self._calculate_business_cost(y_true, y_pred)
            
            validation_metrics = {
                'accuracy': float(accuracy),
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'confusion_matrix': confusion_counts,
                'business_metrics': business_metrics,
                'cost_analysis': cost_analysis,
                'validation_timestamp': pd.Timestamp.now().isoformat()
            }
            
            return validation_metrics
            
        except Exception as e:
            return {'error': str(e)}

    def _calculate_business_cost(self, y_true: List[int], y_pred: List[int]) -> Dict[str, float]:
        """
        Calculate business cost of prediction errors
        
        Args:
            y_true: Actual outcomes
            y_pred: Predicted outcomes
            
        Returns:
            Dictionary with cost analysis
        """
        try:
            # Define business costs (you can adjust these values)
            COST_FALSE_POSITIVE = 50.0   # Cost of wrongly flagging as RTO (customer service, delays)
            COST_FALSE_NEGATIVE = 200.0  # Cost of missing actual RTO (shipping cost, handling)
            COST_TRUE_POSITIVE = 10.0    # Cost of correctly identifying RTO (prevention cost)
            COST_TRUE_NEGATIVE = 0.0     # No cost for correct delivery prediction
            
            # Calculate costs
            total_cost = 0.0
            cost_breakdown = {
                'false_positive_cost': 0.0,
                'false_negative_cost': 0.0,
                'true_positive_cost': 0.0,
                'true_negative_cost': 0.0
            }
            
            for actual, predicted in zip(y_true, y_pred):
                if actual == 0 and predicted == 1:  # False Positive
                    cost_breakdown['false_positive_cost'] += COST_FALSE_POSITIVE
                elif actual == 1 and predicted == 0:  # False Negative
                    cost_breakdown['false_negative_cost'] += COST_FALSE_NEGATIVE
                elif actual == 1 and predicted == 1:  # True Positive
                    cost_breakdown['true_positive_cost'] += COST_TRUE_POSITIVE
                # True Negative has no cost
            
            total_cost = sum(cost_breakdown.values())
            
            return {
                'total_cost': total_cost,
                'average_cost_per_order': total_cost / len(y_true) if len(y_true) > 0 else 0,
                'cost_breakdown': cost_breakdown,
                'cost_savings_vs_no_model': self._calculate_cost_savings(y_true),
                'cost_assumptions': {
                    'false_positive_cost': COST_FALSE_POSITIVE,
                    'false_negative_cost': COST_FALSE_NEGATIVE,
                    'true_positive_cost': COST_TRUE_POSITIVE
                }
            }
            
        except Exception as e:
            return {'error': str(e)}

    def _calculate_cost_savings(self, y_true: List[int]) -> float:
        """Calculate cost savings compared to no prediction model"""
        try:
            # Without model, assume we treat all orders as potential RTO
            COST_TREATING_ALL_AS_RTO = 100.0  # Average cost of extra precautions for all orders
            
            baseline_cost = len(y_true) * COST_TREATING_ALL_AS_RTO
            return baseline_cost
            
        except Exception as e:
            return 0.0

    def _enhance_results_summary(self, results: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Enhance results with additional analytics and insights
        
        Args:
            results: Original prediction results
            df: Original dataframe
            
        Returns:
            Enhanced results with additional insights
        """
        try:
            summary = results.get('summary', {})
            
            # Add data quality metrics
            data_quality = {
                'input_data_quality': {
                    'total_rows': len(df),
                    'missing_values_pct': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
                    'duplicate_orders': df.duplicated().sum() if len(df) > 0 else 0,
                    'data_completeness_score': self._calculate_completeness_score(df)
                }
            }
            
            # Add prediction confidence analysis
            if 'predictions' in results:
                probabilities = [p.get('rto_probability', 0) for p in results['predictions']]
                confidence_analysis = {
                    'prediction_confidence': {
                        'avg_confidence': np.mean(probabilities),
                        'min_confidence': np.min(probabilities),
                        'max_confidence': np.max(probabilities),
                        'low_confidence_count': sum(1 for p in probabilities if 0.3 <= p <= 0.7),
                        'high_confidence_count': sum(1 for p in probabilities if p < 0.3 or p > 0.7)
                    }
                }
            else:
                confidence_analysis = {}
            
            # Merge all enhancements
            enhanced_summary = {
                **summary,
                **data_quality,
                **confidence_analysis,
                'enhancement_timestamp': pd.Timestamp.now().isoformat()
            }
            
            results['summary'] = enhanced_summary
            
        except Exception as e:
            logger.warning(f"Could not enhance results summary: {e}")
        
        return results

    def _calculate_completeness_score(self, df: pd.DataFrame) -> float:
        """Calculate data completeness score (0-100)"""
        try:
            total_cells = len(df) * len(df.columns)
            missing_cells = df.isnull().sum().sum()
            completeness = ((total_cells - missing_cells) / total_cells) * 100
            return round(completeness, 2)
        except:
            return 0.0

    # Usage example for validation
    def validate_recent_predictions(self, prediction_file: str, actual_outcomes_file: str) -> Dict[str, Any]:
        """
        Validate recent predictions against actual outcomes
        
        Args:
            prediction_file: CSV file with predictions
            actual_outcomes_file: CSV file with actual outcomes
            
        Returns:
            Validation results with confusion matrix and business metrics
        """
        try:
            # Load prediction and actual data
            pred_df = pd.read_csv(prediction_file)
            actual_df = pd.read_csv(actual_outcomes_file)
            
            # Merge on order number
            merged = pred_df.merge(actual_df, on='ORDER_NUMBER', how='inner')
            
            if len(merged) == 0:
                return {'error': 'No matching orders found between prediction and actual files'}
            
            # Extract predictions and actuals
            y_pred = merged['rto_prediction'].astype(int).tolist()
            y_true = [self.predictor._create_target(status) for status in merged['CURRENT_STATUS']]
            
            # Calculate validation metrics
            validation_results = self._calculate_validation_metrics(y_true, y_pred)
            
            # Add summary
            validation_results['summary'] = {
                'total_validated_orders': len(merged),
                'validation_coverage': len(merged) / len(pred_df) * 100,
                'validation_date': pd.Timestamp.now().isoformat()
            }
            
            return validation_results
            
        except Exception as e:
            logger.error(f"Error validating predictions: {e}")
            return {'error': str(e)}


    @monitor_performance
    def train_initial_model(self, training_data_path: str) -> Dict[str, Any]:
        """
        Train initial model with historical data and enhanced validation
        
        Args:
            training_data_path: Path to historical training data CSV
            
        Returns:
            Training results
        """
        logger.info(f"Training initial model with data from {training_data_path}")
        
        try:
            # Validate file exists
            if not os.path.exists(training_data_path):
                raise FileNotFoundError(f"Training data file not found: {training_data_path}")
            
            # Read training data
            df = pd.read_csv(training_data_path)
            logger.info(f"Loaded {len(df)} records for training")
            
            if len(df) < self.predictor.model_config.min_training_samples:
                raise ValueError(f"Insufficient training data. Need at least {self.predictor.model_config.min_training_samples} samples, got {len(df)}")
            
            # Train model
            results = self.predictor.train_model(df)
            
            # Save training results
            self._save_training_results(results, training_data_path)
            
            return results
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def daily_retrain(self, new_data_path: str = None) -> Optional[Dict[str, Any]]:
        """
        Perform daily retraining if needed with enhanced monitoring
        
        Args:
            new_data_path: Path to new training data (optional)
            
        Returns:
            Retraining results or None if no retraining needed
        """
        logger.info("Starting daily retrain process")
        
        try:
            if new_data_path and os.path.exists(new_data_path):
                new_data = pd.read_csv(new_data_path)
                logger.info(f"Loaded {len(new_data)} new records for potential retraining")
                
                return self.predictor.retrain_with_new_data(new_data)
            else:
                logger.info("No new training data provided for retraining")
                return None
                
        except Exception as e:
            logger.error(f"Error in daily retrain: {e}")
            return None
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report with system metrics"""
        
        logger.info("Generating performance report")
        
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'system_health': self.predictor.get_health_status(),
                'courier_performance': self.predictor.get_courier_performance_report(),
                'pincode_analysis': self.predictor.get_pincode_analysis(),
                'model_info': {
                    'model_type': type(self.predictor.model).__name__ if self.predictor.model else None,
                    'feature_count': len(self.predictor.feature_columns) if self.predictor.feature_columns else 0,
                    'feature_importance': self.predictor._get_feature_importance(),
                    'model_version': getattr(self.predictor, 'model_version', 'unknown')
                },
                'performance_metrics': self.metrics_collector.get_metrics()
            }
            
            # Save report
            report_path = Path(self.config['output_dir']) / f"performance_report_{datetime.now().strftime('%Y%m%d')}.json"
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            
            logger.info(f"Performance report saved to {report_path}")
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating performance report: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def _save_prediction_results(self, results: Dict, original_csv_path: str):
        """Save prediction results with enhanced metadata"""
        
        timestamp = datetime.now().strftime('%Y%m%d')
        
        # Save complete results
        output_file = Path(self.config['output_dir']) / f"predictions_{timestamp}.json"
        
        # Create summary CSV
        summary_data = []
        for pred in results['predictions']:
            if 'error' not in pred:  # Skip failed predictions
                summary_data.append({
                    'order_index': pred['order_index'],
                    'order_number': pred['order_number'],
                    'order_current_status': pred['order_current_status'],
                    'payment_mode': pred['payment_mode'],
                    'cod_value': pred['cod_value'],
                    'order_created_at': pred['order_created_at'],
                    'rto_prediction': pred['rto_prediction'],
                    'rto_probability': pred['rto_probability'],
                    'risk_level': pred['risk_level'],
                    'prediction_timestamp': pred.get('prediction_timestamp', timestamp)
                })
        
        summary_df = pd.DataFrame(summary_data)
        summary_csv = Path(self.config['output_dir']) / f"prediction_summary_{timestamp}.csv"
        
        try:
            # Save both files
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            if not summary_df.empty:
                summary_df.to_csv(summary_csv, index=False)
            
            # Save metadata
            metadata = {
                'source_file': original_csv_path,
                'processing_timestamp': timestamp,
                'total_orders': len(results['predictions']),
                'successful_predictions': len(summary_data),
                'failed_predictions': len(results['predictions']) - len(summary_data),
                'model_version': getattr(self.predictor, 'model_version', 'unknown')
            }
            
            metadata_file = Path(self.config['output_dir']) / f"metadata_{timestamp}.json"
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Prediction results saved to {output_file} and {summary_csv}")
            
        except Exception as e:
            logger.error(f"Error saving prediction results: {e}")
    
    def _save_training_results(self, results: Dict, training_data_path: str):
        """Save training results with enhanced metadata"""
        
        timestamp = datetime.now().strftime('%Y%m%d')
        output_file = Path(self.config['output_dir']) / f"training_results_{timestamp}.json"
        
        try:
            # Add metadata to results
            enhanced_results = {
                **results,
                'training_data_source': training_data_path,
                'training_timestamp': timestamp,
                'system_info': {
                    'python_version': '.'.join(map(str, sys.version_info[:3])),
                    'memory_usage_mb': psutil.Process().memory_info().rss / 1024 / 1024,
                    'cpu_count': psutil.cpu_count()
                }
            }
            
            with open(output_file, 'w') as f:
                json.dump(enhanced_results, f, indent=2, default=str)
            
            logger.info(f"Training results saved to {output_file}")
            
        except Exception as e:
            logger.error(f"Error saving training results: {e}")

