# Local Development Setup Guide

Complete guide for setting up the RTO Prediction System for local development.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup WITHOUT Docker](#setup-without-docker)
- [Setup WITH Docker](#setup-with-docker)
- [Development Workflow](#development-workflow)
- [IDE Configuration](#ide-configuration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**For All Setups:**
- Git 2.x+
- Code editor (VS Code recommended)

**Without Docker:**
- Python 3.11+
- Node.js 18+  
- PostgreSQL 15+
- pip (Python package manager)
- npm (Node package manager)

**With Docker:**
- Docker Desktop 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### System Requirements

- **OS:** macOS, Linux, Windows (WSL2)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 10GB free space
- **Network:** Internet for package downloads

---

## Setup WITHOUT Docker

Complete manual setup for local development.

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd rto_predictor

# Verify files
ls -la
# Should see: src/, docs/, requirements.txt, etc.
```

### Step 2: Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb rto_predictions
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb rto_predictions
```

**Windows (WSL2):**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo service postgresql start

# Create database
sudo -u postgres createdb rto_predictions
```

**Verify Installation:**
```bash
psql --version
# Should show: psql (PostgreSQL) 15.x

# Test connection
psql -d rto_predictions -c "SELECT version();"
```

### Step 3: Install Python Dependencies

```bash
# Create virtual environment (recommended)
python3 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-database.txt

# Verify installation
python -c "import fastapi, sqlalchemy, pandas; print('All imports successful')"
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or your preferred editor
```

**Essential .env settings:**
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rto_predictions
POSTGRES_DB=rto_predictions
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# API
API_HOST=0.0.0.0
API_PORT=8002
LOG_LEVEL=DEBUG

# Development
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

### Step 5: Initialize Database

```bash
# Run database initialization
python scripts/init_database.py

# Expected output:
# ✅ PostgreSQL server is ready!
# ✅ Database 'rto_predictions' created
# ✅ Database connection verified!

# Run migrations
python scripts/run_migrations.py upgrade

# Expected output:
# INFO  [alembic.runtime.migration] Running upgrade -> 001_initial
# INFO  [alembic.runtime.migration] Running upgrade 001_initial -> 002_missing_columns
# INFO  [alembic.runtime.migration] Running upgrade 002_missing_columns -> 003_fix_timestamps
```

### Step 6: Start Backend

```bash
# Start FastAPI backend
python src/apis/api_main.py

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8002
# INFO:     Application startup complete.
```

**Test backend:**
```bash
# In a new terminal
curl http://localhost:8002/health

# Should return:
# {"status":"healthy","model_loaded":true,...}
```

### Step 7: Install Frontend (Optional)

```bash
# Navigate to Angular dashboard
cd ui-client/angular-dashboard

# Install dependencies
npm install

# Start development server
npm start

# Expected output:
# Angular Live Development Server listening on localhost:4200
```

**Access frontend:** http://localhost:4200

### Step 8: Verify Setup

```bash
# Backend health
curl http://localhost:8002/health

# API documentation
open http://localhost:8002/docs

# Database connection
psql -d rto_predictions -c "\dt"

# Should list tables:
# predictions, model_metadata, courier_performance, etc.
```

---

## Setup WITH Docker

Streamlined setup using Docker Compose.

### Step 1: Install Docker

**macOS:**
```bash
# Download Docker Desktop from docker.com
# Or using Homebrew
brew install --cask docker
```

**Ubuntu:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in
```

**Windows:**
- Download Docker Desktop from docker.com
- Enable WSL2 integration

**Verify:**
```bash
docker --version
docker compose version
```

### Step 2: Configure Environment

```bash
# Copy environment template  
cp .env.example .env

# Review .env settings (usually defaults work)
cat .env
```

### Step 3: Start Services

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# Should show:
# rto-postgres   Up
# rto-backend    Up
```

### Step 4: View Logs

```bash
# All logs
docker compose logs -f

# Backend only
docker compose logs -f backend

# Database only
docker compose logs -f postgres
```

### Step 5: Verify Setup

```bash
# Health check
curl http://localhost:8002/health

# API docs
open http://localhost:8002/docs

# Database
docker compose exec postgres psql -U postgres -d rto_predictions -c "\dt"
```

---

## Development Workflow

### Without Docker

**Daily Workflow:**

```bash
# 1. Activate virtual environment
source venv/bin/activate

# 2. Pull latest changes
git pull origin main

# 3. Update dependencies (if changed)
pip install -r requirements.txt

# 4. Run migrations (if new ones exist)
python scripts/run_migrations.py upgrade

# 5. Start backend
python src/apis/api_main.py

# 6. Start frontend (separate terminal)
cd ui-client/angular-dashboard && npm start
```

**Hot Reload:**
- Backend: FastAPI auto-reloads on file changes
- Frontend: Angular auto-reloads on save

**Making Changes:**

1. Edit Python files in `src/`
2. Save → Backend reloads automatically
3. Test at http://localhost:8002/docs

### With Docker

**Development Mode:**

```bash
# Start with development configuration
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# This enables:
# - Hot reload for backend
# - Source code mounting
# - Debug logging
# - Debugger port (5678)
```

**Making Changes:**

1. Edit files in `src/`
2. Save → Docker detects changes
3. Backend reloads automatically
4. Test changes immediately

**Rebuild After Dependencies Change:**

```bash
# If you modified requirements.txt
docker compose build backend
docker compose up -d
```

---

## IDE Configuration

### VS Code Setup

**Recommended Extensions:**
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-azuretools.vscode-docker",
    "angular.ng-template",
    "dbaeumer.vscode-eslint"
  ]
}
```

**Python Settings (.vscode/settings.json):**
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "python.analysis.typeCheckingMode": "basic",
  "[python]": {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  }
}
```

**Debug Configuration (.vscode/launch.json):**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI Backend",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "src.apis.api_main:app",
        "--reload",
        "--port",
        "8002"
      ],
      "jinja": true
    }
  ]
}
```

### PyCharm Setup

1. **Set Python Interpreter:**
   - File → Settings → Project → Python Interpreter
   - Select virtual environment (venv/bin/python)

2. **Configure Run Configuration:**
   - Run → Edit Configurations
   - Add Python configuration
   - Script: `venv/bin/uvicorn`
   - Parameters: `src.apis.api_main:app --reload --port 8002`

3. **Database Tool:**
   - View → Tool Windows → Database
   - Add PostgreSQL data source
   - Host: localhost, Port: 5432
   - Database: rto_predictions

---

## Common Development Tasks

### Running Migrations

```bash
# Create new migration
python scripts/run_migrations.py autogen "description"

# Apply migrations
python scripts/run_migrations.py upgrade

# Rollback
python scripts/run_migrations.py downgrade
```

### Database Operations

```bash
# Backup
pg_dump -U postgres rto_predictions > backup.sql

# Restore
psql -U postgres rto_predictions < backup.sql

# Reset database
dropdb rto_predictions
createdb rto_predictions
python scripts/init_database.py
python scripts/run_migrations.py upgrade
```

### Testing API

```bash
# Health check
curl http://localhost:8002/health

# Single prediction
curl -X POST http://localhost:8002/api/v1/predict \
  -H "Content-Type: application/json" \
  -d @test_data.json

# Interactive docs
open http://localhost:8002/docs
```

### Viewing Logs

**Without Docker:**
```bash
# Backend logs are shown in terminal
# Or check logs/ directory
tail -f logs/api.log
```

**With Docker:**
```bash
docker compose logs -f backend
```

---

## Troubleshooting

### Common Issues

#### Issue: Import errors

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### Issue: Database connection failed

**Error:** `psycopg2.OperationalError: could not connect`

**Solution:**
```bash
# Check PostgreSQL is running
# macOS:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

#### Issue: Port already in use

**Error:** `Port 8002 is already in use`

**Solution:**
```bash
# Find process
lsof -i :8002

# Kill it
kill -9 <PID>

# Or change port in .env
API_PORT=8003
```

#### Issue: Migrations fail

**Error:** `Target database is not up to date`

**Solution:**
```bash
# Check current version
python scripts/run_migrations.py current

# Force stamp to head
alembic stamp head

# Try upgrade again
python scripts/run_migrations.py upgrade
```

---

## Development Best Practices

### Code Style

- **Python:** Follow PEP 8
- **TypeScript:** Use Angular style guide
- **Formatting:** Use Black for Python, Prettier for TypeScript

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, commit frequently
git add .
git commit -m "feat: add feature description"

# Push changes
git push origin feature/your-feature
```

### Testing

```bash
# Run Python tests (if available)
pytest tests/

# Run Angular tests
cd ui-client/angular-dashboard
npm test
```

---

## What's Next?

**Development Ready?** 
→ Start building features
→ Read [Technical Documentation](Technical.md)
→ Check [RTO Features](RtoPredictorFeatures.md)

**Need to Deploy?**
→ See [Deployment Guide](Deployment.md)

**Database Questions?**
→ Read [Database Documentation](Database.md)

---

**Setup Complete!** ✅ Happy coding! 🚀
