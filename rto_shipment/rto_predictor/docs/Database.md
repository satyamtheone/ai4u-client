# Database Documentation

Complete guide for the PostgreSQL database in the RTO Prediction System.

---

## Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [Setup & Configuration](#setup--configuration)
- [Migrations](#migrations)
- [Database Operations](#database-operations)
- [Querying Data](#querying-data)
- [Performance Optimization](#performance-optimization)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Technology Stack

- **Database:** PostgreSQL 15.x
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic 1.12
- **Connection Pooling:** Built-in (10 base, 20 overflow)
- **Driver:** psycopg2-binary

### Database Features

✅ **ACID Compliance** - Full transaction support
✅ **JSON Support** - Flexible schema fields
✅ **Connection Pooling** - Optimized resource usage
✅ **Index Optimization** - Fast query performance
✅ **Migration Support** - Version-controlled schema
✅ **Automatic Timestamps** - Audit trail support

---

## Database Schema

### Tables Overview

| Table | Purpose | Key Fields | Records |
|-------|---------|-----------|---------|
| **predictions** | Store all prediction results | order_number, rto_prediction, risk_level | Growing |
| **model_metadata** | Track model training history | model_version, accuracy, metrics | ~10-20 |
| **courier_performance** | Courier statistics | courier_name, success_rate, rto_rate | ~20-50 |
| **pincode_analytics** | Geographic risk data | pincode, rto_rate, risk_level | ~10,000+ |
| **system_metrics** | Performance monitoring | timestamp, cpu, memory, api_metrics | Time-series |

### Entity Relationship Diagram

```
┌─────────────────────┐
│    predictions      │
│ ─────────────────── │
│ PK id               │───┐
│    order_number     │   │
│    customer_*       │   │
│    rto_prediction   │   │
│    rto_probability  │   │
│    risk_level       │   │
│    courier_name     │───┼──→ courier_performance
│    pincode          │───┼──→ pincode_analytics
│    model_version    │───┼──→ model_metadata
│    batch_id         │   │
│    created_at       │   │
│    updated_at       │   │
└─────────────────────┘   │
                          │
┌─────────────────────────┼────┐
│  model_metadata         │    │
│ ───────────────────────┼──  │
│ PK id                   │    │
│    model_version (UK)   │←───┘
│    model_type           │
│    training_accuracy    │
│    test_accuracy        │
│    is_active            │
│    is_production        │
└─────────────────────────┘

┌─────────────────────────┐
│  courier_performance    │
│ ─────────────────────── │
│ PK id                   │
│    courier_name         │
│    total_deliveries     │
│    successful_deliveries│
│    rto_count            │
│    success_rate         │
│    rto_rate             │
└─────────────────────────┘

┌─────────────────────────┐
│   pincode_analytics     │
│ ─────────────────────── │
│ PK id                   │
│    pincode (UK)         │
│    city                 │
│    state                │
│    total_orders         │
│    rto_rate             │
│    risk_level           │
│    cod_rto_rate         │
└─────────────────────────┘

┌─────────────────────────┐
│    system_metrics       │
│ ─────────────────────── │
│ PK id                   │
│    timestamp            │
│    total_predictions    │
│    cpu_percent          │
│    memory_usage_mb      │
│    api_requests_count   │
└─────────────────────────┘
```

### Table Schemas

#### 1. predictions

Main table storing all prediction results with full audit trail.

```sql
CREATE TABLE predictions (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Order Information
    order_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    customer_city VARCHAR(100),
    customer_state VARCHAR(100),
    pincode VARCHAR(10),

    -- Order Details
    payment_mode VARCHAR(50),
    courier_name VARCHAR(100),
    weight FLOAT,
    quantity INTEGER,
    invoice_value FLOAT,
    collectable_amount FLOAT,

    -- Prediction Results
    rto_prediction BOOLEAN NOT NULL,
    rto_probability FLOAT NOT NULL,
    risk_level VARCHAR(50),
    confidence_score FLOAT,

    -- Metadata
    prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(50),
    processing_time_ms FLOAT,

    -- Additional Data (JSON)
    risk_factors JSON,
    recommendations JSON,
    feature_importance JSON,

    -- Actual Outcome (for validation)
    actual_rto BOOLEAN,
    actual_status VARCHAR(100),
    outcome_timestamp TIMESTAMP,

    -- Batch Processing
    batch_id VARCHAR(100),

    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX ix_predictions_order_number ON predictions(order_number);
CREATE INDEX ix_predictions_pincode ON predictions(pincode);
CREATE INDEX ix_predictions_courier_name ON predictions(courier_name);
CREATE INDEX ix_predictions_prediction_timestamp ON predictions(prediction_timestamp);
CREATE INDEX ix_predictions_risk_level ON predictions(risk_level);
CREATE INDEX ix_predictions_batch_id ON predictions(batch_id);
CREATE INDEX ix_predictions_timestamp_risk ON predictions(prediction_timestamp, risk_level);
CREATE INDEX ix_predictions_courier_pincode ON predictions(courier_name, pincode);
```

#### 2. model_metadata

Track ML model versions and performance metrics.

```sql
CREATE TABLE model_metadata (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Model Information
    model_version VARCHAR(50) UNIQUE NOT NULL,
    model_type VARCHAR(100),
    model_path VARCHAR(500),

    -- Training Metrics
    training_accuracy FLOAT,
    test_accuracy FLOAT,
    precision_score FLOAT,
    recall_score FLOAT,
    f1_score FLOAT,
    roc_auc_score FLOAT,

    -- Training Details
    training_samples INTEGER,
    feature_count INTEGER,
    training_duration_seconds FLOAT,
    training_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Hyperparameters (JSON)
    hyperparameters JSON,

    -- Feature Information (JSON)
    feature_names JSON,
    feature_importance JSON,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_production BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    notes TEXT
);

CREATE INDEX ix_model_metadata_version ON model_metadata(model_version);
CREATE INDEX ix_model_metadata_active ON model_metadata(is_active);
```

#### 3. courier_performance

Store courier delivery statistics and performance metrics.

```sql
CREATE TABLE courier_performance (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    courier_name VARCHAR(100) NOT NULL,

    -- Metrics
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    rto_count INTEGER DEFAULT 0,
    success_rate FLOAT,
    rto_rate FLOAT,
    avg_delivery_time_hours FLOAT,

    -- Time Period
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Geographic Breakdown (JSON)
    city_wise_performance JSON,
    state_wise_performance JSON
);

CREATE INDEX ix_courier_performance_courier_name ON courier_performance(courier_name);
CREATE INDEX ix_courier_period ON courier_performance(courier_name, period_start, period_end);
```

#### 4. pincode_analytics

Pincode-level RTO risk analysis and statistics.

```sql
CREATE TABLE pincode_analytics (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    pincode VARCHAR(10) UNIQUE NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),

    -- Metrics
    total_orders INTEGER DEFAULT 0,
    rto_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    rto_rate FLOAT,
    success_rate FLOAT,

    -- Risk Classification
    risk_level VARCHAR(50),
    risk_score FLOAT,

    -- Payment Mode Analysis
    cod_orders INTEGER DEFAULT 0,
    prepaid_orders INTEGER DEFAULT 0,
    cod_rto_rate FLOAT,
    prepaid_rto_rate FLOAT,

    -- Courier Performance (JSON)
    courier_breakdown JSON,

    -- Time-based
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_pincode_analytics_pincode ON pincode_analytics(pincode);
CREATE INDEX ix_pincode_analytics_state ON pincode_analytics(state);
```

#### 5. system_metrics

System performance and health monitoring.

```sql
CREATE TABLE system_metrics (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prediction Metrics
    total_predictions INTEGER DEFAULT 0,
    predictions_per_minute FLOAT,
    avg_processing_time_ms FLOAT,

    -- System Resources
    cpu_percent FLOAT,
    memory_usage_mb FLOAT,
    disk_usage_percent FLOAT,

    -- Model Performance
    model_version VARCHAR(50),
    prediction_accuracy FLOAT,

    -- API Metrics
    api_requests_count INTEGER DEFAULT 0,
    api_error_count INTEGER DEFAULT 0,
    api_avg_response_time_ms FLOAT,

    -- Circuit Breaker
    circuit_breaker_state VARCHAR(50)
);

CREATE INDEX ix_system_metrics_timestamp ON system_metrics(timestamp);
```

---

## Setup & Configuration

### Quick Setup (2 Minutes)

#### Option 1: Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name rto-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=rto_predictions \
    -p 5432:5432 \
    -d postgres:15

# Initialize database
python scripts/init_database.py

# Run migrations
python scripts/run_migrations.py upgrade
```

#### Option 2: Local PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15
createdb rto_predictions

# Ubuntu/Debian
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb rto_predictions

# Initialize
python scripts/init_database.py
python scripts/run_migrations.py upgrade
```

### Environment Configuration

**Set DATABASE_URL:**

```bash
# Development
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rto_predictions"

# Production
export DATABASE_URL="postgresql://user:password@prod-host:5432/rto_predictions"
```

**Or create .env file:**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rto_predictions
POSTGRES_DB=rto_predictions
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Connection Pool Settings
POOL_SIZE=10
POOL_OVERFLOW=20
POOL_RECYCLE=3600
```

### Dependencies

```bash
# Install database dependencies
pip install sqlalchemy==2.0.23 \
            psycopg2-binary==2.9.9 \
            sqlalchemy-utils==0.41.1 \
            alembic==1.12.1
```

---

## Migrations

Database migrations use Alembic for version control and schema management.

### Why Use Migrations?

✅ **Version Control** - Track all schema changes
✅ **Reproducibility** - Apply same changes across environments
✅ **Rollback** - Undo changes if needed
✅ **Team Collaboration** - Consistent schema
✅ **Documentation** - Clear history of schema evolution

### Migration Workflow

#### 1. Apply Existing Migrations

```bash
# Upgrade to latest version
python scripts/run_migrations.py upgrade

# Check current version
python scripts/run_migrations.py current

# View migration history
python scripts/run_migrations.py history
```

#### 2. Create New Migration

When you modify `src/database/models.py`:

```bash
# Auto-generate migration from model changes
python scripts/run_migrations.py autogen "add customer email field"

# Review generated file in alembic/versions/

# Apply the migration
python scripts/run_migrations.py upgrade
```

#### 3. Rollback Migration

```bash
# Rollback one version
python scripts/run_migrations.py downgrade

# Rollback to specific version
python scripts/run_migrations.py downgrade <revision_id>

# Rollback all
python scripts/run_migrations.py downgrade base
```

### Migration Files

Current migrations:

- **001_initial_schema** - Initial database schema with all 5 tables
- **002_missing_columns** - Add customer and order detail columns
- **003_fix_timestamps** - Add default timestamps to created_at/updated_at

Location: `alembic/versions/`

### Production Migration Workflow

```bash
# 1. Backup database
pg_dump -h host -U user rto_predictions > backup.sql

# 2. Check current version
python scripts/run_migrations.py current

# 3. Test migration on staging
export DATABASE_URL="postgresql://staging-host/rto_staging"
python scripts/run_migrations.py upgrade

# 4. Apply to production
export DATABASE_URL="postgresql://prod-host/rto_prod"
python scripts/run_migrations.py upgrade

# 5. Verify
python scripts/run_migrations.py current
```

---

## Database Operations

### Using Functional API (Recommended)

The easiest way to interact with the database is through the functional API:

```python
from src.functional_api import (
    predict_single_order,
    get_recent_predictions,
    get_prediction_summary_stats
)

# Predict and auto-save to DB
order = {"ORDER_NUMBER": "ORD123", ...}
result = predict_single_order(order, save_to_db=True)

# Query recent predictions
predictions = get_recent_predictions(limit=100)

# Get summary stats
stats = get_prediction_summary_stats(days=7)
```

### Direct Database Access

```python
from src.database.database_service import get_database
from datetime import datetime, timedelta

# Get database instance
db = get_database()

# Query predictions
week_ago = datetime.utcnow() - timedelta(days=7)
predictions = db.get_predictions(
    risk_level="High",
    start_date=week_ago,
    courier_name="DELHIVERY",
    limit=100
)

# Save prediction
db.save_prediction({
    "order_number": "ORD123",
    "rto_prediction": False,
    "rto_probability": 0.23,
    "risk_level": "Low"
})

# Cleanup when done
db.cleanup()
```

### SQL Shell Access

```bash
# Docker
docker compose exec postgres psql -U postgres -d rto_predictions

# Local PostgreSQL
psql -d rto_predictions

# Commands
\dt                # List tables
\d predictions     # Describe table
\di                # List indexes
\q                 # Quit
```

---

## Querying Data

### Common Queries

#### Get Recent High-Risk Orders

```sql
SELECT
    order_number,
    customer_city,
    courier_name,
    rto_probability,
    risk_level,
    prediction_timestamp
FROM predictions
WHERE risk_level IN ('High', 'Critical')
    AND prediction_timestamp > NOW() - INTERVAL '7 days'
ORDER BY prediction_timestamp DESC
LIMIT 100;
```

#### Courier Performance Summary

```sql
SELECT
    courier_name,
    COUNT(*) as total_orders,
    SUM(CASE WHEN rto_prediction = true THEN 1 ELSE 0 END) as predicted_rto,
    ROUND(AVG(rto_probability) * 100, 2) as avg_rto_risk
FROM predictions
WHERE prediction_timestamp > NOW() - INTERVAL '30 days'
GROUP BY courier_name
ORDER BY avg_rto_risk DESC;
```

#### Pincode Risk Analysis

```sql
SELECT
    pincode,
    customer_city,
    COUNT(*) as total_orders,
    SUM(CASE WHEN rto_prediction = true THEN 1 ELSE 0 END) as high_risk_orders,
    ROUND(AVG(rto_probability) * 100, 2) as avg_risk_score
FROM predictions
WHERE pincode IS NOT NULL
GROUP BY pincode, customer_city
HAVING COUNT(*) >= 10
ORDER BY avg_risk_score DESC
LIMIT 50;
```

#### Daily Prediction Statistics

```sql
SELECT
    DATE(prediction_timestamp) as date,
    COUNT(*) as total_predictions,
    SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high_risk,
    SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) as medium_risk,
    SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) as low_risk,
    ROUND(AVG(processing_time_ms), 2) as avg_processing_ms
FROM predictions
WHERE prediction_timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(prediction_timestamp)
ORDER BY date DESC;
```

#### Model Performance Tracking

```sql
SELECT
    model_version,
    training_accuracy,
    test_accuracy,
    precision_score,
    recall_score,
    f1_score,
    training_samples,
    is_production,
    training_timestamp
FROM model_metadata
ORDER BY training_timestamp DESC;
```

---

## Performance Optimization

### Connection Pooling

Configured in database service (`src/database/database_service.py`):

```python
engine = create_engine(
    database_url,
    pool_size=10,          # Base connections
    max_overflow=20,       # Additional connections
    pool_recycle=3600,     # Recycle every hour
    pool_pre_ping=True     # Verify before use
)
```

### Index Strategy

All critical indexes are created automatically via migrations:

```sql
-- Order lookups
CREATE INDEX ix_predictions_order_number ON predictions(order_number);

-- Time-based queries
CREATE INDEX ix_predictions_prediction_timestamp ON predictions(prediction_timestamp);

-- Risk filtering
CREATE INDEX ix_predictions_risk_level ON predictions(risk_level);

-- Geographic queries
CREATE INDEX ix_predictions_pincode ON predictions(pincode);
CREATE INDEX ix_predictions_courier_name ON predictions(courier_name);

-- Composite indexes
CREATE INDEX ix_predictions_timestamp_risk ON predictions(prediction_timestamp, risk_level);
CREATE INDEX ix_predictions_courier_pincode ON predictions(courier_name, pincode);
```

### Query Optimization Tips

1. **Use indexes** - Ensure WHERE clause uses indexed columns
2. **Limit results** - Always use LIMIT for large tables
3. **Avoid SELECT *** - Select only needed columns
4. **Use composite indexes** - For multi-column filters
5. **Batch operations** - Use batch inserts for bulk data

### Monitoring Performance

```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;
```

---

## Backup & Restore

### Automated Backups

#### Using Docker

```bash
# Backup
docker compose exec postgres pg_dump -U postgres rto_predictions > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres rto_predictions < backup.sql
```

#### Using Makefile

```bash
# Create backup
make db-backup
# Saves to: backups/backup_YYYYMMDD_HHMMSS.sql

# Restore from backup
make db-restore
# Enter: backups/backup_20250101_120000.sql
```

### Manual Backup/Restore

```bash
# Backup entire database
pg_dump -h localhost -U postgres -d rto_predictions -F c -f backup.dump

# Backup specific tables
pg_dump -h localhost -U postgres -d rto_predictions \
    -t predictions -t model_metadata -F c -f predictions_backup.dump

# Restore
pg_restore -h localhost -U postgres -d rto_predictions -c backup.dump

# Backup to SQL
pg_dump -h localhost -U postgres -d rto_predictions > backup.sql

# Restore from SQL
psql -h localhost -U postgres -d rto_predictions < backup.sql
```

### Production Backup Strategy

**Recommended Approach:**

```bash
# Daily automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/rto_predictions"
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h prod-host -U postgres rto_predictions \
    -F c -f $BACKUP_DIR/backup_$DATE.dump

# Keep last 30 days
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.dump s3://bucket/backups/
```

**Add to crontab:**

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup_script.sh
```

---

## Troubleshooting

### Connection Issues

#### Error: "database does not exist"

```bash
# Check if database exists
psql -U postgres -l | grep rto_predictions

# Create database
createdb rto_predictions

# Or use init script
python scripts/init_database.py
```

#### Error: "connection refused"

```bash
# Check if PostgreSQL is running
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Docker
docker compose ps postgres

# Test connection
pg_isready -h localhost -p 5432
```

#### Error: "password authentication failed"

```bash
# Verify credentials in .env
cat .env | grep POSTGRES

# Reset PostgreSQL password
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
```

### Migration Issues

#### Error: "Target database is not up to date"

```bash
# Check current version
python scripts/run_migrations.py current

# Upgrade to latest
python scripts/run_migrations.py upgrade
```

#### Error: "Can't locate revision"

```bash
# Database and code are out of sync
# Mark database as current (careful!)
alembic stamp head

# Or rollback and reapply
python scripts/run_migrations.py downgrade base
python scripts/run_migrations.py upgrade
```

#### Error: "Duplicate column" during migration

```bash
# Migration partially applied
# Option 1: Manually fix the database
psql -d rto_predictions
ALTER TABLE predictions DROP COLUMN column_name;

# Option 2: Create fixing migration
python scripts/run_migrations.py autogen "fix duplicate column"
```

### Performance Issues

#### Slow Queries

```bash
# Enable query logging in postgresql.conf
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000  # Log queries > 1s

# Check slow queries
SELECT
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### High Connection Count

```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check max connections
SHOW max_connections;

# Increase if needed (postgresql.conf)
max_connections = 200
```

#### Table Bloat

```bash
# Vacuum tables
VACUUM ANALYZE predictions;

# Full vacuum (requires exclusive lock)
VACUUM FULL predictions;

# Auto-vacuum settings (postgresql.conf)
autovacuum = on
autovacuum_max_workers = 3
```

---

## Best Practices

### Development

1. **Use migrations** for all schema changes
2. **Test locally** before deploying to production
3. **Keep models in sync** with database schema
4. **Use transactions** for multi-step operations
5. **Index frequently** queried columns

### Production

1. **Automated backups** - Daily at minimum
2. **Monitor performance** - Track slow queries
3. **Connection pooling** - Optimize resource usage
4. **Regular vacuuming** - Prevent table bloat
5. **Security** - Use strong passwords, SSL connections
6. **Monitoring** - Set up alerts for issues

### Data Management

1. **Archive old data** - Move historical records
2. **Partition large tables** - For better performance
3. **Document queries** - Maintain query library
4. **Test backups** - Verify restore works
5. **Version control** - Track schema changes

---

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)

---

## Related Documentation

- [Quick Setup Guide](Quicksetup.md) - Get started quickly
- [Local Setup Guide](LocalSetup.md) - Development environment
- [Technical Documentation](Technical.md) - System architecture
- [Deployment Guide](Deployment.md) - Production deployment

---

**Version:** 2.0.0
**Last Updated:** January 2025

**Database Status:** ✅ Configured and ready to use
