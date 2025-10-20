from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import uuid
import structlog

from models.activity_log import ActivityLog

logger = structlog.get_logger(__name__)

class ActivityService:
    """Service for logging user activities"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_activity(
        self,
        action: str,
        user_id: Optional[uuid.UUID] = None,
        organization_id: Optional[uuid.UUID] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[uuid.UUID] = None,
        activity_metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[ActivityLog]:
        """Log an activity"""
        try:
            activity = ActivityLog(
                user_id=user_id,
                organization_id=organization_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                activity_metadata=activity_metadata,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            self.db.add(activity)
            self.db.commit()
            
            logger.debug("Activity logged", action=action, user_id=str(user_id) if user_id else None)
            return activity
            
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to log activity", action=action, error=str(e))
            return None