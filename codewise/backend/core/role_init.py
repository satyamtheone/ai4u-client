"""
Role Initialization and Seeding

This module ensures all required system roles exist in the database.
Roles are created if they don't exist and are idempotent (safe to run multiple times).
"""

from sqlalchemy.orm import Session
from models.role import Role
from models.account_type import AccountType, AccountTypeEnum
import structlog

logger = structlog.get_logger(__name__)

# Define all system roles
SYSTEM_ROLES = [
    {
        "name": "Individual User",
        "slug": "individual_user",
        "description": "Default role for individual users who are not part of any organization",
        "is_system_role": True,
        "organization_id": None
    },
    {
        "name": "Organization Admin",
        "slug": "org_admin",
        "description": "Administrator of an organization with full management permissions",
        "is_system_role": True,
        "organization_id": None
    },
    {
        "name": "Organization Member",
        "slug": "org_member",
        "description": "Regular member of an organization with standard access",
        "is_system_role": True,
        "organization_id": None
    },
]


def init_system_roles(db: Session, auto_commit: bool = True) -> None:
    """
    Initialize all system roles in the database.

    This function is idempotent - it will not create duplicate roles.
    Safe to run on application startup.

    Args:
        db: Database session
        auto_commit: Whether to commit changes automatically (default True)
                     Set to False if calling within an existing transaction
    """
    try:
        created_count = 0
        updated_count = 0

        for role_data in SYSTEM_ROLES:
            # Check if role already exists
            existing_role = db.query(Role).filter(
                Role.slug == role_data["slug"],
                Role.is_system_role == True
            ).first()

            if existing_role:
                # Update description if changed
                if existing_role.description != role_data["description"]:
                    existing_role.description = role_data["description"]
                    existing_role.name = role_data["name"]
                    updated_count += 1
                    logger.info("Updated system role",
                               slug=role_data["slug"],
                               name=role_data["name"])
            else:
                # Create new role
                new_role = Role(
                    name=role_data["name"],
                    slug=role_data["slug"],
                    description=role_data["description"],
                    is_system_role=role_data["is_system_role"],
                    organization_id=role_data["organization_id"],
                    is_active=True
                )
                db.add(new_role)
                created_count += 1
                logger.info("Created system role",
                           slug=role_data["slug"],
                           name=role_data["name"])

        # Flush to make roles available in current transaction
        db.flush()

        if auto_commit:
            db.commit()

        logger.info("System roles initialized",
                   created=created_count,
                   updated=updated_count,
                   total=len(SYSTEM_ROLES))

    except Exception as e:
        if auto_commit:
            db.rollback()
        logger.error("Failed to initialize system roles", error=str(e))
        raise


def get_role_for_account_type(db: Session, account_type: AccountTypeEnum, organization_id=None) -> Role:
    """
    Get the appropriate role for a given account type.

    Args:
        db: Database session
        account_type: The account type enum
        organization_id: Optional organization ID (for org-specific roles)

    Returns:
        Role object

    Raises:
        ValueError: If role not found
    """
    # Map account types to role slugs
    role_mapping = {
        AccountTypeEnum.INDIVIDUAL: "individual_user",
        AccountTypeEnum.ORGANIZATION_MEMBER: "org_member"  # Default for new members
    }

    role_slug = role_mapping.get(account_type)

    if not role_slug:
        raise ValueError(f"No role mapping for account type: {account_type}")

    # Get the role from database
    role = db.query(Role).filter(
        Role.slug == role_slug,
        Role.is_system_role == True,
        Role.is_active == True
    ).first()

    if not role:
        # Try to initialize roles if not found
        logger.warning(f"Role {role_slug} not found, initializing system roles")
        init_system_roles(db)

        # Try again
        role = db.query(Role).filter(
            Role.slug == role_slug,
            Role.is_system_role == True,
            Role.is_active == True
        ).first()

        if not role:
            raise ValueError(f"Role {role_slug} not found even after initialization")

    return role


def get_role_by_slug(db: Session, slug: str, organization_id=None) -> Role:
    """
    Get a role by its slug.

    Args:
        db: Database session
        slug: Role slug (e.g., 'org_admin', 'individual_user')
        organization_id: Optional organization ID for org-specific roles

    Returns:
        Role object

    Raises:
        ValueError: If role not found
    """
    query = db.query(Role).filter(
        Role.slug == slug,
        Role.is_active == True
    )
    # For system roles, ensure it's a system role
    if slug in ["individual_user", "org_admin", "org_member"]:
        query = query.filter(Role.is_system_role == True)

    # For organization-specific roles NOTE: Need to uncomment for production
    # if organization_id:
    #     query = query.filter(Role.organization_id == organization_id)

    role = query.first()

    if not role:
        # Try to initialize roles if not found
        logger.warning(f"Role {slug} not found, initializing system roles")
        init_system_roles(db)

        # Try again
        role = query.first()

        if not role:
            raise ValueError(f"Role {slug} not found")

    return role


def ensure_roles_exist(db: Session) -> bool:
    """
    Verify that all required system roles exist.

    Args:
        db: Database session

    Returns:
        True if all roles exist, False otherwise
    """
    try:
        for role_data in SYSTEM_ROLES:
            role = db.query(Role).filter(
                Role.slug == role_data["slug"],
                Role.is_system_role == True
            ).first()

            if not role:
                logger.warning(f"Missing system role: {role_data['slug']}")
                return False

        return True

    except Exception as e:
        logger.error("Error checking system roles", error=str(e))
        return False
