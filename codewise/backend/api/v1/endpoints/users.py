from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import uuid

from core.database import get_db
from schemas.user import UserResponse, UserUpdate
from schemas.common import ResponseModel, PaginatedResponse, PaginationParams
from api.dependencies import get_current_user
from models.user import User
from models.account_type import AccountType, AccountTypeEnum, UserRole
from models.role import Role
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.get("/me", response_model=ResponseModel[UserResponse])
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    try:
        return ResponseModel(
            success=True,
            message="User profile retrieved successfully",
            data=UserResponse.from_orm(current_user)
        )
    except Exception as e:
        logger.error("Failed to get user profile", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile"
        )

@router.put("/me", response_model=ResponseModel[UserResponse])
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    try:
        # Update user fields
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        
        logger.info("User profile updated", user_id=str(current_user.id))
        
        return ResponseModel(
            success=True,
            message="Profile updated successfully",
            data=UserResponse.from_orm(current_user)
        )
        
    except Exception as e:
        db.rollback()
        logger.error("Failed to update user profile", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

@router.get("/", response_model=ResponseModel[PaginatedResponse[UserResponse]])
async def list_users(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search by name or email"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List users with role-based access control:
    - Org Admins: Can see all users in their organization
    - Individual Users: Can only see their own profile
    """
    try:
        # Get current user's account type and organization
        account_type = db.query(AccountType).filter(
            AccountType.user_id == current_user.id,
            AccountType.is_primary == True
        ).first()

        if not account_type:
            logger.error("User has no account type", user_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account type not found"
            )

        # Check if user is an organization admin
        is_org_admin = False
        organization_id = None

        if account_type.account_type == AccountTypeEnum.ORGANIZATION_MEMBER:
            organization_id = account_type.organization_id

            # Check if user has org_admin role
            user_role = db.query(UserRole).join(Role).filter(
                UserRole.user_id == current_user.id,
                UserRole.organization_id == organization_id,
                UserRole.is_active == True,
                Role.slug == "org_admin"
            ).first()

            is_org_admin = user_role is not None

        # Build query based on permissions
        query = db.query(User).filter(
            User.is_active == True,
            User.is_deleted == False
        )

        if is_org_admin and organization_id:
            # Org admin: Show all users in the same organization
            query = query.join(AccountType).filter(
                AccountType.organization_id == organization_id,
                AccountType.account_type == AccountTypeEnum.ORGANIZATION_MEMBER
            )
            logger.info("Org admin listing users",
                       admin_id=str(current_user.id),
                       organization_id=str(organization_id))
        else:
            # Individual user: Show only their own profile
            query = query.filter(User.id == current_user.id)
            logger.info("Individual user accessing own profile",
                       user_id=str(current_user.id))

        # Apply search filter if provided
        if search:
            search_filter = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_filter),
                    User.email.ilike(search_filter)
                )
            )

        # Get total count
        total = query.count()

        # Apply pagination
        users = query.offset(
            (pagination.page - 1) * pagination.page_size
        ).limit(pagination.page_size).all()

        # Calculate total pages
        total_pages = (total + pagination.page_size - 1) // pagination.page_size

        return ResponseModel(
            success=True,
            message=f"Users retrieved successfully ({'organization' if is_org_admin else 'self'})",
            data=PaginatedResponse(
                items=[UserResponse.from_orm(user) for user in users],
                total=total,
                page=pagination.page,
                page_size=pagination.page_size,
                total_pages=total_pages
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list users",
                    user_id=str(current_user.id),
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )
