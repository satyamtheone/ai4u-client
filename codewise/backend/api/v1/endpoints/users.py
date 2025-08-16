from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from core.database import get_db
from schemas.user import UserResponse, UserUpdate
from schemas.common import ResponseModel, PaginatedResponse, PaginationParams
from services.user_service import UserService
from api.dependencies import get_current_user
from models.user import User
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
    """List users (with proper permissions)"""
    try:
        user_service = UserService(db)
        
        # Basic implementation - in production, add proper permission checks
        query = db.query(User).filter(
            User.is_active == True,
            User.is_deleted == False
        )
        
        if search:
            search_filter = f"%{search.lower()}%"
            query = query.filter(
                User.full_name.ilike(search_filter) |
                User.email.ilike(search_filter)
            )
        
        total = query.count()
        users = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size).all()
        
        return ResponseModel(
            success=True,
            message="Users retrieved successfully",
            data=PaginatedResponse(
                items=[UserResponse.from_orm(user) for user in users],
                total=total,
                page=pagination.page,
                page_size=pagination.page_size,
                total_pages=(total + pagination.page_size - 1) // pagination.page_size
            )
        )
        
    except Exception as e:
        logger.error("Failed to list users", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )
