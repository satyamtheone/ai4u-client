 def check_class_balance(self, df, target_col='RTO_TARGET'):
        """Check and report class balance"""
        try:
            value_counts = df[target_col].value_counts()
            total = value_counts.sum()
            print("📊 Class Distribution:")
            for cls, count in value_counts.items():
                pct = count / total * 100
                label = "RTO" if cls == 1 else "Delivered"
                print(f"  {label} ({cls}): {count} ({pct:.2f}%)")
            
            # Record metrics
            self.metrics_collector.record_metric('class_imbalance_ratio', 
                                                value_counts.max() / value_counts.min())
        except Exception as e:
            logger.error(f"Error checking class balance: {e}")


   def _get_risk_level(self, probability: float) -> str:
        """Categorize risk level based on probability"""
        if probability < 0.3:
            return "Low"
        elif probability < 0.7:
            return "Medium"
        else:
            return "High"