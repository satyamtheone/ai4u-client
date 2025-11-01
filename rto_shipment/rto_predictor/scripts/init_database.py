#!/usr/bin/env python3
"""
Initialize PostgreSQL database - create if not exists, then run migrations.
"""

import os
import sys
import time
import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


def get_database_config():
    """Extract database configuration from DATABASE_URL or environment variables."""
    database_url = os.getenv('DATABASE_URL')

    if database_url:
        # Parse DATABASE_URL
        # Format: postgresql://user:password@host:port/database
        return database_url
    else:
        # Build from individual environment variables
        user = os.getenv('POSTGRES_USER', 'postgres')
        password = os.getenv('POSTGRES_PASSWORD', 'postgres')
        host = os.getenv('POSTGRES_HOST', 'postgres')
        port = os.getenv('POSTGRES_PORT', '5432')
        database = os.getenv('POSTGRES_DB', 'rto_predictions')

        return f"postgresql://{user}:{password}@{host}:{port}/{database}"


def wait_for_postgres_server(base_url, max_retries=30, retry_interval=2):
    """
    Wait for PostgreSQL server to be ready (not database, just server).

    Args:
        base_url: Connection URL to postgres database (default database)
        max_retries: Maximum number of connection attempts
        retry_interval: Seconds between retry attempts
    """
    logger.info("⏳ Waiting for PostgreSQL server to be ready...")

    for attempt in range(1, max_retries + 1):
        try:
            engine = create_engine(base_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ PostgreSQL server is ready!")
            engine.dispose()
            return True
        except OperationalError as e:
            if attempt < max_retries:
                logger.info(f"   Attempt {attempt}/{max_retries}... (waiting for server)")
                time.sleep(retry_interval)
            else:
                logger.error(f"❌ PostgreSQL server not ready after {max_retries} attempts")
                logger.error(f"   Error: {e}")
                return False
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
            return False

    return False


def database_exists(database_url, database_name):
    """Check if database exists."""
    try:
        # Connect to postgres default database
        base_url = database_url.rsplit('/', 1)[0] + '/postgres'
        engine = create_engine(base_url)

        with engine.connect() as conn:
            # Use text() for the query and execute it properly
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                {"dbname": database_name}
            )
            exists = result.fetchone() is not None

        engine.dispose()
        return exists
    except Exception as e:
        logger.error(f"Error checking database existence: {e}")
        return False


def create_database(database_url, database_name):
    """Create database if it doesn't exist."""
    try:
        logger.info(f"🔧 Creating database '{database_name}'...")

        # Connect to postgres default database to create new database
        base_url = database_url.rsplit('/', 1)[0] + '/postgres'
        engine = create_engine(base_url, isolation_level="AUTOCOMMIT")

        with engine.connect() as conn:
            # Create database
            conn.execute(text(f'CREATE DATABASE "{database_name}"'))

        engine.dispose()
        logger.info(f"✅ Database '{database_name}' created successfully!")
        return True

    except ProgrammingError as e:
        if "already exists" in str(e):
            logger.info(f"ℹ️  Database '{database_name}' already exists")
            return True
        else:
            logger.error(f"❌ Error creating database: {e}")
            return False
    except Exception as e:
        logger.error(f"❌ Unexpected error creating database: {e}")
        return False


def verify_database_connection(database_url, max_retries=5, retry_interval=2):
    """Verify connection to the specific database."""
    logger.info("🔌 Verifying database connection...")

    for attempt in range(1, max_retries + 1):
        try:
            engine = create_engine(database_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            engine.dispose()
            logger.info("✅ Database connection verified!")
            return True
        except Exception as e:
            if attempt < max_retries:
                logger.info(f"   Attempt {attempt}/{max_retries}... (verifying connection)")
                time.sleep(retry_interval)
            else:
                logger.error(f"❌ Failed to connect to database")
                logger.error(f"   Error: {e}")
                return False

    return False


def main():
    """Main database initialization routine."""
    logger.info("=" * 60)
    logger.info("🚀 Database Initialization")
    logger.info("=" * 60)

    # Get database configuration
    database_url = get_database_config()
    database_name = database_url.split('/')[-1]

    logger.info(f"📋 Configuration:")
    logger.info(f"   Database: {database_name}")
    logger.info(f"   Host: {database_url.split('@')[1].split('/')[0] if '@' in database_url else 'unknown'}")
    logger.info("")

    # Step 1: Wait for PostgreSQL server
    base_url = database_url.rsplit('/', 1)[0] + '/postgres'
    if not wait_for_postgres_server(base_url):
        logger.error("❌ PostgreSQL server is not available")
        return False

    logger.info("")

    # Step 2: Check if database exists
    logger.info(f"🔍 Checking if database '{database_name}' exists...")
    if database_exists(database_url, database_name):
        logger.info(f"✅ Database '{database_name}' already exists")
    else:
        logger.info(f"ℹ️  Database '{database_name}' does not exist")
        # Step 3: Create database
        if not create_database(database_url, database_name):
            logger.error("❌ Failed to create database")
            return False

    logger.info("")

    # Step 4: Verify connection to database
    if not verify_database_connection(database_url):
        logger.error("❌ Failed to connect to database")
        return False

    logger.info("")
    logger.info("=" * 60)
    logger.info("✅ Database initialization complete!")
    logger.info("=" * 60)

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
