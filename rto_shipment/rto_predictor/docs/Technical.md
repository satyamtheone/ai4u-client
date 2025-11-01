# Technical Documentation

System architecture, design decisions, and technical specifications for the RTO Prediction System.

---

## System Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Browser    │  │  Mobile App  │  │  API Client  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └──────────────────┴──────────────────┘          │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS/REST
┌─────────────────────────▼────────────────────────────────┐
│               Presentation Layer                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │         Angular 17 Dashboard                         ││
│  │  • TypeScript Components                             ││
│  │  • RxJS Observables                                  ││
│  │  • Chart.js Visualizations                           ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────▼────────────────────────────────┐
│                  API Layer (FastAPI)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Endpoints   │  │ Middleware   │  │  Validation  │  │
│  │  /predict    │  │  CORS        │  │  Pydantic    │  │
│  │  /analytics  │  │  Logging     │  │  Models      │  │
│  │  /train      │  │  Auth (TBD)  │  │  Schemas     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│              Business Logic Layer                         │
│  ┌──────────────────────────────────────────────────────┐│
│  │         Functional API (src/functional_api.py)       ││
│  │  • predict_single_order()                            ││
│  │  • predict_batch_orders()                            ││
│  │  • get_analytics()                                   ││
│  │  • train_model()                                     ││
│  └──────────────────────────────────────────────────────┘│
└───────────┬─────────────────────────┬────────────────────┘
            │                         │
┌───────────▼──────────┐  ┌──────────▼──────────────────┐
│   ML Pipeline        │  │  Database Service           │
│  ┌────────────────┐  │  │ ┌────────────────────────┐ │
│  │ Preprocessing  │  │  │ │  SQLAlchemy Models     │ │
│  │ Model Training │  │  │ │  Session Management    │ │
│  │ Prediction     │  │  │ │  Connection Pooling    │ │
│  │ Analytics      │  │  │ │  CRUD Operations       │ │
│  └────────────────┘  │  │ └────────────────────────┘ │
└──────────────────────┘  └───────────┬─────────────────┘
                                      │
                          ┌───────────▼──────────────┐
                          │  PostgreSQL Database     │
                          │  • predictions           │
                          │  • model_metadata        │
                          │  • courier_performance   │
                          │  • pincode_analytics     │
                          │  • system_metrics        │
                          └──────────────────────────┘
```

### Component Details

#### 1. Frontend (Angular 17)

**Technology Stack:**
- Framework: Angular 17.0+ (Standalone Components)
- Language: TypeScript 5.2
- State Management: Signals (Angular Reactive)
- HTTP Client: RxJS 7.x
- Charts: Chart.js 4.x + ng2-charts
- UI Framework: Bootstrap 5 / Custom CSS

**Key Components:**
- Predictions Page (Single/Batch/CSV)
- Analytics Dashboard
- Courier Performance Viewer
- Geographic Analysis
- AI Insights

**Features:**
- Reactive Forms
- Real-time Updates
- Client-side Caching (30s TTL)
- Error Handling
- Loading States

#### 2. Backend API (FastAPI)

**Technology Stack:**
- Framework: FastAPI 0.104+
- Python: 3.11+
- ASGI Server: Uvicorn (dev) / Gunicorn (prod)
- Validation: Pydantic 2.x
- API Documentation: OpenAPI 3.0 (Swagger)

**Architecture:**
- RESTful API design
- Request/Response validation
- Dependency injection
- Middleware stack (CORS, logging, compression)
- Exception handling

**Endpoints:**
```python
# Predictions
POST /api/v1/predict              # Single order
POST /api/v1/predict/batch        # Batch orders
POST /api/v1/predict/csv          # CSV upload

# Analytics
GET /api/v1/analytics/courier-performance
GET /api/v1/analytics/pincode/{pincode}
GET /api/v1/reports/performance

# Model Management
POST /api/v1/train
POST /api/v1/retrain
GET  /api/v1/model/info

# System
GET /api/v1/health
GET /api/v1/metrics
```

#### 3. Functional API Layer

**Purpose:** Reusable business logic abstraction

**Design Pattern:** Singleton + Factory

**Key Functions:**
```python
# Prediction Functions
predict_single_order(order_data, save_to_db=True)
predict_batch_orders(orders, save_to_db=True)
predict_from_csv_file(file_path, save_to_db=True)

# Analytics Functions
get_courier_analytics()
get_pincode_analytics(pincode=None)
get_performance_report()
get_recent_predictions(limit=100, risk_level=None)

# Model Functions
train_model(training_data_path)
retrain_model(new_data_path=None)
get_model_info()

# System Functions
get_system_health()
cleanup_resources()
```

**Benefits:**
- No class instantiation required
- Automatic resource management
- Built-in error handling
- Database persistence
- Consistent interface

#### 4. ML Pipeline

**Components:**
- Data Preprocessing Module
- Feature Engineering Module
- Model Training Module
- Prediction Module
- Analytics Module
- Validation Module

**ML Algorithms:**
- Random Forest Classifier
- Gradient Boosting Classifier
- Logistic Regression

**Features Used:**
- Order characteristics (value, weight, quantity)
- Customer demographics (location, phone)
- Delivery details (courier, payment mode)
- Historical patterns (pincode stats, courier performance)

**Model Performance:**
- Accuracy: 85%+
- Precision: 82%+
- Recall: 88%+
- F1 Score: 85%+

#### 5. Database (PostgreSQL)

**Version:** 15.x

**Tables:**
1. predictions - All prediction records
2. model_metadata - Model training history
3. courier_performance - Courier statistics
4. pincode_analytics - Geographic data
5. system_metrics - Performance monitoring

**Features:**
- Connection Pooling (10 base, 20 overflow)
- Session Management
- Transaction Support
- Index Optimization
- ACID Compliance

---

## Data Flow

### Prediction Request Flow

```
1. Client Request
   │
   ├─→ Angular Dashboard
   │   └─→ HTTP POST /api/v1/predict
   │
2. API Layer
   │
   ├─→ FastAPI Endpoint
   │   ├─→ Pydantic Validation
   │   └─→ Convert to Dict
   │
3. Business Logic
   │
   ├─→ Functional API
   │   ├─→ Get Predictor (Singleton)
   │   ├─→ Preprocess Data
   │   ├─→ Make Prediction
   │   └─→ Save to Database
   │
4. ML Processing
   │
   ├─→ Feature Engineering
   ├─→ Model Inference
   └─→ Post-processing
   │
5. Database
   │
   ├─→ Save Prediction
   ├─→ Update Analytics
   └─→ Log Metrics
   │
6. Response
   │
   └─→ Return JSON
       ├─→ rto_prediction: bool
       ├─→ rto_probability: float
       ├─→ risk_level: str
       └─→ recommendations: list
```

---

## Technology Decisions

### Why FastAPI?

✅ **Performance:** ASGI, async support
✅ **Documentation:** Auto-generated OpenAPI docs
✅ **Validation:** Built-in Pydantic integration
✅ **Modern:** Type hints, async/await
✅ **Ecosystem:** Large community, many plugins

### Why PostgreSQL?

✅ **ACID Compliance:** Data integrity
✅ **JSON Support:** Flexible schema fields
✅ **Performance:** Excellent for analytics
✅ **Reliability:** Production-proven
✅ **Features:** Full-text search, GIS, etc.

### Why Angular?

✅ **Structure:** Opinionated, scalable
✅ **TypeScript:** Type safety
✅ **Reactive:** Built-in state management
✅ **Tooling:** CLI, testing, etc.
✅ **Enterprise:** Production-ready

---

## Performance Considerations

### Backend Optimization

**Connection Pooling:**
```python
engine = create_engine(
    database_url,
    pool_size=10,          # Base connections
    max_overflow=20,       # Additional connections
    pool_recycle=3600,     # Recycle every hour
    pool_pre_ping=True     # Verify before use
)
```

**Caching:**
- Predictor instance cached (singleton)
- Model loaded once
- Feature transformers cached

**Async Processing:**
- Background tasks for training
- Non-blocking I/O
- Concurrent request handling

### Database Optimization

**Indexes:**
```sql
CREATE INDEX idx_predictions_order_number ON predictions(order_number);
CREATE INDEX idx_predictions_timestamp ON predictions(prediction_timestamp);
CREATE INDEX idx_predictions_risk_level ON predictions(risk_level);
```

**Connection Management:**
- Pooling enabled
- Automatic cleanup
- Transaction management

### Frontend Optimization

**Lazy Loading:**
- Route-based code splitting
- On-demand component loading

**Caching:**
- API response caching (30s TTL)
- Service worker (future)

---

## Security

### Current Implementation

✅ Input Validation (Pydantic)
✅ SQL Injection Protection (ORM)
✅ CORS Configuration
✅ Error Sanitization
✅ Logging & Monitoring

### Future Enhancements

⏳ JWT Authentication
⏳ Rate Limiting
⏳ API Key Management
⏳ Role-Based Access Control
⏳ Data Encryption at Rest

---

## Scalability

### Horizontal Scaling

**Backend:**
```bash
# Multiple workers
gunicorn src.apis.api_main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker
```

**Database:**
- Read replicas
- Connection pooling
- Query optimization

**Load Balancing:**
- Nginx reverse proxy
- Round-robin distribution
- Health check monitoring

### Vertical Scaling

- Increase worker count
- Add more RAM
- Faster CPU

---

## Monitoring & Observability

### Health Checks

```bash
GET /api/v1/health
{
  "status": "healthy",
  "model_loaded": true,
  "database": "connected",
  "uptime_seconds": 3600
}
```

### Metrics

```bash
GET /api/v1/metrics
{
  "predictions_count": 1000,
  "error_count": 5,
  "avg_response_time_ms": 150,
  "memory_usage_mb": 512,
  "cpu_percent": 25
}
```

### Logging

- Structured logging (JSON)
- Log levels (DEBUG, INFO, WARNING, ERROR)
- Request/response logging
- Error tracking

---

## Development Standards

### Code Style

**Python:**
- PEP 8 compliance
- Black formatting
- Type hints
- Docstrings

**TypeScript:**
- Angular style guide
- ESLint rules
- Prettier formatting

### Testing

**Backend:**
```python
pytest tests/
pytest --cov=src tests/
```

**Frontend:**
```bash
npm test
npm run test:coverage
```

---

## Deployment Architecture

### Development
- Single container
- SQLite/PostgreSQL
- Hot reload enabled

### Staging
- Multiple containers
- PostgreSQL RDS
- SSL enabled

### Production
- Load balanced
- Managed PostgreSQL
- Auto-scaling
- Monitoring enabled

See [Deployment Guide](Deployment.md) for details.

---

## Future Roadmap

### Short Term
- [ ] WebSocket support for real-time updates
- [ ] Advanced analytics dashboards
- [ ] Model A/B testing framework
- [ ] Automated model retraining

### Long Term
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Multi-region support
- [ ] Advanced ML models (Deep Learning)

---

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Angular Documentation](https://angular.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [scikit-learn Documentation](https://scikit-learn.org/)

---

**Technical Questions?** Check other documentation:
- [Database Details](Database.md)
- [Deployment Guide](Deployment.md)
- [Local Setup](LocalSetup.md)
