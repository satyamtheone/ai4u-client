# RTO Predictor API Guide

## Quick Start

### Starting the API Server

```bash
# Option 1: Using Python directly
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor
python3 src/apis/api_main.py

# Option 2: Using uvicorn
uvicorn src.apis.api_main:app --host 0.0.0.0 --port 8000 --reload

# Option 3: With specific configuration
uvicorn src.apis.api_main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level info
```

### Accessing Documentation

Once the server is running:

- **Interactive API Docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

---

## API Endpoints Overview

### Base URL
```
http://localhost:8000
```

### Endpoint Categories

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Info** | 2 | Root and API information |
| **Health** | 3 | Health checks and monitoring |
| **Prediction** | 3 | Single, batch, and CSV predictions |
| **Model Management** | 3 | Training, retraining, model info |
| **Analytics** | 3 | Courier, pincode, validation analytics |
| **Reports** | 1 | Performance reporting |
| **Management** | 4 | Backup and recovery operations |

**Total: 19 endpoints**

---

## Complete API Reference

### 1. Info Endpoints

#### GET `/`
**Root endpoint with API information**

**Response:**
```json
{
  "service": "RTO Prediction API",
  "version": "2.0.0",
  "status": "running",
  "model_loaded": true,
  "uptime_seconds": 3600.5,
  "predictions_made": 1250,
  "errors": 3,
  "timestamp": "2025-07-22T10:30:00Z",
  "endpoints": {
    "docs": "/docs",
    "health": "/api/v1/health",
    "predict": "/api/v1/predict",
    "train": "/api/v1/train"
  }
}
```

#### GET `/api/v1/info`
**Detailed API information and features**

**Response:**
```json
{
  "api_version": "2.0.0",
  "service_name": "RTO Prediction Service",
  "features": [
    "Single order prediction",
    "Batch prediction (up to 1000 orders)",
    "CSV file upload prediction",
    "Model training and retraining",
    "Performance analytics",
    "Courier performance analysis"
  ],
  "supported_formats": ["JSON", "CSV"],
  "max_batch_size": 1000
}
```

---

### 2. Health & Monitoring Endpoints

#### GET `/health` or `/api/v1/health`
**Comprehensive health check**

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_status": "active",
  "timestamp": "2025-07-22T10:30:00Z",
  "version": "2.0.0",
  "details": {
    "overall_status": "healthy",
    "model_loaded": true,
    "last_prediction": "2025-07-22T10:29:45Z",
    "error_count": 0,
    "memory_usage_mb": 512.3
  }
}
```

#### GET `/api/v1/metrics`
**Detailed system metrics**

**Response:**
```json
{
  "memory_usage_mb": 512.3,
  "cpu_percent": 15.2,
  "api_metrics": {
    "uptime_seconds": 3600,
    "total_predictions": 1250,
    "total_errors": 3,
    "error_rate": 0.24
  },
  "timestamp": "2025-07-22T10:30:00Z"
}
```

#### GET `/api/v1/status`
**Current system status**

**Response:**
```json
{
  "pipeline_initialized": true,
  "model_loaded": true,
  "status": "ready",
  "health_status": {
    "model_loaded": true,
    "last_prediction": "2025-07-22T10:29:45Z"
  }
}
```

---

### 3. Prediction Endpoints

#### POST `/api/v1/predict`
**Predict RTO for a single order**

**Request Body:**
```json
{
  "ORDER_NUMBER": "ORD123456",
  "CUSTOMER_NAME": "John Doe",
  "CUSTOMER_PHONE": "9876543210",
  "CUSTOMER_ADDRESS": "123 Main St, Sector 15, Near Metro",
  "CUSTOMER_CITY": "GURGAON",
  "CUSTOMER_STATE": "HARYANA",
  "PINCODE": "122001",
  "PAYMENT_MODE": "COD",
  "COURIER_NAME": "DELHIVERY",
  "ITEM_DESCRIPTION": "Electronics - Mobile Phone",
  "WEIGHT": 1.5,
  "QTY": 2,
  "INVOICE_VALUE": 2499.50,
  "ORDER_CREATION_DATE": "2025-07-22T09:00:00Z",
  "COLLECTABLE_AMOUNT": 2499.50
}
```

**Response:**
```json
{
  "order_index": 0,
  "order_number": "ORD123456",
  "rto_prediction": false,
  "rto_probability": 0.23,
  "risk_level": "Low",
  "confidence": 0.89,
  "explanation": "Order has low RTO risk due to reliable courier and complete address",
  "risk_factors": [
    "COD payment mode (+5% risk)",
    "New customer (+3% risk)"
  ],
  "recommendations": [
    "Proceed with delivery as planned",
    "Standard delivery process recommended"
  ],
  "similar_orders": [
    {
      "similarity_score": 0.89,
      "outcome": "Delivered",
      "courier": "DELHIVERY",
      "city": "GURGAON"
    }
  ],
  "prediction_timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "ORDER_NUMBER": "ORD123456",
    "CUSTOMER_NAME": "John Doe",
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
  }'
```

#### POST `/api/v1/predict/batch`
**Predict RTO for multiple orders (up to 1000)**

**Request Body:**
```json
{
  "orders": [
    { /* Order 1 */ },
    { /* Order 2 */ },
    { /* Order 3 */ }
  ],
  "batch_size": 500,
  "validate_predictions": false
}
```

**Response:**
```json
{
  "predictions": [ /* Array of prediction objects */ ],
  "summary": {
    "total_orders": 100,
    "high_risk_orders": 15,
    "medium_risk_orders": 25,
    "low_risk_orders": 60,
    "avg_rto_probability": 0.32
  },
  "total_orders": 100,
  "successful_predictions": 100,
  "failed_predictions": 0,
  "processing_time_seconds": 2.45,
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict/batch" \
  -H "Content-Type: application/json" \
  -d @batch_orders.json
```

#### POST `/api/v1/predict/csv`
**Upload CSV file for batch prediction**

**Request:**
- Content-Type: `multipart/form-data`
- File parameter: `file`
- File format: CSV with required columns

**Response:**
```json
{
  "filename": "orders.csv",
  "results": {
    "predictions": [ /* ... */ ],
    "summary": { /* ... */ }
  },
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict/csv" \
  -F "file=@data/orders.csv"
```

---

### 4. Model Management Endpoints

#### POST `/api/v1/train`
**Train a new model with uploaded training data**

**Request:**
- Content-Type: `multipart/form-data`
- File parameter: `file` (CSV with CURRENT_STATUS column)
- Optional: `description` (string)

**Response:**
```json
{
  "job_id": "train_20250722_103000",
  "status": "started",
  "message": "Model training started in background",
  "filename": "training_data.csv",
  "timestamp": "2025-07-22T10:30:00Z",
  "note": "Check /api/v1/health to monitor training progress"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/train" \
  -F "file=@data/training_data.csv" \
  -F "description=Monthly model update"
```

**Note:** Training runs in background (5-30 minutes depending on data size)

#### POST `/api/v1/retrain`
**Retrain existing model with new data**

**Request:**
- Content-Type: `multipart/form-data`
- File parameter: `file` (optional - CSV with labeled data)
- Optional: `description` (string)

**Response:**
```json
{
  "job_id": "retrain_20250722_103000",
  "status": "started",
  "message": "Model retraining started in background",
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/retrain" \
  -F "file=@data/new_training_data.csv"
```

#### GET `/api/v1/model/info`
**Get current model information**

**Response:**
```json
{
  "model_loaded": true,
  "model_type": "RandomForestClassifier",
  "model_version": "2025_07_22_10",
  "feature_count": 45,
  "last_training": "2025-07-22T09:00:00Z",
  "training_score": 0.87,
  "feature_importance": {
    "CUSTOMER_PHONE": 0.15,
    "CUSTOMER_ADDRESS": 0.14,
    "PAYMENT_MODE": 0.12
  }
}
```

---

### 5. Analytics Endpoints

#### GET `/api/v1/analytics/courier-performance`
**Get comprehensive courier performance analysis**

**Response:**
```json
{
  "courier_performance": {
    "DELHIVERY": {
      "total_orders": 1250,
      "success_rate": 92.5,
      "rto_rate": 7.5,
      "avg_delivery_time": 3.2,
      "grade": "A",
      "trend": "+2.1%",
      "recommendations": [
        "Excellent performer - continue partnership",
        "Consider increasing allocation"
      ]
    },
    "BLUEDART": {
      "total_orders": 850,
      "success_rate": 88.3,
      "rto_rate": 11.7,
      "grade": "B+",
      "recommendations": [
        "Monitor high RTO rate in specific zones"
      ]
    }
  },
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl "http://localhost:8000/api/v1/analytics/courier-performance"
```

#### GET `/api/v1/analytics/pincode/{pincode}` or `/api/v1/analytics/pincode`
**Get pincode delivery analysis**

**Parameters:**
- `pincode` (path, optional): Specific 6-digit pincode

**Response (specific pincode):**
```json
{
  "pincode_analysis": {
    "pincode": "122001",
    "total_deliveries": 450,
    "success_rate": 91.2,
    "rto_rate": 8.8,
    "avg_delivery_time": 2.8,
    "risk_level": "Low",
    "top_couriers": ["DELHIVERY", "BLUEDART"]
  },
  "pincode": "122001",
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**Response (all pincodes):**
```json
{
  "pincode_analysis": {
    "top_risky_pincodes": [
      {
        "pincode": "400001",
        "rto_rate": 25.5,
        "total_orders": 150
      }
    ],
    "top_performing_pincodes": [
      {
        "pincode": "122001",
        "success_rate": 95.2,
        "total_orders": 450
      }
    ]
  },
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Examples:**
```bash
# Specific pincode
curl "http://localhost:8000/api/v1/analytics/pincode/122001"

# All pincodes
curl "http://localhost:8000/api/v1/analytics/pincode"
```

#### POST `/api/v1/validate`
**Validate predictions against actual outcomes**

**Request:**
- Content-Type: `multipart/form-data`
- `predictions_file`: CSV with previous predictions
- `actual_outcomes_file`: CSV with actual delivery outcomes

**Response:**
```json
{
  "validation_results": {
    "accuracy": 0.87,
    "precision": 0.84,
    "recall": 0.89,
    "f1_score": 0.86,
    "confusion_matrix": {
      "true_positive": 125,
      "true_negative": 650,
      "false_positive": 35,
      "false_negative": 15
    },
    "business_metrics": {
      "correctly_predicted_rto": 125,
      "correctly_predicted_delivered": 650,
      "wrongly_flagged_as_rto": 35,
      "missed_rto_cases": 15
    }
  },
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/validate" \
  -F "predictions_file=@output/predictions_20250720.csv" \
  -F "actual_outcomes_file=@data/actual_outcomes.csv"
```

---

### 6. Reports Endpoints

#### GET `/api/v1/reports/performance`
**Generate comprehensive performance report**

**Response:**
```json
{
  "report": {
    "timestamp": "2025-07-22T10:30:00Z",
    "system_health": { /* ... */ },
    "courier_performance": { /* ... */ },
    "pincode_analysis": { /* ... */ },
    "model_info": {
      "model_type": "RandomForestClassifier",
      "feature_count": 45,
      "feature_importance": { /* ... */ }
    },
    "performance_metrics": { /* ... */ }
  },
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**Note:** Report is automatically saved to `output/performance_report_YYYYMMDD.json`

---

### 7. Management Endpoints

#### POST `/api/v1/backup`
**Create backup of current model**

**Response:**
```json
{
  "success": true,
  "backup_path": "backups/2025_07_22_10",
  "message": "Backup created successfully",
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/backup"
```

#### GET `/api/v1/backups`
**List all available backups**

**Response:**
```json
{
  "backups": [
    "2025_07_22_10",
    "2025_07_21_18",
    "2025_07_20_15"
  ],
  "count": 3,
  "timestamp": "2025-07-22T10:30:00Z"
}
```

#### POST `/api/v1/restore/{backup_name}`
**Restore model from backup**

**Parameters:**
- `backup_name` (path): Backup directory name (e.g., "2025_07_22_10")

**Response:**
```json
{
  "success": true,
  "message": "Model restored from backup: 2025_07_22_10",
  "backup_name": "2025_07_22_10",
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/restore/2025_07_22_10"
```

#### DELETE `/api/v1/backups/cleanup?max_backups=10`
**Clean up old backups**

**Parameters:**
- `max_backups` (query, default=10): Maximum backups to keep

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed, kept 10 backups",
  "remaining_backups": [
    "2025_07_22_10",
    "2025_07_21_18"
  ],
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/backups/cleanup?max_backups=5"
```

---

## Error Responses

All endpoints return standard error responses:

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "timestamp": "2025-07-22T10:30:00Z",
  "status_code": 400
}
```

### 503 Service Unavailable
```json
{
  "error": "Model not loaded. Please train the model first using POST /api/v1/train",
  "timestamp": "2025-07-22T10:30:00Z",
  "status_code": 503
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "detail": "Prediction failed: <error details>",
  "timestamp": "2025-07-22T10:30:00Z"
}
```

---

## Usage Examples

### Python Client

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Check health
response = requests.get(f"{BASE_URL}/health")
print(response.json())

# 2. Single prediction
order_data = {
    "ORDER_NUMBER": "ORD123456",
    "CUSTOMER_NAME": "John Doe",
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

response = requests.post(f"{BASE_URL}/api/v1/predict", json=order_data)
prediction = response.json()
print(f"RTO Probability: {prediction['rto_probability']}")
print(f"Risk Level: {prediction['risk_level']}")

# 3. Batch prediction
batch_request = {
    "orders": [order_data, order_data, order_data],  # Multiple orders
    "batch_size": 100
}

response = requests.post(f"{BASE_URL}/api/v1/predict/batch", json=batch_request)
results = response.json()
print(f"Processed {results['total_orders']} orders")
print(f"Processing time: {results['processing_time_seconds']}s")

# 4. CSV upload
with open('data/orders.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post(f"{BASE_URL}/api/v1/predict/csv", files=files)
    print(response.json())

# 5. Train model
with open('data/training_data.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post(f"{BASE_URL}/api/v1/train", files=files)
    print(response.json())

# 6. Get courier performance
response = requests.get(f"{BASE_URL}/api/v1/analytics/courier-performance")
couriers = response.json()
for courier, stats in couriers['courier_performance'].items():
    print(f"{courier}: {stats['success_rate']}% success rate")

# 7. Create backup
response = requests.post(f"{BASE_URL}/api/v1/backup")
print(response.json())
```

### JavaScript/Node.js Client

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:8000';

async function main() {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(health.data);

    // 2. Single prediction
    const orderData = {
        ORDER_NUMBER: 'ORD123456',
        CUSTOMER_NAME: 'John Doe',
        CUSTOMER_PHONE: '9876543210',
        CUSTOMER_ADDRESS: '123 Main St',
        CUSTOMER_CITY: 'GURGAON',
        CUSTOMER_STATE: 'HARYANA',
        PINCODE: '122001',
        PAYMENT_MODE: 'COD',
        COURIER_NAME: 'DELHIVERY',
        WEIGHT: 1.5,
        QTY: 2,
        INVOICE_VALUE: 2499.50
    };

    const prediction = await axios.post(`${BASE_URL}/api/v1/predict`, orderData);
    console.log(`RTO Probability: ${prediction.data.rto_probability}`);

    // 3. CSV upload
    const form = new FormData();
    form.append('file', fs.createReadStream('data/orders.csv'));

    const csvResult = await axios.post(`${BASE_URL}/api/v1/predict/csv`, form, {
        headers: form.getHeaders()
    });
    console.log(csvResult.data);

    // 4. Get metrics
    const metrics = await axios.get(`${BASE_URL}/api/v1/metrics`);
    console.log(metrics.data);
}

main().catch(console.error);
```

---

## Testing Checklist

- [ ] Server starts successfully
- [ ] Health endpoint returns 200
- [ ] Single prediction works
- [ ] Batch prediction works
- [ ] CSV upload works
- [ ] Model training initiates
- [ ] Courier analytics loads
- [ ] Pincode analytics loads
- [ ] Performance report generates
- [ ] Backup creation works
- [ ] Backup restoration works
- [ ] Error handling works correctly

---

## Production Deployment

### Docker Deployment

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "src.apis.api_main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

```bash
docker build -t rto-api:latest .
docker run -d -p 8000:8000 -v $(pwd)/models:/app/models rto-api:latest
```

### Production Configuration

```bash
# Use Gunicorn with Uvicorn workers
gunicorn src.apis.api_main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

---

## Support

For issues or questions:
- Check `/docs` for interactive API documentation
- Review `/health` for system status
- Check `logs/` directory for error logs
- Refer to TechnicalDocument.md for detailed information
