from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
import uuid
import structlog

from models.user import User
from models.account_type import AccountType, UserRole
from schemas.user import UserCreate, UserUpdate
from core.security import SecurityService
from services.activity_service import ActivityService

logger = structlog.get_logger(__name__)

class UserService:
    """Service for user management operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.activity_service = ActivityService(db)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address"""
        try:
            return self.db.query(User).filter(
                and_(
                    User.email == email.lower(),
                    User.is_active == True,
                    User.is_deleted == False
                )
            ).first()
        except Exception as e:
            logger.error("Failed to get user by email", email=email, error=str(e))
            return None
    
    def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Get user by ID"""
        try:
            return self.db.query(User).filter(
                and_(
                    User.id == user_id,
                    User.is_active == True,
                    User.is_deleted == False
                )
            ).first()
        except Exception as e:
            logger.error("Failed to get user by ID", user_id=str(user_id), error=str(e))
            return None
    
    def create_user(
        self,
        user_data: UserCreate,
        account_type: Optional[str] = None,
        skip_account_type_creation: bool = False
    ) -> Optional[User]:
        """Create a new user

        Args:
            user_data: User creation data
            account_type: Optional account type override
            skip_account_type_creation: If True, don't create AccountType record
                                       (useful for org admin where it will be created later)
        """
        # Use account_type from user_data if not explicitly provided
        if account_type is None:
            account_type = user_data.account_type or "individual"

        # Normalize to lowercase (AccountTypeEnum uses lowercase)
        account_type = account_type.lower()
        try:
            # Check if user already exists
            existing_user = self.get_by_email(user_data.email)
            if existing_user:
                logger.warning("User already exists", email=user_data.email)
                return None
            
            # Create user
            hashed_password = SecurityService.get_password_hash(user_data.password)
            user = User(
                email=user_data.email.lower(),
                password_hash=hashed_password,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                phone=user_data.phone,
                auth_method=user_data.auth_method
            )
            
            # Set optional fields
            if user_data.timezone:
                user.timezone = user_data.timezone
            if user_data.locale:
                user.locale = user_data.locale
            if user_data.accept_terms:
                user.accept_terms = user_data.accept_terms
            if user_data.subscribe_newsletter:
                user.subscribe_newsletter = user_data.subscribe_newsletter

            self.db.add(user)
            self.db.flush()

            # Create account type only if not skipped
            # (For org admin, this will be created by OrganizationService)
            if not skip_account_type_creation:
                # Create account type (must match AccountTypeEnum values: "individual" or "organization_member")
                account = AccountType(
                    user_id=user.id,
                    account_type=account_type,
                    organization_id=None  # Will be set later for organization members
                )
                self.db.add(account)

                # Assign default role
                self._assign_default_role(user.id, account_type)
            
            self.db.commit()
            
            # Log activity
            self.activity_service.log_activity(
                user_id=user.id,
                action="user_created",
                resource_type="user",
                resource_id=user.id
            )
            
            logger.info("User created successfully", user_id=str(user.id), email=user.email)
            return user
            
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to create user", error=str(e))
            return None
    
    def _assign_default_role(self, user_id: uuid.UUID, account_type: str):
        """Assign default role to user based on account type"""
        try:
            from models.role import Role

            # Map account type to role slug
            # AccountTypeEnum: "individual" or "organization_member"
            role_slug = "individual_user" if account_type == "individual" else "org_user"
            role = self.db.query(Role).filter(Role.slug == role_slug).first()

            if role:
                user_role = UserRole(
                    user_id=user_id,
                    role_id=role.id,
                    organization_id=None
                )
                self.db.add(user_role)
            else:
                logger.warning("Role not found", role_slug=role_slug, user_id=str(user_id), account_type=account_type)

        except Exception as e:
            logger.error("Failed to assign default role", user_id=str(user_id), error=str(e))
