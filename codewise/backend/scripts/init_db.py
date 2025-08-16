"""
Database initialization script
"""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from core.database import engine, SessionLocal
from core.config import settings
from models import *
import structlog

logger = structlog.get_logger(__name__)

def init_database():
    """Initialize database with default data"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Create a session
        db = SessionLocal()
        
        try:
            # Check if we already have data
            from models.role import Role
            existing_roles = db.query(Role).count()
            
            if existing_roles > 0:
                logger.info("Database already initialized, skipping...")
                return
            
            logger.info("Initializing database with default data...")
            
            # The init.sql script will handle the initial data insertion
            # This script is mainly for programmatic initialization if needed
            
            logger.info("Database initialization completed successfully")
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to initialize database", error=str(e))
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error("Database initialization failed", error=str(e))
        sys.exit(1)

if __name__ == "__main__":
    init_database()
