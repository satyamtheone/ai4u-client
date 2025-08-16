from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.organization import OrganizationCreate, OrganizationResponse
from app.schemas.common import ResponseModel
from app.services.organization_service import OrganizationService
from app.api.dependencies import get_current_user
from app.models.user import User
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.post("/", response_model=ResponseModel[OrganizationResponse])
async def create_organization(
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new organization"""
    try:
        org_service = OrganizationService(db)
        
        organization = org_service.create_organization(org_data, current_user.id)
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization with this slug already exists"
            )
        
        logger.info("Organization created", org_id=str(organization.id), creator_id=str(current_user.id))
        
        return ResponseModel(
            success=True,
            message="Organization created successfully",
            data=OrganizationResponse.from_orm(organization)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create organization", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create organization"
        )

@router.get("/my", response_model=ResponseModel[List[OrganizationResponse]])
async def get_my_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's organizations"""
    try:
        from app.models.organization import Organization
        from app.models.account_type import AccountType
        
        organizations = db.query(Organization).join(AccountType).filter(
            AccountType.user_id == current_user.id,
            AccountType.account_type == "organization_member",
            Organization.is_active == True,
            Organization.is_deleted == False
        ).all()
        
        return ResponseModel(
            success=True,
            message="Organizations retrieved successfully",
            data=[OrganizationResponse.from_orm(org) for org in organizations]
        )
        
    except Exception as e:
        logger.error("Failed to get user organizations", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve organizations"
        )