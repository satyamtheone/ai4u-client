# RTO Predictor API - Quick Start Guide

## Installation & Setup

### 1. Prerequisites
```bash
# Ensure Python 3.8+ is installed
python3 --version

# Navigate to project directory
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor
```

### 2. Install Dependencies
```bash
# Install all required packages
pip3 install -r requirements.txt

# Or using virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Verify Installation
```bash
# Check if all imports work
python3 -c "from src.main import ProductionRTOPipelineManager; print('✓ Installation successful')"
```

---

## Starting the API Server

### Option 1: Direct Python Execution
```bash
python3 src/apis/api_main.py
```

### Option 2: Using Uvicorn (Recommended)
```bash
# Development mode with auto-reload
uvicorn src.apis.api_main:app --reload --host 0.0.0.0 --port 8000

# Production mode with multiple workers
uvicorn src.apis.api_main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Option 3: Using Gunicorn (Production)
```bash
gunicorn src.apis.api_main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

**Server will be available at:** http://localhost:8000

---

## First Steps

### 1. Check Server Health
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": false,
  "model_status": "inactive",
  "timestamp": "2025-07-22T10:30:00Z"
}
```

### 2. View API Documentation
Open your browser and navigate to:

- **Interactive API Docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

### 3. Train Your First Model

**Option A: Using Training Data CSV**

```bash
# Prepare your training data CSV with these columns:
# ORDER_NUMBER, CUSTOMER_PHONE, CUSTOMER_ADDRESS, PAYMENT_MODE,
# COURIER_NAME, CURRENT_STATUS (required for training), etc.

curl -X POST "http://localhost:8000/api/v1/train" \
  -F "file=@data/to_train/training_data.csv" \
  -F "description=Initial model training"
```

**Response:**
```json
{
  "job_id": "train_20250722_103000",
  "status": "started",
  "message": "Model training started in background"
}
```

**Monitor Training Progress:**
```bash
# Check health status to see if model is loaded
curl http://localhost:8000/health

# When training completes, model_loaded will be true
```

**Training typically takes 5-30 minutes** depending on data size.

---

## Making Your First Prediction

### Single Order Prediction

```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "ORDER_NUMBER": "ORD123456",
    "CUSTOMER_NAME": "John Doe",
    "CUSTOMER_PHONE": "9876543210",
    "CUSTOMER_ADDRESS": "123 Main St, Sector 15",
    "CUSTOMER_CITY": "GURGAON",
    "CUSTOMER_STATE": "HARYANA",
    "PINCODE": "122001",
    "PAYMENT_MODE": "COD",
    "COURIER_NAME": "DELHIVERY",
    "WEIGHT": 1.5,
    "QTY": 2,
    "INVOICE_VALUE": 2499.50
  }'
```

**Response:**
```json
{
  "order_number": "ORD123456",
  "rto_prediction": false,
  "rto_probability": 0.23,
  "risk_level": "Low",
  "recommendations": [
    "Proceed with delivery as planned",
    "Standard delivery process recommended"
  ]
}
```

### Batch Prediction (Multiple Orders)

```bash
curl -X POST "http://localhost:8000/api/v1/predict/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "orders": [
      { /* order 1 data */ },
      { /* order 2 data */ },
      { /* order 3 data */ }
    ]
  }'
```

### CSV File Upload

```bash
curl -X POST "http://localhost:8000/api/v1/predict/csv" \
  -F "file=@data/to_predict/orders.csv"
```

---

## Common Use Cases

### 1. Daily Prediction Workflow

```bash
# Step 1: Upload today's orders for prediction
curl -X POST "http://localhost:8000/api/v1/predict/csv" \
  -F "file=@data/today_orders.csv" \
  -o today_predictions.json

# Step 2: Review high-risk orders
# Results saved in output/predictions_YYYYMMDD.json

# Step 3: Check courier performance
curl "http://localhost:8000/api/v1/analytics/courier-performance" \
  -o courier_report.json
```

### 2. Weekly Model Retraining

```bash
# Collect last week's actual outcomes
# Prepare CSV with CURRENT_STATUS column

# Retrain model with new data
curl -X POST "http://localhost:8000/api/v1/retrain" \
  -F "file=@data/last_week_outcomes.csv"

# Create backup before retraining
curl -X POST "http://localhost:8000/api/v1/backup"
```

### 3. Monitoring & Reporting

```bash
# Check system health
curl "http://localhost:8000/health"

# Get system metrics
curl "http://localhost:8000/api/v1/metrics"

# Generate performance report
curl "http://localhost:8000/api/v1/reports/performance" \
  -o performance_report.json
```

---

## Testing the API

### Run Automated Tests

```bash
# Run the comprehensive test suite
python3 test_api.py
```

**Expected Output:**
```
============================================================
  RTO PREDICTOR API TEST SUITE
============================================================

Base URL: http://localhost:8000

============================================================
  1. INFO ENDPOINTS
============================================================

ℹ Testing: Root Endpoint
  Method: GET
  URL: http://localhost:8000/
✓ Status: 200
  Response time: 0.15s

[... more tests ...]

TEST SUMMARY
============================================================
Total Tests: 15
✓ Passed: 15
Success Rate: 100.0%
```

### Manual Testing with cURL

```bash
# 1. Health Check
curl http://localhost:8000/health

# 2. Single Prediction
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d @sample_order.json

# 3. Courier Analytics
curl http://localhost:8000/api/v1/analytics/courier-performance

# 4. Pincode Analysis
curl http://localhost:8000/api/v1/analytics/pincode/122001

# 5. Create Backup
curl -X POST http://localhost:8000/api/v1/backup
```

---

## Python Client Example

Create a file `client_example.py`:

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Check if API is ready
health = requests.get(f"{BASE_URL}/health").json()
print(f"API Status: {health['status']}")
print(f"Model Loaded: {health['model_loaded']}")

# 2. Make a prediction
order_data = {
    "ORDER_NUMBER": "TEST001",
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

response = requests.post(
    f"{BASE_URL}/api/v1/predict",
    json=order_data
)

result = response.json()
print(f"\nPrediction Result:")
print(f"  RTO Probability: {result['rto_probability']:.2%}")
print(f"  Risk Level: {result['risk_level']}")
print(f"  Recommendations: {result['recommendations']}")

# 3. Get courier performance
couriers = requests.get(
    f"{BASE_URL}/api/v1/analytics/courier-performance"
).json()

print(f"\nTop Couriers:")
for courier, stats in list(couriers['courier_performance'].items())[:3]:
    print(f"  {courier}: {stats['success_rate']:.1f}% success rate")
```

Run it:
```bash
python3 client_example.py
```

---

## Directory Structure

After running the API, you'll see these directories:

```
rto_predictor/
├── logs/                  # Application logs
│   ├── rto_pipeline.log
│   ├── errors.log
│   └── performance.log
├── models/                # Trained model snapshots
│   ├── 2025_07_22_10/
│   └── latest -> 2025_07_22_10/
├── output/                # Prediction results and reports
│   ├── predictions_*.json
│   ├── prediction_summary_*.csv
│   └── performance_report_*.json
├── backups/               # Model backups
│   └── 2025_07_22_09/
└── data/                  # Input data
    ├── to_train/
    └── to_predict/
```

---

## Troubleshooting

### Issue: "Model not loaded" Error

**Solution:**
```bash
# Train a model first
curl -X POST "http://localhost:8000/api/v1/train" \
  -F "file=@data/training_data.csv"

# Wait for training to complete (5-30 minutes)
# Check status periodically
curl http://localhost:8000/health
```

### Issue: Port Already in Use

**Solution:**
```bash
# Option 1: Use a different port
uvicorn src.apis.api_main:app --port 8001

# Option 2: Kill existing process
lsof -ti:8000 | xargs kill -9
```

### Issue: Import Errors

**Solution:**
```bash
# Ensure you're in the correct directory
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor

# Reinstall dependencies
pip install -r requirements.txt

# Check Python version (must be 3.8+)
python3 --version
```

### Issue: Slow Predictions

**Solution:**
```bash
# Use batch processing for multiple orders
# Instead of individual requests, use batch endpoint

# Or increase workers
uvicorn src.apis.api_main:app --workers 4
```

---

## Production Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t rto-api:latest .

# Run container
docker run -d \
  --name rto-api \
  -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/logs:/app/logs \
  rto-api:latest

# Check logs
docker logs -f rto-api
```

### Environment Variables

Create `.env` file:
```bash
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
MAX_BATCH_SIZE=1000
```

---

## Next Steps

1. **Train Your Model**
   - Prepare training data with historical orders
   - Include CURRENT_STATUS column (Delivered/RTO)
   - Upload via POST /api/v1/train

2. **Make Predictions**
   - Single orders: POST /api/v1/predict
   - Batch: POST /api/v1/predict/batch
   - CSV: POST /api/v1/predict/csv

3. **Monitor Performance**
   - Check /health regularly
   - Review /api/v1/metrics
   - Generate performance reports

4. **Analyze Results**
   - Courier performance: /api/v1/analytics/courier-performance
   - Geographic analysis: /api/v1/analytics/pincode
   - Validate predictions: POST /api/v1/validate

5. **Maintain System**
   - Regular backups: POST /api/v1/backup
   - Weekly retraining: POST /api/v1/retrain
   - Clean old backups: DELETE /api/v1/backups/cleanup

---

## Resources

- **API Documentation**: http://localhost:8000/docs
- **Technical Documentation**: `TechnicalDocument.md`
- **API Guide**: `src/API_GUIDE.md`
- **Test Suite**: `test_api.py`

---

## Support

For issues or questions:
1. Check API docs at `/docs`
2. Review logs in `logs/` directory
3. Run health check: `curl http://localhost:8000/health`
4. Run test suite: `python3 test_api.py`
5. Refer to `TechnicalDocument.md` for detailed information

---

**Happy Predicting! 🚀**
