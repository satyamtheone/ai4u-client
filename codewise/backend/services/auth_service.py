from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import structlog
import json
from models.user import User
from models.session import UserSession
from schemas.auth import Token
from core.security import SecurityService
from core.redis_client import RedisClient
from services.activity_service import ActivityService

logger = structlog.get_logger(__name__)

class AuthService:
    """Service for authentication operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.activity_service = ActivityService(db)
    
    async def authenticate_user(
        self, 
        email: str, 
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password"""
        try:
            # Get user
            user = self.db.query(User).filter(
                User.email == email.lower(),
                User.is_active == True,
                User.is_deleted == False
            ).first()
            
            if not user or not SecurityService.verify_password(password, user.password_hash):
                logger.warning("Authentication failed", email=email, ip=ip_address)
                return None
            
            # Create session
            session_data = await self._create_user_session(
                user.id, ip_address, user_agent
            )
            
            # Update user login info
            user.last_login_at = datetime.utcnow()
            user.login_count += 1
            self.db.commit()
            
            # Log activity
            self.activity_service.log_activity(
                user_id=user.id,
                action="user_login",
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            logger.info("User authenticated", user_id=str(user.id), email=email)
            
            return {
                "user": user,
                "tokens": session_data["tokens"]
            }
            
        except Exception as e:
            logger.error("Authentication error", email=email, error=str(e))
            return None
    
    async def _create_user_session(
        self,
        user_id: uuid.UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create user session and tokens"""
        try:
            # Generate tokens
            access_token = SecurityService.create_access_token(subject=str(user_id))
            refresh_token = SecurityService.create_refresh_token(subject=str(user_id))
            
            # Create session record
            session = UserSession(
                user_id=user_id,
                session_token=access_token,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=datetime.utcnow() + timedelta(minutes=30),
                device_type=self._detect_device_type(user_agent)
            )
            
            self.db.add(session)
            self.db.commit()
            
            # Cache session in Redis
            await RedisClient().set(
                f"session:{access_token}",
                json.dumps({
                    "user_id": str(user_id),
                    "session_id": str(session.id)
                }),
                expire=1800  # expire in 30 minutes
            )
            
            return {
                "session": session,
                "tokens": {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "expires_in": 1800
                }
            }
            
        except Exception as e:
            logger.error("Failed to create session", user_id=str(user_id), error=str(e))
            raise
    
    def _detect_device_type(self, user_agent: Optional[str]) -> str:
        """Detect device type from user agent"""
        if not user_agent:
            return "unknown"
        
        user_agent = user_agent.lower()
        if "mobile" in user_agent or "android" in user_agent or "iphone" in user_agent:
            return "mobile"
        elif "tablet" in user_agent or "ipad" in user_agent:
            return "tablet"
        else:
            return "web"
