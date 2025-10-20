# Enhanced RTO Prediction Pipeline

A comprehensive machine learning pipeline for predicting Return-to-Origin (RTO) likelihood in e-commerce deliveries, featuring cost-sensitive learning, ensemble methods, and production-grade monitoring.

## 🌟 Key Features

### Machine Learning & Optimization
- **Cost-Sensitive Learning**: Optimized for business outcomes with configurable cost parameters
- **Ensemble Methods**: Automatic model selection from RandomForest, XGBoost, LightGBM, etc.
- **Advanced Feature Engineering**: Customer history, temporal patterns, address intelligence
- **Feature Selection**: Automatic selection of most important features
- **Threshold Optimization**: Business-cost optimized prediction thresholds

### Production Ready
- **Comprehensive Monitoring**: Health checks, performance metrics, error tracking
- **Fault Tolerance**: Circuit breaker pattern, retry mechanisms, timeout protection
- **Batch Processing**: Handle large datasets efficiently
- **Model Versioning**: Automatic model snapshots and rollback capability
- **Configuration Management**: Flexible configuration with validation

### Business Intelligence
- **Courier Performance Analysis**: Detailed analytics and recommendations
- **Pincode Risk Assessment**: Geographic delivery risk analysis
- **Business Impact Estimation**: ROI calculations and cost-benefit analysis
- **Comprehensive Reporting**: Training, prediction, and validation reports
- **Actionable Recommendations**: Specific suggestions for each order

## 📁 Project Structure

```
src/
├── __init__.py
├── main.py                    # Complete CLI entry point
├── config/
│   ├── __init__.py
│   ├── config.py             # Enhanced configuration management
│   └── default_config.json   # Default settings
├── core/
│   ├── __init__.py
│   ├── exceptions.py         # All custom exceptions
│   ├── decorators.py         # Monitoring & retry decorators
│   └── metrics.py            # Performance metrics collection
├── data/
│   ├── __init__.py
│   ├── validation.py         # Comprehensive data validation
│   ├── preprocessing.py      # Enhanced preprocessing pipeline
│   └── feature_engineering.py # Advanced feature engineering
├── models/
│   ├── __init__.py
│   ├── cost_sensitive_trainer.py # Cost-optimized training
│   ├── ensemble_trainer.py   # Ensemble model training
│   └── model_manager.py      # Model versioning & management
├── utils/
│   ├── __init__.py
│   ├── logger.py             # Production logging
│   ├── file_utils.py         # File handling utilities
│   └── similarity.py         # Order similarity matching
├── monitoring/
│   ├── __init__.py
│   ├── health_check.py       # System health monitoring
│   ├── performance.py        # Performance tracking
│   └── circuit_breaker.py    # Fault tolerance
├── pipeline/
│   ├── __init__.py
│   ├── batch_processor.py    # Large file processing
│   ├── validation_pipeline.py # Prediction validation
│   └── pipeline_manager.py   # Main pipeline orchestrator
└── reports/
    ├── __init__.py
    ├── generators.py         # All report generation
    └── exporters.py          # Report export formats
```

## 🚀 Quick Start

### Installation

1. **Clone/Download the project**
```bash
# Extract to your working directory
cd src
```

2. **Install dependencies**
```bash
pip install pandas numpy scikit-learn joblib psutil

# Optional packages for enhanced features
pip install xgboost lightgbm matplotlib
```

3. **Validate installation**
```bash
python -m src.main --validate
```

### Basic Usage

1. **Quick Test**
```bash
python -m src.main --quick-test
```

2. **Full Pipeline**
```bash
python main.py --train data/training.csv --predict data/orders.csv
```

3. **Health Check**
```bash
python main.py --health-check
```

## 📊 Usage Examples

### Command Line Interface

```bash
# Complete pipeline with training and prediction
python main.py --train data/training.csv --predict data/orders.csv --enable-validation

# Train model only
python main.py --train data/training.csv

# Predict with existing model
python main.py --predict data/new_orders.csv --batch-size 5000

# Validate predictions against actual outcomes
python main.py --validate-predictions predictions.csv actual_outcomes.csv

# Generate performance report
python main.py --performance-report

# Custom configuration
python main.py --config custom_config.json --train data/training.csv
```

### Python API

```python
from src import ProductionRTOPipelineManager

# Initialize pipeline
pipeline = ProductionRTOPipelineManager('config.json')

# Train model
training_results = pipeline.train_initial_model('training_data.csv')

# Make predictions
prediction_results = pipeline.process_new_orders('new_orders.csv')

# Generate reports
performance_report = pipeline.generate_performance_report()
courier_report = pipeline.predictor.get_courier_performance_report()
pincode_analysis = pipeline.predictor.get_pincode_analysis()
```

## ⚙️ Configuration

### Basic Configuration

Create a `config.json` file:

```json
{
  "data_dir": "data",
  "model_dir": "models", 
  "output_dir": "output",
  "log_level": "INFO",
  "preprocessing": {
    "enable_advanced_features": true,
    "enable_customer_history": true,
    "enable_temporal_patterns": true,
    "enable_address_parsing": true
  },
  "model": {
    "optimize_for_cost": true,
    "false_positive_cost": 50.0,
    "false_negative_cost": 200.0,
    "true_positive_cost": 10.0,
    "enable_ensemble": true,
    "enable_feature_selection": true
  }
}
```

### Cost Configuration

Customize business costs for optimization:

```json
{
  "model": {
    "false_positive_cost": 50.0,    // Cost of wrongly flagging as RTO
    "false_negative_cost": 200.0,   // Cost of missing actual RTO
    "true_positive_cost": 10.0,     // Cost of correctly identifying RTO
    "optimize_for_cost": true
  }
}
```

## 📈 Features and Capabilities

### 1. Cost-Sensitive Learning
- Business-cost optimized thresholds
- Configurable cost parameters for different scenarios
- ROI-focused model selection
- Total cost minimization

### 2. Advanced Feature Engineering
- **Customer Intelligence**: Order history, behavior patterns, consistency metrics
- **Address Intelligence**: Indian address parsing, delivery difficulty assessment
- **Phone Intelligence**: Number quality, operator detection, pattern analysis
- **Temporal Patterns**: Business hours, seasonal effects, timing patterns
- **Interaction Features**: Cross-feature relationships and risk scores

### 3. Model Training & Selection
- **Multiple Algorithms**: RandomForest, XGBoost, LightGBM, Gradient Boosting
- **Ensemble Methods**: Voting classifiers with optimized weights
- **Automatic Selection**: Best model based on business metrics
- **Hyperparameter Optimization**: Grid search with cost-sensitive scoring

### 4. Prediction & Analysis
- **Risk Categorization**: Very Low, Low, Medium, High, Very High
- **Confidence Scoring**: Prediction confidence assessment
- **Similarity Matching**: Find similar historical orders
- **Detailed Explanations**: Feature-based prediction explanations
- **Actionable Recommendations**: Specific suggestions for each order

### 5. Business Intelligence
- **Courier Performance**: Success rates, recommendations, rankings
- **Pincode Analysis**: Geographic risk assessment, delivery patterns
- **Customer Segmentation**: Repeat vs new customer analysis
- **Payment Mode Analysis**: COD vs prepaid performance
- **Business Impact**: Cost savings, ROI calculations

### 6. Production Features
- **Health Monitoring**: System health checks, error tracking
- **Performance Metrics**: Response times, memory usage, throughput
- **Circuit Breaker**: Fault tolerance for service reliability
- **Batch Processing**: Handle large datasets efficiently
- **Comprehensive Logging**: Structured logging with multiple levels

## 📊 Data Requirements

### Training Data
Required columns:
- `ORDER_NUMBER`: Unique order identifier
- `CURRENT_STATUS`: Order status (for target creation)
- `CUSTOMER_PHONE`: Customer phone number
- `CUSTOMER_ADDRESS`: Customer address
- `PAYMENT_MODE`: Payment method (COD/Prepaid)

Recommended columns:
- `COURIER_NAME`: Courier company name
- `CUSTOMER_CITY`, `CUSTOMER_STATE`: Location information
- `WEIGHT`, `QTY`, `INVOICE_VALUE`: Order characteristics
- `ZONE`: Delivery zone
- `ORDER_CREATION_DATE`: Order timestamp

### Prediction Data
Same structure as training data but without `CURRENT_STATUS`.

## 📋 Output Files

### Prediction Results
- `predictions_YYYYMMDD_HHMMSS.json`: Complete prediction results
- `prediction_summary_YYYYMMDD_HHMMSS.csv`: CSV summary for easy analysis

### Training Results  
- `training_results_YYYYMMDD_HHMMSS.json`: Complete training metrics and model comparison
- Model snapshots in `models/` directory with versioning

### Reports
- `performance_report_YYYYMMDD.json`: Comprehensive system and model performance
- `validation_results_YYYYMMDD_HHMMSS.json`: Prediction validation metrics

## 🔧 Advanced Usage

### Custom Feature Engineering
```python
from src.data.feature_engineering import AdvancedFeatureEngineer

engineer = AdvancedFeatureEngineer(config)
df = engineer.create_customer_history_features(df)
df = engineer.create_risk_score_features(df)
```

### Custom Model Training
```python
from src.models.ensemble_trainer import OptimizedEnsembleTrainer

trainer = OptimizedEnsembleTrainer(model_config)
model, threshold, results = trainer.train_ensemble(X_train, y_train, X_val, y_val)
```

### Monitoring Integration
```python
from src.monitoring.health_check import HealthChecker

health_checker = HealthChecker(pipeline)
health_status = health_checker.check_system_health()
```

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   python main.py --validate
   ```

2. **Memory Issues**
   - Use batch processing: `--batch-size 1000`
   - Disable advanced features in config for large datasets

3. **Training Failures**
   - Check data quality and required columns
   - Ensure sufficient training samples (minimum 100)

4. **Performance Issues**
   - Enable circuit breaker in configuration
   - Monitor system health: `python main.py --health-check`

### Logs and Debugging
- Check `logs/` directory for detailed error logs
- Use `--log-level DEBUG` for verbose output
- Health check provides system diagnostics

## 🎯 Business Value

### Cost Optimization
- Reduce false positive costs (unnecessary interventions)
- Minimize false negative costs (missed RTO cases)
- Optimize intervention strategies based on risk levels

### Operational Efficiency  
- Automated courier performance monitoring
- Pincode-level delivery risk assessment
- Data-driven decision making for logistics

### Customer Experience
- Proactive customer communication for high-risk orders
- Reduced delivery failures through preventive measures
- Better address validation and customer data quality

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs in the `logs/` directory
3. Run health check: `python main.py --health-check`
4. Validate installation: `python main.py --validate`

## 🔄 Version History

- **v2.0.0**: Enhanced version with cost optimization and production features
- **v1.0.0**: Original implementation with basic prediction capabilities

---

**Enhanced RTO Prediction Pipeline** - Combining machine learning excellence with business intelligence for optimal delivery outcomes.