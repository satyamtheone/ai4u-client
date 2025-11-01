# RTO Prediction System - Documentation

**Version:** 2.0.0
**Status:** ✅ Production Ready
**Last Updated:** January 2025

Welcome to the complete documentation for the RTO (Return-to-Origin) Prediction System - an end-to-end machine learning platform for predicting delivery failures in e-commerce shipments.

---

## 📚 Documentation Index

### Getting Started
- **[Quick Setup Guide](Quicksetup.md)** ⚡ - Get up and running in 5 minutes
- **[Local Setup Guide](LocalSetup.md)** 💻 - Detailed development environment setup

### Core Documentation
- **[RTO Predictor Features](RtoPredictorFeatures.md)** 🎯 - Complete feature overview
- **[Technical Documentation](Technical.md)** 🏗️ - System architecture and design
- **[Database Documentation](Database.md)** 🗄️ - Schema, migrations, and management

### Operations
- **[Deployment Guide](Deployment.md)** 🚀 - Environment-wise deployment (Dev/Staging/Prod)

---

## 🎯 What is RTO Prediction System?

The RTO Prediction System is a comprehensive ML-powered platform that predicts the likelihood of Return-to-Origin (RTO) for e-commerce shipments before they fail. It helps businesses:

✅ **Reduce RTO rates** by identifying high-risk orders proactively
✅ **Optimize courier selection** based on historical performance data
✅ **Improve delivery success** with actionable, data-driven recommendations
✅ **Track performance** with comprehensive analytics dashboards
✅ **Save costs** by preventing failed deliveries

### System Highlights

- **🎨 Modern UI:** Angular 17 dashboard with real-time updates
- **⚡ Fast API:** Production-ready FastAPI backend
- **🤖 Smart ML:** Trained models with 85%+ accuracy
- **💾 Full Persistence:** PostgreSQL database with complete audit trail
- **🐳 Easy Deploy:** Docker Compose for one-command deployment
- **📊 Rich Analytics:** Courier, geographic, and temporal insights

---

## 🚀 Quick Start

### Option 1: Docker (Recommended - 2 minutes)

```bash
# Clone and navigate
cd rto_predictor

# Start all services
docker compose up -d

# Access the system
# API: http://localhost:8002
# API Docs: http://localhost:8002/docs
# Dashboard: http://localhost:4200 (if frontend running)
```

### Option 2: Local Development

```bash
# Terminal 1: Start backend
python src/apis/api_main.py

# Terminal 2: Start frontend (optional)
cd ui-client/angular-dashboard
npm install && npm start
```

👉 **Detailed Instructions:** See [Quick Setup Guide](Quicksetup.md)

---

## 📖 Documentation Roadmap

### 🆕 New to the System?

**Start Here:**
1. Read this README (you're here!)
2. Follow the [Quick Setup Guide](Quicksetup.md) - 5 minutes
3. Explore features in [RTO Predictor Features](RtoPredictorFeatures.md) - 10 minutes
4. Try the API at http://localhost:8002/docs

**Total Time:** ~20 minutes to get familiar

### 👨‍💻 Developer Path

**For Development Work:**
1. [Local Setup Guide](LocalSetup.md) - Complete dev environment
2. [Technical Documentation](Technical.md) - Understand the architecture
3. [Database Documentation](Database.md) - Learn the data model
4. [RTO Features](RtoPredictorFeatures.md) - Explore all capabilities

**Total Time:** ~2-3 hours for complete understanding

### 🛠️ DevOps / Deployment Path

**For Production Deployment:**
1. [Deployment Guide](Deployment.md) - Environment-specific deployment
2. [Database Documentation](Database.md) - Production database setup
3. [Technical Documentation](Technical.md) - System requirements
4. [Quick Setup](Quicksetup.md) - Quick verification

**Total Time:** ~1 hour + deployment time

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Angular 17 Dashboard                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Predictions│  │ Analytics  │  │  Reports   │        │
│  │  Single    │  │ Courier    │  │ Performance│        │
│  │  Batch     │  │ Geographic │  │  Metrics   │        │
│  │  CSV       │  │  Temporal  │  │ AI Insights│        │
│  └────────────┘  └────────────┘  └────────────┘        │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌──────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8002)                  │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │  REST Endpoints  │  │  Functional API Layer    │     │
│  │  • /predict      │  │  • predict_single()      │     │
│  │  • /predict/batch│  │  • predict_batch()       │     │
│  │  • /predict/csv  │  │  • predict_csv()         │     │
│  │  • /analytics/*  │  │  • get_analytics()       │     │
│  │  • /train        │  │  • train_model()         │     │
│  └──────────────────┘  └──────────────────────────┘     │
└────────────┬───────────────────────┬──────────────────────┘
             │                       │
    ┌────────▼─────────┐    ┌───────▼──────────┐
    │   ML Pipeline    │    │   PostgreSQL 15   │
    │                  │    │                   │
    │ • Preprocessing  │    │ • predictions     │
    │ • Model Training │    │ • model_metadata  │
    │ • Prediction     │    │ • courier_perf    │
    │ • Analytics      │    │ • pincode_stats   │
    │ • Validation     │    │ • system_metrics  │
    └──────────────────┘    └───────────────────┘
```

📘 **Learn More:** [Technical Documentation](Technical.md)

---

## 🎓 Core Components

| Component | Technology | Purpose | Documentation |
|-----------|-----------|---------|---------------|
| **Frontend** | Angular 17 | User interface & visualization | [Features](RtoPredictorFeatures.md) |
| **Backend API** | FastAPI (Python 3.11) | REST API & business logic | [Technical](Technical.md) |
| **ML Engine** | scikit-learn | Prediction models | [Technical](Technical.md) |
| **Database** | PostgreSQL 15 | Data persistence & analytics | [Database](Database.md) |
| **Deployment** | Docker Compose | Containerization | [Deployment](Deployment.md) |

---

## 🔗 Quick Access Links

### Local Development (Default Ports)
- **Backend API:** http://localhost:8002
- **API Documentation:** http://localhost:8002/docs
- **Health Check:** http://localhost:8002/health
- **Angular Dashboard:** http://localhost:4200
- **PostgreSQL:** localhost:5432

### Key API Endpoints
```bash
# Health check
GET  http://localhost:8002/api/v1/health

# Single prediction
POST http://localhost:8002/api/v1/predict

# Batch prediction
POST http://localhost:8002/api/v1/predict/batch

# CSV upload
POST http://localhost:8002/api/v1/predict/csv

# Analytics
GET  http://localhost:8002/api/v1/analytics/courier-performance
GET  http://localhost:8002/api/v1/analytics/pincode/{pincode}
```

📘 **Full API Reference:** http://localhost:8002/docs

---

## 🌟 Key Features

### Prediction Capabilities
- ✅ **Single Order Prediction** - Real-time prediction for individual orders
- ✅ **Batch Prediction** - Process up to 1000 orders simultaneously
- ✅ **CSV Upload** - Bulk processing from CSV files
- ✅ **Risk Assessment** - 5-level risk categorization
- ✅ **Recommendations** - Actionable suggestions for each order

### Analytics & Insights
- ✅ **Courier Performance** - Track delivery success by courier
- ✅ **Geographic Analysis** - Pincode-wise risk zones
- ✅ **Temporal Patterns** - Time-based RTO trends
- ✅ **Model Performance** - Accuracy and metrics tracking
- ✅ **Business Impact** - Cost savings and ROI analysis

### Data Management
- ✅ **Automatic Persistence** - All predictions saved to database
- ✅ **Historical Tracking** - Complete audit trail
- ✅ **Batch Processing** - Unique batch IDs for tracking
- ✅ **Model Versioning** - Track model updates
- ✅ **Performance Metrics** - System health monitoring

📘 **Explore All Features:** [RTO Predictor Features](RtoPredictorFeatures.md)

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Angular 17 (Standalone Components)
- **Language:** TypeScript 5.2
- **State:** Signals (Angular Reactive)
- **Charts:** Chart.js + ng2-charts
- **HTTP:** RxJS Observables

### Backend
- **Framework:** FastAPI 0.104
- **Language:** Python 3.11
- **ML:** scikit-learn, pandas, numpy
- **Database ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic 1.12
- **Server:** Uvicorn/Gunicorn

### Database
- **Primary:** PostgreSQL 15
- **Connection Pooling:** Yes (10 base, 20 overflow)
- **Migrations:** Alembic
- **Backup:** pg_dump

### DevOps
- **Containerization:** Docker & Docker Compose
- **Development:** Hot reload enabled
- **Production:** Multi-worker deployment

📘 **Technical Details:** [Technical Documentation](Technical.md)

---

## 📊 System Capabilities

### Performance
- **Prediction Speed:** 50-100ms per order
- **Batch Throughput:** 100 orders in ~500ms
- **Concurrent Requests:** Supports 100+ simultaneous users
- **Model Accuracy:** 85%+ on test data
- **Uptime:** 99.9% (with proper deployment)

### Scalability
- **Horizontal Scaling:** Multi-worker support
- **Database:** Connection pooling enabled
- **Caching:** Built-in caching layer
- **Load Balancing:** Ready for reverse proxy

### Security
- **Input Validation:** Pydantic models
- **SQL Injection:** Protected via ORM
- **CORS:** Configurable
- **Authentication:** Ready for JWT (future)

📘 **Production Setup:** [Deployment Guide](Deployment.md)

---

## 🆘 Common Tasks

### First Time Setup
```bash
# 1. Quick start with Docker
docker compose up -d

# 2. Check if running
curl http://localhost:8002/health

# 3. Access API docs
open http://localhost:8002/docs
```
📘 [Quick Setup Guide](Quicksetup.md)

### Making a Prediction
```bash
curl -X POST http://localhost:8002/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "ORDER_NUMBER": "TEST001",
    "PAYMENT_MODE": "COD",
    "COURIER_NAME": "DELHIVERY",
    "PINCODE": "122001",
    "WEIGHT": 1.5,
    "QTY": 2,
    "INVOICE_VALUE": 2499.50,
    "CUSTOMER_PHONE": "9876543210"
  }'
```
📘 [RTO Features](RtoPredictorFeatures.md)

### Database Operations
```bash
# Run migrations
docker compose exec backend python scripts/run_migrations.py upgrade

# Database backup
docker compose exec postgres pg_dump -U postgres rto_predictions > backup.sql
```
📘 [Database Documentation](Database.md)

### Troubleshooting
```bash
# View logs
docker compose logs -f backend

# Restart services
docker compose restart

# Check health
curl http://localhost:8002/health
```
📘 [Local Setup Guide](LocalSetup.md)

---

## 📝 Version Information

### Current Version: 2.0.0

**What's New:**
- ✅ Complete Angular 17 dashboard
- ✅ Functional API layer with 20+ functions
- ✅ Full PostgreSQL integration
- ✅ Database migrations with Alembic
- ✅ Docker Compose support
- ✅ Comprehensive documentation
- ✅ Production-ready deployment

**Previous:** v1.0.0 - Basic ML pipeline

---

## 🎯 Next Steps

Choose your path:

### 🚀 **Just Want to Try It?**
1. Go to [Quick Setup Guide](Quicksetup.md)
2. Run `docker compose up -d`
3. Access http://localhost:8002/docs
4. Make your first prediction!

### 💻 **Setting Up for Development?**
1. Read [Local Setup Guide](LocalSetup.md)
2. Set up your environment (with/without Docker)
3. Explore the [Technical Documentation](Technical.md)
4. Check out [Database Documentation](Database.md)

### 🏢 **Deploying to Production?**
1. Review [Deployment Guide](Deployment.md)
2. Choose your environment (Dev/Staging/Prod)
3. Configure secrets and environment variables
4. Set up monitoring and backups

### 🎓 **Want to Understand Everything?**
1. Start with this README
2. Read [Technical Documentation](Technical.md)
3. Explore [RTO Features](RtoPredictorFeatures.md)
4. Review [Database Documentation](Database.md)

---

## 📞 Support & Resources

### Documentation
- **This Folder:** Complete guides for all aspects
- **API Docs:** http://localhost:8002/docs (interactive)
- **Code Comments:** Inline documentation in source

### Troubleshooting
- **Installation Issues:** [Local Setup Guide](LocalSetup.md)
- **Docker Problems:** [Deployment Guide](Deployment.md)
- **Database Errors:** [Database Documentation](Database.md)
- **API Questions:** Check `/docs` endpoint

### Logs & Debugging
```bash
# Backend logs
docker compose logs -f backend

# Database logs
docker compose logs -f postgres

# Check system health
curl http://localhost:8002/api/v1/metrics
```

---

## 📄 License & Credits

**License:** [Your License Here]
**Maintainers:** [Your Team]
**Built With:** Angular, FastAPI, PostgreSQL, scikit-learn

---

**Ready to get started?** Pick a guide above and dive in! 🚀

For the fastest start, try the [Quick Setup Guide](Quicksetup.md) - you'll be up and running in 5 minutes!
