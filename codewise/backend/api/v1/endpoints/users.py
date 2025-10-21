from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from core.database import get_db
from schemas.user import UserResponse, UserUpdate, OrganizationMemberCreate
from schemas.common import ResponseModel, PaginatedResponse, PaginationParams
from api.dependencies import get_current_user
from models.user import User
from models.account_type import AccountType, AccountTypeEnum, UserRole
from models.role import Role
from services.auth_service import AuthService
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

@router.post("/members", response_model=ResponseModel[UserResponse])
async def add_organization_member(
    member_data: OrganizationMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new member to the organization (Org Admin only)

    Only organization admins can add members to their organization.
    The new member will be created with organization_member account type.
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

        # Verify user is an organization member
        if account_type.account_type != AccountTypeEnum.ORGANIZATION_MEMBER:
            logger.warning("Non-org user tried to add member",
                          user_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organization members can add members"
            )

        organization_id = account_type.organization_id

        # Verify user has org_admin role
        user_role = db.query(UserRole).join(Role).filter(
            UserRole.user_id == current_user.id,
            UserRole.organization_id == organization_id,
            UserRole.is_active == True,
            Role.slug == "org_admin"
        ).first()

        if not user_role:
            logger.warning("Non-admin tried to add member",
                          user_id=str(current_user.id),
                          organization_id=str(organization_id))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organization admins can add members"
            )

        # Check if email already exists
        existing_user = db.query(User).filter(User.email == member_data.email.lower()).first()
        if existing_user:
            logger.warning("Attempted to add existing email",
                          email=member_data.email,
                          admin_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {member_data.email} already exists"
            )

        # Create new user
        auth_service = AuthService(db)
        hashed_password = auth_service.hash_password(member_data.password)

        new_user = User(
            first_name=member_data.first_name,
            last_name=member_data.last_name,
            full_name=f"{member_data.first_name} {member_data.last_name}",
            email=member_data.email.lower(),
            hashed_password=hashed_password,
            phone=member_data.phone,
            auth_method="email",
            timezone=member_data.timezone,
            locale=member_data.locale,
            is_active=True,
            is_email_verified=False,
            accept_terms=True,
            subscribe_newsletter=False
        )

        db.add(new_user)
        db.flush()  # Get the user ID

        # Create AccountType as organization_member
        account = AccountType(
            user_id=new_user.id,
            account_type=AccountTypeEnum.ORGANIZATION_MEMBER,
            organization_id=organization_id,
            is_primary=True
        )
        db.add(account)

        # Assign role (org_admin or org_member)
        from core.role_init import get_role_by_slug, init_system_roles

        # Ensure roles exist
        init_system_roles(db, auto_commit=False)

        role_slug = member_data.role if member_data.role in ["org_admin", "org_member"] else "org_member"

        try:
            role = get_role_by_slug(db, role_slug, organization_id)
            user_role_entry = UserRole(
                user_id=new_user.id,
                role_id=role.id,
                organization_id=organization_id,
                is_active=True
            )
            db.add(user_role_entry)
        except ValueError as e:
            logger.error(f"Role not found: {str(e)}", role_slug=role_slug)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"System role '{role_slug}' not found. Please contact administrator."
            )

        db.commit()
        db.refresh(new_user)

        logger.info("Organization member added",
                   admin_id=str(current_user.id),
                   new_user_id=str(new_user.id),
                   organization_id=str(organization_id),
                   role=role_slug)

        # TODO: Send invitation email if requested
        if member_data.send_invitation_email:
            logger.info("Invitation email should be sent",
                       email=member_data.email,
                       organization_id=str(organization_id))
            # Implement email sending logic here

        return ResponseModel(
            success=True,
            message=f"Member added successfully to organization",
            data=UserResponse.from_orm(new_user)
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error("Failed to add organization member",
                    admin_id=str(current_user.id),
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add organization member"
        )
