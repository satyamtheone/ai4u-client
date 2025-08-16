from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import ResponseModel
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.get("/", response_model=ResponseModel)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint with database connectivity test"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        
        logger.info("Health check passed")
        return ResponseModel(
            success=True,
            message="Service is healthy",
            data={"status": "healthy", "database": "connected"}
        )
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return ResponseModel(
            success=False,
            message="Service is unhealthy",
            data={"status": "unhealthy", "database": "disconnected"}
        )

@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe endpoint"""
    return {"status": "ready"}

@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return {"status": "alive"}
