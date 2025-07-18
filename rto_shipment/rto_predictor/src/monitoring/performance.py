 def _calculate_performance_metrics(self, df: pd.DataFrame):
        """Calculate courier and pincode performance metrics"""
        
        if 'CURRENT_STATUS' not in df.columns:
            return
        
        try:
            # Courier performance
            courier_stats = df.groupby('COURIER_NAME').agg({
                'RTO_TARGET': ['count', 'sum', 'mean'],
                'INVOICE_VALUE': 'mean',
                'TAT': 'mean'
            }).round(3)
            
            for courier in courier_stats.index:
                total_orders = courier_stats.loc[courier, ('RTO_TARGET', 'count')]
                rto_orders = courier_stats.loc[courier, ('RTO_TARGET', 'sum')]
                success_rate = 1 - courier_stats.loc[courier, ('RTO_TARGET', 'mean')]
                
                self.courier_performance[courier] = {
                    'total_orders': int(total_orders),
                    'rto_orders': int(rto_orders),
                    'success_rate': float(success_rate),
                    'avg_value': float(courier_stats.loc[courier, ('INVOICE_VALUE', 'mean')]),
                    'avg_tat': float(courier_stats.loc[courier, ('TAT', 'mean')])
                }
            
            # Pincode performance
            pincode_stats = df.groupby('PINCODE').agg({
                'RTO_TARGET': ['count', 'sum', 'mean'],
                'COURIER_NAME': lambda x: x.mode().iloc[0] if not x.mode().empty else 'Unknown'
            }).round(3)
            
            for pincode in pincode_stats.index:
                total_orders = pincode_stats.loc[pincode, ('RTO_TARGET', 'count')]
                if total_orders >= 5:  # Only consider pincodes with sufficient data
                    rto_rate = pincode_stats.loc[pincode, ('RTO_TARGET', 'mean')]
                    self.pincode_stats[pincode] = {
                        'total_orders': int(total_orders),
                        'rto_rate': float(rto_rate),
                        'delivery_success_rate': float(1 - rto_rate),
                        'primary_courier': pincode_stats.loc[pincode, ('COURIER_NAME', '<lambda>')]
                    }
                    
        except Exception as e:
            logger.error(f"Error calculating performance metrics: {e}")

 def _get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        
        if self.model is None or self.feature_columns is None:
            return {}
        
        try:
            if hasattr(self.model, 'feature_importances_'):
                importances = self.model.feature_importances_
            elif hasattr(self.model, 'coef_'):
                importances = np.abs(self.model.coef_[0])
            else:
                return {}
            
            feature_importance = dict(zip(self.feature_columns, importances))
            # Sort by importance
            feature_importance = dict(sorted(feature_importance.items(), 
                                           key=lambda x: x[1], reverse=True))
            
            return feature_importance
            
        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return {}
    