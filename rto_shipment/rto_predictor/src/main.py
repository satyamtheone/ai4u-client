def main():
    """Main function demonstrating production pipeline usage"""
    
    # Initialize production pipeline (backward compatible)
    pipeline = ProductionRTOPipelineManager()
    
    try:
        # Health check
        health = health_check(pipeline)
        print(f"Pipeline Health: {health['overall_status']}")
        
        # Example: Train initial model
        print("Training model...")
        training_results = pipeline.train_initial_model(r'data/to_train/training_data_2025_05_23.csv')
        print(f"Training completed: {training_results['best_model']}")
        
        # Example: Process new orders
        print("Processing new orders...")
        prediction_results = pipeline.process_new_orders('data/to_predict/predict_2025_06_03.csv',
                                                         validate_predictions=True)
        print(f"Processed {len(prediction_results['predictions'])} orders")

        if 'validation' in prediction_results:
            validation = prediction_results['validation']
            print(f"Accuracy: {validation['accuracy']:.2%}")
            print(f"Precision: {validation['precision']:.2%}")
            print(f"Recall: {validation['recall']:.2%}")
            
            # Print confusion matrix in business terms
            bm = validation['business_metrics']
            print(f"\n📊 Business Impact:")
            print(f"✅ Correctly identified RTO: {bm['correctly_predicted_rto']}")
            print(f"✅ Correctly identified Delivered: {bm['correctly_predicted_delivered']}")
            print(f"❌ Wrongly flagged as RTO: {bm['wrongly_flagged_as_rto']}")
            print(f"❌ Missed RTO cases: {bm['missed_rto_cases']}")
            
            # Print cost analysis
            if 'cost_analysis' in validation:
                cost = validation['cost_analysis']
                print(f"\n💰 Cost Analysis:")
                print(f"Total cost: ${cost['total_cost']:.2f}")
                print(f"Average cost per order: ${cost['average_cost_per_order']:.2f}")
                print(f"Cost savings: ${cost}")
        
        # Example: Generate performance report
        print("Generating performance report...")
        report = pipeline.generate_performance_report()
        print("Performance report generated")
        
        print("\n✅ Production RTO Prediction Pipeline is ready!")
        print("\nProduction Features Added:")
        print("- Comprehensive error handling and validation")
        print("- Performance monitoring and metrics")
        print("- Circuit breaker for fault tolerance")
        print("- Timeout protection")
        print("- Retry mechanisms")
        print("- Health checks")
        print("- Batch processing for large files")
        print("- Model versioning and snapshots")
        print("- Configuration management")
        print("- Enhanced logging")
        print("- Backup and recovery")
        
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        print(f"❌ Pipeline failed: {e}")


# For backward compatibility, create aliases
# RTOPredictor = ProductionRTOPredictor
# RTOPipelineManager = ProductionRTOPipelineManager

if __name__ == "__main__":
    # Setup logging first
    logger = setup_production_logging()
    
    # Import required modules
    import sys
    
    main()