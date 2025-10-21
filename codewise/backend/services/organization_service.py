from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import structlog

from models.organization import Organization
from models.account_type import AccountType, AccountTypeEnum, UserRole
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
        role_slug: str = "org_member"
    ):
        """Add user to organization with specified role"""
        try:
            from core.role_init import get_role_by_slug, init_system_roles

            # Ensure system roles exist
            init_system_roles(self.db)

            # Create account type using the enum member (not string)
            account = AccountType(
                user_id=user_id,
                organization_id=organization_id,
                account_type=AccountTypeEnum.ORGANIZATION_MEMBER,
                is_primary=True
            )
            self.db.add(account)

            # Get role using the role initialization system
            try:
                role = get_role_by_slug(self.db, role_slug, organization_id)
                user_role = UserRole(
                    user_id=user_id,
                    role_id=role.id,
                    organization_id=organization_id,
                    is_active=True
                )
                self.db.add(user_role)
                logger.info("Assigned organization role",
                           user_id=str(user_id),
                           role=role_slug,
                           organization_id=str(organization_id))
            except ValueError as e:
                logger.error(f"Role not found: {str(e)}",
                           role_slug=role_slug,
                           user_id=str(user_id))
                raise

        except Exception as e:
            logger.error("Failed to add user to organization",
                        user_id=str(user_id), org_id=str(organization_id), error=str(e))
            raise
