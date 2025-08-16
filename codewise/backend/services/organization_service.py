from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import structlog

from models.organization import Organization
from models.account_type import AccountType, UserRole
from schemas.organization import OrganizationCreate
from services.activity_service import ActivityService

logger = structlog.get_logger(__name__)

class OrganizationService:
    """Service for organization management operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.activity_service = ActivityService(db)
    
    def create_organization(
        self, 
        org_data: OrganizationCreate,
        creator_id: uuid.UUID
    ) -> Optional[Organization]:
        """Create a new organization"""
        try:
            # Check if slug already exists
            existing_org = self.db.query(Organization).filter(
                Organization.slug == org_data.slug,
                Organization.is_active == True,
                Organization.is_deleted == False
            ).first()
            
            if existing_org:
                logger.warning("Organization slug already exists", slug=org_data.slug)
                return None
            
            # Create organization
            organization = Organization(
                name=org_data.name,
                slug=org_data.slug,
                description=org_data.description,
                website=org_data.website,
                industry=org_data.industry,
                created_by=creator_id
            )
            
            self.db.add(organization)
            self.db.flush()
            
            # Add creator as organization member and admin
            self._add_user_to_organization(creator_id, organization.id, "org_admin")
            
            self.db.commit()
            
            # Log activity
            self.activity_service.log_activity(
                user_id=creator_id,
                action="org_created",
                resource_type="organization",
                resource_id=organization.id,
                organization_id=organization.id
            )
            
            logger.info("Organization created", org_id=str(organization.id), slug=org_data.slug)
            return organization
            
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to create organization", error=str(e))
            return None
    
    def _add_user_to_organization(
        self, 
        user_id: uuid.UUID, 
        organization_id: uuid.UUID,
        role_slug: str = "org_user"
    ):
        """Add user to organization with specified role"""
        try:
            from models.role import Role
            
            # Create account type
            account = AccountType(
                user_id=user_id,
                organization_id=organization_id,
                account_type="organization_member"
            )
            self.db.add(account)
            
            # Assign role
            role = self.db.query(Role).filter(Role.slug == role_slug).first()
            if role:
                user_role = UserRole(
                    user_id=user_id,
                    role_id=role.id,
                    organization_id=organization_id
                )
                self.db.add(user_role)
                
        except Exception as e:
            logger.error("Failed to add user to organization", 
                        user_id=str(user_id), org_id=str(organization_id), error=str(e))
