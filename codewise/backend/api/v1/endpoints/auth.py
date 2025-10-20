from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.auth import Token, GoogleAuthRequest
from schemas.user import UserCreate, UserLogin, UserResponse
from schemas.common import ResponseModel
from services.auth_service import AuthService
from services.user_service import UserService
from services.oauth_service import OAuthService
from utils.request_utils import get_client_ip, get_user_agent
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=ResponseModel[UserResponse])
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user with email and password"""
    try:
        user_service = UserService(db)

        # Check if organization registration (user has organization_data)
        if user_data.organization_data:
            from services.organization_service import OrganizationService
            from schemas.organization import OrganizationCreate
            import re

            # Create user without AccountType (will be created by OrganizationService)
            user = user_service.create_user(
                user_data,
                account_type="individual",
                skip_account_type_creation=True
            )
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists"
                )

            # Generate slug from organization name
            slug = re.sub(r'[^a-z0-9-]', '-', user_data.organization_data.name.lower())
            slug = re.sub(r'-+', '-', slug).strip('-')

            # Create organization
            org_service = OrganizationService(db)
            org_create = OrganizationCreate(
                name=user_data.organization_data.name,
                slug=slug,
                description=user_data.organization_data.description,
                industry=user_data.organization_data.industry,
                website=user_data.organization_data.website
            )

            organization = org_service.create_organization(org_create, user.id)
            if not organization:
                # Rollback user creation if organization creation fails
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create organization. Slug may already exist."
                )

            logger.info("Organization and admin user created", user_id=str(user.id), org_id=str(organization.id))
        else:
            # Individual user registration
            user = user_service.create_user(user_data)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists"
                )

            logger.info("Individual user registered successfully", user_id=str(user.id))

        return ResponseModel(
            success=True,
            message="User registered successfully",
            data=UserResponse.from_orm(user)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Registration failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=ResponseModel[Token])
async def login(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    try:
        auth_service = AuthService(db)
        
        result = await auth_service.authenticate_user(
            email=credentials.email,
            password=credentials.password,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        logger.info("User logged in successfully", user_id=str(result["user"].id))
        
        return ResponseModel(
            success=True,
            message="Login successful",
            data=Token(**result["tokens"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.get("/google")
async def google_auth_url(
    redirect_uri: str = None,
    db: Session = Depends(get_db)
):
    """Get Google OAuth authorization URL"""
    try:
        oauth_service = OAuthService(db)
        auth_url = await oauth_service.get_google_auth_url()
        
        return ResponseModel(
            success=True,
            message="Google auth URL generated",
            data={"auth_url": auth_url}
        )
        
    except Exception as e:
        logger.error("Failed to generate Google auth URL", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authentication URL"
        )

@router.post("/google/callback")
async def google_callback(
    request_data: GoogleAuthRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback"""
    try:
        oauth_service = OAuthService(db)
        
        result = await oauth_service.process_google_callback(
            code=request_data.code,
            ip_address=get_client_ip(request)
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google authentication failed"
            )
        
        # Note: In a real implementation, you would create a session here
        # For now, this is a placeholder response
        
        logger.info("Google authentication successful", user_id=str(result["user"].id))
        
        return ResponseModel(
            success=True,
            message="Google authentication successful",
            data={"user": UserResponse.from_orm(result["user"])}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Google callback failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )
