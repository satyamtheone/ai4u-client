from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import httpx
import structlog
import uuid

from models.user import User
from models.oauth import OAuthProvider, UserSocialAccount
from models.account_type import AccountType
from core.config import settings
from services.user_service import UserService
from services.activity_service import ActivityService

logger = structlog.get_logger(__name__)

class OAuthService:
    """Service for OAuth authentication operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)
        self.activity_service = ActivityService(db)
    
    async def get_google_auth_url(self, state: Optional[str] = None) -> str:
        """Generate Google OAuth authorization URL"""
        try:
            provider = self._get_google_provider()
            if not provider:
                raise ValueError("Google OAuth provider not configured")
            
            params = {
                "client_id": provider.client_id,
                "response_type": "code",
                "scope": provider.scope,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "access_type": "offline",
                "prompt": "consent"
            }
            
            if state:
                params["state"] = state
            
            query_string = "&".join([f"{k}={v}" for k, v in params.items()])
            auth_url = f"{provider.authorization_url}?{query_string}"
            
            logger.info("Generated Google auth URL")
            return auth_url
            
        except Exception as e:
            logger.error("Failed to generate Google auth URL", error=str(e))
            raise
    
    async def process_google_callback(
        self, 
        code: str,
        ip_address: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Process Google OAuth callback"""
        try:
            # Exchange code for token
            token_data = await self._exchange_google_code(code)
            if not token_data:
                return None
            
            # Get user info from Google
            user_info = await self._get_google_user_info(token_data["access_token"])
            if not user_info:
                return None
            
            # Find or create user
            user = await self._find_or_create_google_user(user_info, ip_address)
            if not user:
                return None
            
            return {"user": user, "provider_data": user_info}
            
        except Exception as e:
            logger.error("Google callback processing failed", error=str(e))
            return None
    
    async def _exchange_google_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token"""
        try:
            provider = self._get_google_provider()
            if not provider:
                return None
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    provider.token_url,
                    data={
                        "client_id": provider.client_id,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": settings.GOOGLE_REDIRECT_URI
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error("Token exchange failed", status=response.status_code)
                    return None
                    
        except Exception as e:
            logger.error("Failed to exchange Google code", error=str(e))
            return None
    
    async def _get_google_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from Google"""
        try:
            provider = self._get_google_provider()
            if not provider:
                return None
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    provider.user_info_url,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error("User info fetch failed", status=response.status_code)
                    return None
                    
        except Exception as e:
            logger.error("Failed to get Google user info", error=str(e))
            return None
    
    def _get_google_provider(self) -> Optional[OAuthProvider]:
        """Get Google OAuth provider configuration"""
        return self.db.query(OAuthProvider).filter(
            OAuthProvider.name == "google",
            OAuthProvider.is_active == True
        ).first()