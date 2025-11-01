# Quick Setup Guide - 5 Minutes

Get the RTO Prediction System running in just 5 minutes!

---

## Prerequisites

Choose your path:

**Docker (Recommended):**
- Docker Desktop 20.10+ 
- 4GB RAM, 10GB disk space

**Non-Docker:**
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

---

## Option 1: Docker Setup (2 Minutes) ⚡

### Step 1: Start Services

```bash
# Navigate to project
cd rto_predictor

# Start everything
docker compose up -d
```

That's it! The system will:
- ✅ Create PostgreSQL database
- ✅ Run migrations
- ✅ Start backend API
- ✅ Load ML model

### Step 2: Verify

```bash
# Check if services are running
docker compose ps

# Should show:
# rto-postgres   Up
# rto-backend    Up
```

### Step 3: Test

```bash
# Health check
curl http://localhost:8002/health

# Expected: {"status":"healthy",...}
```

### Access Points

- **API:** http://localhost:8002
- **API Docs:** http://localhost:8002/docs
- **Database:** localhost:5432

### Quick Commands

```bash
# View logs
docker compose logs -f backend

# Stop services
docker compose down

# Restart
docker compose restart

# Clean restart
docker compose down -v && docker compose up -d
```

---

## Option 2: Non-Docker Setup (5 Minutes)

### Step 1: Database

```bash
# Install PostgreSQL (if not installed)
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu
sudo apt install postgresql-15
sudo systemctl start postgresql

# Create database
createdb rto_predictions
```

### Step 2: Backend

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r requirements-database.txt

# Run migrations
python scripts/init_database.py
python scripts/run_migrations.py upgrade

# Start backend
python src/apis/api_main.py
```

Backend runs at: http://localhost:8002

### Step 3: Frontend (Optional)

```bash
# Navigate to dashboard
cd ui-client/angular-dashboard

# Install and start
npm install
npm start
```

Frontend runs at: http://localhost:4200

---

## Quick Test

### Test 1: Health Check

```bash
curl http://localhost:8002/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2025-01-01T10:00:00"
}
```

### Test 2: Make a Prediction

```bash
curl -X POST http://localhost:8002/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "ORDER_NUMBER": "TEST001",
    "CUSTOMER_PHONE": "9876543210",
    "PAYMENT_MODE": "COD",
    "COURIER_NAME": "DELHIVERY",
    "PINCODE": "122001",
    "WEIGHT": 1.5,
    "QTY": 2,
    "INVOICE_VALUE": 2499.50
  }'
```

Expected response:
```json
{
  "order_number": "TEST001",
  "rto_prediction": false,
  "rto_probability": 0.23,
  "risk_level": "Low",
  "recommendations": [...]
}
```

### Test 3: Browse API Docs

Open in browser: http://localhost:8002/docs

Try the interactive API documentation!

---

## Environment Variables

Edit `.env` to customize:

```env
# Database
POSTGRES_DB=rto_predictions
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# API
API_PORT=8002
LOG_LEVEL=INFO

# Features
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

---

## Common First-Time Issues

### Issue 1: Port Already in Use

**Error:** `Port 8002 is already allocated`

**Solution:**
```bash
# Find process
lsof -i :8002

# Kill it
kill -9 <PID>

# Or change port in .env
API_PORT=8003
```

### Issue 2: Database Connection Failed

**Error:** `database "rto_predictions" does not exist`

**Solution (Docker):**
```bash
# Restart with clean volumes
docker compose down -v
docker compose up -d
```

**Solution (Non-Docker):**
```bash
# Create database manually
createdb rto_predictions

# Run init script
python scripts/init_database.py
```

### Issue 3: Migrations Failed

**Error:** `No config file 'alembic.ini' found`

**Solution:**
```bash
# Ensure you're in project root
cd rto_predictor

# Verify alembic.ini exists
ls alembic.ini

# Run migrations
python scripts/run_migrations.py upgrade
```

### Issue 4: Model Not Found

**Error:** `Model not loaded`

**Solution:**
- This is expected on first run
- The model will be loaded after training
- API will work but predictions need a trained model
- See [RtoPredictorFeatures.md](RtoPredictorFeatures.md) for training

---

## Verification Checklist

After setup, verify:

- [ ] Docker containers running (or services started)
- [ ] Health endpoint returns 200 OK
- [ ] API docs accessible at /docs
- [ ] Database accessible (postgres:5432)
- [ ] Logs show no errors
- [ ] Test prediction works

**All checked?** ✅ You're ready to use the system!

---

## What's Next?

### Explore Features
- Read [RTO Predictor Features](RtoPredictorFeatures.md)
- Try different prediction methods (single/batch/CSV)
- Explore analytics endpoints

### Development Setup
- See [Local Setup Guide](LocalSetup.md)
- Set up hot-reload for development
- Configure your IDE

### Production Deployment
- Read [Deployment Guide](Deployment.md)
- Configure for your environment
- Set up monitoring

---

## Quick Reference

### Start/Stop

```bash
# Docker
docker compose up -d        # Start
docker compose down         # Stop
docker compose restart      # Restart

# Non-Docker
python src/apis/api_main.py              # Start backend
cd ui-client/angular-dashboard && npm start  # Start frontend
```

### Logs

```bash
# Docker
docker compose logs -f backend
docker compose logs -f postgres

# Non-Docker
# Check logs/ directory
tail -f logs/api.log
```

### Database

```bash
# Docker
docker compose exec postgres psql -U postgres -d rto_predictions

# Non-Docker
psql -d rto_predictions
```

### Health Check

```bash
curl http://localhost:8002/health
curl http://localhost:8002/api/v1/metrics
```

---

## Troubleshooting Commands

```bash
# Check if services are running
docker compose ps

# View recent logs
docker compose logs --tail=50 backend

# Restart specific service
docker compose restart backend

# Clean restart (removes all data!)
docker compose down -v
docker compose up -d

# Rebuild after code changes
docker compose build --no-cache
docker compose up -d
```

---

## Getting Help

**Setup Issues:**
- Review this guide
- Check [Local Setup Guide](LocalSetup.md)
- Review logs for errors

**API Questions:**
- Browse http://localhost:8002/docs
- See [RTO Features](RtoPredictorFeatures.md)

**Database Issues:**
- See [Database Documentation](Database.md)
- Check PostgreSQL logs

**General Questions:**
- Read [Technical Documentation](Technical.md)
- Check [README](README.md)

---

## Summary

**You've successfully set up the RTO Prediction System!**

✅ Services are running
✅ Database is configured
✅ API is accessible
✅ Ready for predictions

**Quick Access:**
- API Docs: http://localhost:8002/docs
- Health: http://localhost:8002/health

**Next Steps:**
1. Explore the API documentation
2. Make test predictions
3. Review [RTO Features](RtoPredictorFeatures.md)
4. For development, see [Local Setup](LocalSetup.md)

---

**Setup Time:** 2-5 minutes
**Status:** ✅ Complete
**What's Next:** [Explore Features](RtoPredictorFeatures.md)
