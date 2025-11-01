# Functional API & Database Integration Guide

## 🎯 Overview

This guide covers the new **function-based API** and **PostgreSQL integration** for the RTO Prediction System. The functional API provides a simple, reusable interface that can be used in:

- **FastAPI endpoints** (web APIs)
- **Workflow scripts** (batch processing, cron jobs)
- **Jupyter notebooks** (analysis, testing)
- **CLI tools** (command-line utilities)

All predictions are automatically stored in PostgreSQL for analytics and audit trails.

---

## 📦 Features

### ✅ Functional API
- Simple function-based interface
- No class instantiation needed
- Automatic resource management
- Built-in error handling
- Comprehensive logging

### ✅ Database Integration
- **PostgreSQL** for persistent storage
- Automatic prediction logging
- Model metadata tracking
- Performance analytics
- Query interface for historical data

### ✅ Data Models
- **Predictions**: Individual prediction results
- **ModelMetadata**: Training history and metrics
- **CourierPerformance**: Courier statistics
- **PincodeAnalytics**: Geographic risk data
- **SystemMetrics**: Performance monitoring

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor

# Install database dependencies
pip install -r requirements-database.txt
```

### 2. Setup PostgreSQL Database

**Option A: Using Docker** (Recommended)

```bash
docker run --name rto-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=rto_predictions \
    -p 5432:5432 \
    -d postgres:15
```

**Option B: Local PostgreSQL**

```bash
# Install PostgreSQL (if not already installed)
# macOS
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb rto_predictions
```

### 3. Initialize Database

```bash
# Run setup script
python scripts/setup_database.py

# Or with custom connection
DATABASE_URL=postgresql://user:pass@host:5432/dbname python scripts/setup_database.py
```

### 4. Use the Functional API

```python
from src.functional_api import predict_single_order, predict_batch_orders

# Single prediction
order = {
    "ORDER_NUMBER": "ORD123",
    "CUSTOMER_PHONE": "9876543210",
    "CUSTOMER_ADDRESS": "123 Main St",
    "CUSTOMER_CITY": "GURGAON",
    "CUSTOMER_STATE": "HARYANA",
    "PINCODE": "122001",
    "PAYMENT_MODE": "COD",
    "COURIER_NAME": "DELHIVERY",
    "WEIGHT": 1.5,
    "QTY": 2,
    "INVOICE_VALUE": 2499.50
}

result = predict_single_order(order)
print(f"RTO Probability: {result['rto_probability']}")
print(f"Risk Level: {result['risk_level']}")
```

---

## 📚 Function Reference

### Prediction Functions

#### `predict_single_order(order_data, save_to_db=True)`

Predict RTO for a single order.

**Parameters:**
- `order_data` (Dict): Order details
- `save_to_db` (bool): Save to database (default: True)

**Returns:** Dict with prediction results

**Example:**
```python
from src.functional_api import predict_single_order

result = predict_single_order({
    "ORDER_NUMBER": "ORD001",
    "PAYMENT_MODE": "COD",
    "COURIER_NAME": "DELHIVERY",
    "PINCODE": "122001",
    "WEIGHT": 1.5,
    "QTY": 2,
    "INVOICE_VALUE": 2499.50,
    "CUSTOMER_PHONE": "9876543210",
    # ... other fields
})

# Access results
print(result['rto_prediction'])  # True/False
print(result['rto_probability'])  # 0.0-1.0
print(result['risk_level'])  # Low/Medium/High
print(result['recommendations'])  # List of suggestions
```

#### `predict_batch_orders(orders, save_to_db=True)`

Predict RTO for multiple orders.

**Parameters:**
- `orders` (List[Dict]): List of order dictionaries
- `save_to_db` (bool): Save to database

**Returns:** Dict with all predictions and summary

**Example:**
```python
from src.functional_api import predict_batch_orders

orders = [
    {"ORDER_NUMBER": "ORD001", ...},
    {"ORDER_NUMBER": "ORD002", ...},
]

results = predict_batch_orders(orders)

print(results['total_orders'])
print(results['summary']['high_risk_count'])
for pred in results['predictions']:
    print(f"{pred['order_number']}: {pred['rto_probability']}")
```

#### `predict_from_csv_file(csv_file_path, save_to_db=True)`

Predict from CSV file.

**Example:**
```python
from src.functional_api import predict_from_csv_file

results = predict_from_csv_file("orders.csv")
```

### Training Functions

#### `train_model(training_data_path, save_to_db=True)`

Train a new model.

**Example:**
```python
from src.functional_api import train_model

results = train_model("training_data.csv")
print(f"Test Accuracy: {results['test_accuracy']}")
```

#### `retrain_model(new_data_path=None, save_to_db=True)`

Retrain existing model.

**Example:**
```python
from src.functional_api import retrain_model

results = retrain_model("new_data.csv")
if results:
    print("Model retrained successfully")
else:
    print("Retraining not needed")
```

### Analytics Functions

#### `get_courier_analytics()`

Get courier performance data.

**Example:**
```python
from src.functional_api import get_courier_analytics

analytics = get_courier_analytics()
for courier, stats in analytics.items():
    print(f"{courier}: {stats['success_rate']}")
```

#### `get_pincode_analytics(pincode=None)`

Get pincode risk analytics.

**Example:**
```python
from src.functional_api import get_pincode_analytics

# All pincodes
all_data = get_pincode_analytics()

# Specific pincode
pincode_data = get_pincode_analytics("122001")
```

#### `get_performance_report()`

Get comprehensive performance report.

**Example:**
```python
from src.functional_api import get_performance_report

report = get_performance_report()
```

### Database Query Functions

#### `get_recent_predictions(limit=100, risk_level=None, courier=None)`

Query recent predictions.

**Example:**
```python
from src.functional_api import get_recent_predictions

# Get last 50 predictions
recent = get_recent_predictions(limit=50)

# Get high risk predictions
high_risk = get_recent_predictions(risk_level="High")

# Get predictions for specific courier
delhivery = get_recent_predictions(courier="DELHIVERY")
```

#### `get_prediction_summary_stats(days=7)`

Get summary statistics.

**Example:**
```python
from src.functional_api import get_prediction_summary_stats

stats = get_prediction_summary_stats(days=30)
print(f"Total predictions: {stats['total_predictions']}")
print(f"High risk rate: {stats['high_risk_rate']}%")
```

#### `update_prediction_outcome(order_number, actual_rto, actual_status)`

Update with actual outcome.

**Example:**
```python
from src.functional_api import update_prediction_outcome

update_prediction_outcome(
    order_number="ORD123",
    actual_rto=False,
    actual_status="DELIVERED"
)
```

### Health & Monitoring

#### `get_system_health()`

**Example:**
```python
from src.functional_api import get_system_health

health = get_system_health()
print(health['overall_status'])
```

#### `get_model_info()`

**Example:**
```python
from src.functional_api import get_model_info

info = get_model_info()
print(f"Model loaded: {info['model_loaded']}")
```

---

## 🔧 Database Configuration

### Environment Variables

```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Or in .env file
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rto_predictions
```

### Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Examples:**
```bash
# Local
postgresql://postgres:postgres@localhost:5432/rto_predictions

# Docker
postgresql://postgres:postgres@localhost:5432/rto_predictions

# Remote
postgresql://user:pass@db.example.com:5432/rto_db

# With SSL
postgresql://user:pass@host:5432/db?sslmode=require
```

---

## 📊 Database Schema

### Predictions Table

Stores individual prediction results.

**Columns:**
- `id`: Primary key
- `order_number`: Order identifier
- `customer_*`: Customer information
- `rto_prediction`: Boolean prediction
- `rto_probability`: 0.0-1.0
- `risk_level`: Low/Medium/High/Critical
- `model_version`: Model used
- `prediction_timestamp`: When predicted
- `risk_factors`: JSON array
- `recommendations`: JSON array
- `actual_rto`: Actual outcome (nullable)
- `batch_id`: Batch identifier (nullable)

### ModelMetadata Table

Tracks model training history.

**Columns:**
- `model_version`: Unique version string
- `model_type`: RandomForest, etc.
- `training_accuracy`, `test_accuracy`
- `precision_score`, `recall_score`, `f1_score`
- `feature_importance`: JSON
- `is_production`: Currently active

### CourierPerformance Table

Courier statistics.

**Columns:**
- `courier_name`: Courier identifier
- `total_deliveries`, `successful_deliveries`, `rto_count`
- `success_rate`, `rto_rate`
- `period_start`, `period_end`

### PincodeAnalytics Table

Geographic risk data.

**Columns:**
- `pincode`: 6-digit pincode
- `city`, `state`
- `total_orders`, `rto_count`, `success_count`
- `rto_rate`, `success_rate`
- `risk_level`, `risk_score`

---

## 💻 Usage Examples

### Example 1: API Integration

```python
# In FastAPI endpoint
from fastapi import FastAPI
from src.functional_api import predict_single_order

app = FastAPI()

@app.post("/api/v1/predict")
async def predict(order: OrderInput):
    result = predict_single_order(order.dict())
    return result
```

### Example 2: Batch Processing Script

```python
# batch_process.py
from src.functional_api import predict_from_csv_file
import sys

if __name__ == "__main__":
    csv_file = sys.argv[1]
    results = predict_from_csv_file(csv_file)

    print(f"Processed {results['total_orders']} orders")
    print(f"High risk: {results['summary']['high_risk_count']}")
```

### Example 3: Cron Job for Analytics

```python
# daily_analytics.py
from src.functional_api import get_courier_analytics, get_prediction_summary_stats
from datetime import datetime

# Get daily stats
stats = get_prediction_summary_stats(days=1)

# Get courier performance
courier_stats = get_courier_analytics()

# Generate report
print(f"Daily Report - {datetime.now().date()}")
print(f"Total Predictions: {stats['total_predictions']}")
print(f"High Risk Rate: {stats['high_risk_rate']:.2f}%")
```

### Example 4: Database Queries

```python
from src.database.database_service import get_database

db = get_database()

# Query high-risk predictions from last week
from datetime import datetime, timedelta

week_ago = datetime.utcnow() - timedelta(days=7)
high_risk_orders = db.get_predictions(
    risk_level="High",
    start_date=week_ago,
    limit=100
)

print(f"Found {len(high_risk_orders)} high-risk orders")
```

---

## 🛠️ Maintenance

### Database Backup

```bash
# Backup
pg_dump rto_predictions > backup_$(date +%Y%m%d).sql

# Restore
psql rto_predictions < backup_20250101.sql
```

### Reset Database

```bash
python scripts/setup_database.py --reset
```

### Verify Connection

```bash
python scripts/setup_database.py --verify
```

---

## 🚨 Troubleshooting

### Connection Issues

**Problem:** `could not connect to server`

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check connection string
3. Verify firewall/network settings

### Table Creation Fails

**Problem:** Permission denied

**Solution:**
```sql
GRANT ALL PRIVILEGES ON DATABASE rto_predictions TO your_user;
```

### Import Errors

**Problem:** `ModuleNotFoundError: No module named 'sqlalchemy'`

**Solution:**
```bash
pip install -r requirements-database.txt
```

---

## 📈 Performance Tips

1. **Connection Pooling**: Configured automatically (10 connections, 20 overflow)
2. **Batch Inserts**: Use `save_batch_predictions()` for bulk data
3. **Indexes**: Pre-configured on common query fields
4. **Caching**: Predictor instances are cached (singleton pattern)

---

## 🔐 Security

1. **Never commit DATABASE_URL** to version control
2. Use environment variables for credentials
3. Use SSL in production: `?sslmode=require`
4. Implement row-level security if needed
5. Regular backups

---

## ✅ Summary

You now have:
- ✅ Function-based API for easy integration
- ✅ PostgreSQL database for persistence
- ✅ Automatic prediction logging
- ✅ Query interface for analytics
- ✅ Model metadata tracking
- ✅ Performance monitoring

**Next Steps:**
1. Set up PostgreSQL (Docker or local)
2. Run `python scripts/setup_database.py`
3. Start using functional API in your code
4. Access historical data via database queries

---

**Ready to use!** 🎉
