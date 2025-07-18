
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
