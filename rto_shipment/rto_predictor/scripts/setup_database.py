#!/usr/bin/env python3
"""
Database Setup Script for RTO Prediction System

This script creates the PostgreSQL database and all required tables.

Usage:
    python scripts/setup_database.py

Environment Variables:
    DATABASE_URL: PostgreSQL connection string (optional)
                 Default: postgresql://postgres:postgres@localhost:5432/rto_predictions
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy_utils import database_exists, create_database, drop_database

from src.database.models import Base
from src.database.database_service import DatabaseService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_database(database_url: str = None, reset: bool = False):
    """
    Set up the RTO predictions database

    Args:
        database_url: PostgreSQL connection string
        reset: If True, drop existing database and recreate
    """

    # Get database URL
    if not database_url:
        database_url = os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/rto_predictions'
        )

    logger.info(f"Setting up database: {database_url.split('@')[1] if '@' in database_url else database_url}")

    try:
        # Check if database exists
        if database_exists(database_url):
            if reset:
                logger.warning("Dropping existing database...")
                drop_database(database_url)
                logger.info("Database dropped")
            else:
                logger.info("Database already exists")

        # Create database if it doesn't exist
        if not database_exists(database_url):
            logger.info("Creating database...")
            create_database(database_url)
            logger.info("Database created successfully")

        # Create tables
        logger.info("Creating tables...")
        db_service = DatabaseService(database_url)
        db_service.create_tables()
        logger.info("Tables created successfully")

        # Verify tables
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))

            tables = [row[0] for row in result]
            logger.info(f"Created tables: {', '.join(tables)}")

        logger.info("✅ Database setup complete!")

        # Print connection info
        print("\n" + "="*60)
        print("Database Setup Successful!")
        print("="*60)
        print(f"\nConnection String: {database_url}")
        print(f"\nTables Created:")
        for table in tables:
            print(f"  - {table}")
        print("\n" + "="*60)

    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise


def verify_connection(database_url: str = None):
    """Verify database connection"""

    if not database_url:
        database_url = os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/rto_predictions'
        )

    try:
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            logger.info(f"✅ Connection successful! PostgreSQL version: {version}")
            return True
    except Exception as e:
        logger.error(f"❌ Connection failed: {e}")
        return False


def print_usage():
    """Print usage instructions"""
    print("""
RTO Prediction Database Setup
==============================

This script sets up the PostgreSQL database for the RTO Prediction System.

Usage:
    python scripts/setup_database.py [options]

Options:
    --reset     Drop and recreate the database (WARNING: deletes all data!)
    --verify    Only verify the database connection
    --help      Show this help message

Environment Variables:
    DATABASE_URL    PostgreSQL connection string
                   Format: postgresql://user:password@host:port/database
                   Default: postgresql://postgres:postgres@localhost:5432/rto_predictions

Examples:
    # Setup database with default settings
    python scripts/setup_database.py

    # Reset database (drop and recreate)
    python scripts/setup_database.py --reset

    # Verify connection
    python scripts/setup_database.py --verify

    # Use custom database URL
    DATABASE_URL=postgresql://user:pass@host:5432/dbname python scripts/setup_database.py

Prerequisites:
    1. PostgreSQL server must be running
    2. User must have CREATE DATABASE privileges
    3. Required Python packages:
       - sqlalchemy
       - psycopg2-binary
       - sqlalchemy-utils

Install dependencies:
    pip install -r requirements-database.txt
    """)


if __name__ == "__main__":
    import sys

    # Parse command line arguments
    args = sys.argv[1:]

    if '--help' in args or '-h' in args:
        print_usage()
        sys.exit(0)

    if '--verify' in args:
        verify_connection()
        sys.exit(0)

    reset = '--reset' in args

    if reset:
        confirm = input("⚠️  WARNING: This will delete ALL data! Are you sure? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Aborted")
            sys.exit(0)

    # Setup database
    try:
        setup_database(reset=reset)
    except Exception as e:
        logger.error(f"Setup failed: {e}")
        sys.exit(1)
