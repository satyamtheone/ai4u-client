# Database Migrations

This directory contains database migration scripts for the RTO Prediction System using Alembic.

## Overview

Database migrations allow you to:
- Version control your database schema
- Track schema changes over time
- Easily upgrade/downgrade database versions
- Apply schema changes consistently across environments

## Prerequisites

```bash
pip install -r requirements-database.txt
```

This installs Alembic and all database dependencies.

## Configuration

Database connection is configured in `alembic.ini`:

```ini
sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/rto_predictions
```

**Production:** Set the `DATABASE_URL` environment variable to override:

```bash
export DATABASE_URL=postgresql://user:password@host:port/database
```

## Quick Start

### 1. Initialize Database (First Time)

Run the initial migration to create all tables:

```bash
# From project root
alembic upgrade head
```

This creates:
- `predictions` - All prediction records
- `model_metadata` - Model training history
- `courier_performance` - Courier statistics
- `pincode_analytics` - Geographic risk data
- `system_metrics` - Performance monitoring

### 2. Check Current Version

```bash
alembic current
```

### 3. View Migration History

```bash
alembic history
```

## Common Operations

### Create a New Migration

After modifying `src/database/models.py`:

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"
```

Or create an empty migration:

```bash
alembic revision -m "Description of changes"
```

### Apply Migrations

```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade by one version
alembic upgrade +1

# Upgrade to specific version
alembic upgrade <revision_id>
```

### Rollback Migrations

```bash
# Downgrade by one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision_id>

# Downgrade all the way
alembic downgrade base
```

### View SQL Without Applying

```bash
# See SQL for upgrade
alembic upgrade head --sql

# See SQL for downgrade
alembic downgrade -1 --sql
```

## Migration Files

### Current Migrations

- **001_initial** (`20250101_initial_schema.py`) - Initial database schema with all tables

### Creating Custom Migrations

Migrations are Python files in `alembic/versions/` with this structure:

```python
def upgrade() -> None:
    """Apply schema changes"""
    op.create_table(...)
    op.add_column(...)
    # etc.

def downgrade() -> None:
    """Revert schema changes"""
    op.drop_table(...)
    op.drop_column(...)
    # etc.
```

## Alternative: Direct Database Setup

If you don't want to use Alembic, you can use the setup script:

```bash
python scripts/setup_database.py
```

This uses SQLAlchemy to create tables directly from models.

## Troubleshooting

### "Target database is not up to date"

```bash
# Check current version
alembic current

# Upgrade to latest
alembic upgrade head
```

### "Can't locate revision"

```bash
# Stamp database with current version
alembic stamp head
```

### Reset Everything

```bash
# WARNING: This deletes all data!
python scripts/setup_database.py --reset

# Then apply migrations
alembic upgrade head
```

## Best Practices

1. **Always test migrations** in development before production
2. **Review auto-generated migrations** - they may need adjustments
3. **Never modify applied migrations** - create new ones instead
4. **Backup database** before running migrations in production
5. **Use transactions** - migrations run in transactions by default
6. **Document breaking changes** in migration messages

## Production Deployment

```bash
# 1. Backup database
pg_dump -h host -U user dbname > backup.sql

# 2. Check current version
alembic current

# 3. Test migration (dry run)
alembic upgrade head --sql > migration.sql
# Review migration.sql

# 4. Apply migration
alembic upgrade head

# 5. Verify
alembic current
psql -h host -U user dbname -c "\dt"  # List tables
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (overrides alembic.ini)

## Files

- `alembic.ini` - Alembic configuration
- `env.py` - Migration environment setup
- `script.py.mako` - Template for new migrations
- `versions/` - Migration scripts directory

## Learn More

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
