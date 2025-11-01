#!/usr/bin/env python3
"""
Wait for PostgreSQL database to be ready before proceeding.
"""

import os
import sys
import time
import logging
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def wait_for_database(max_retries=30, retry_interval=2):
    """
    Wait for the database to be ready.

    Args:
        max_retries: Maximum number of connection attempts
        retry_interval: Seconds between retry attempts
    """
    database_url = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@postgres:5432/rto_predictions'
    )

    logger.info(f"Waiting for database to be ready...")
    logger.info(f"Database: {database_url.split('@')[1] if '@' in database_url else 'unknown'}")

    for attempt in range(1, max_retries + 1):
        try:
            engine = create_engine(database_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ Database is ready!")
            return True
        except Exception as e:
            if attempt < max_retries:
                logger.info(f"⏳ Waiting for database... (attempt {attempt}/{max_retries})")
                time.sleep(retry_interval)
            else:
                logger.error(f"❌ Failed to connect to database after {max_retries} attempts")
                logger.error(f"Error: {e}")
                return False

    return False

if __name__ == "__main__":
    success = wait_for_database()
    sys.exit(0 if success else 1)
