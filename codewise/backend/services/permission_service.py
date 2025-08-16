from sqlalchemy.orm import Session
from typing import List, Set
import uuid
import structlog

from app.models.user import User
from app.models.role import Role, Permission, RolePermission
from app.models.account_type import UserRole

logger = structlog.get_logger(__name__)

class PermissionService:
    """Service for managing user permissions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_permissions(
        self, 
        user_id: uuid.UUID,
        organization_id: Optional[uuid.UUID] = None
    ) -> Set[str]:
        """Get all permissions for a user"""
        try:
            query = self.db.query(Permission.slug).join(
                RolePermission, Permission.id == RolePermission.permission_id
            ).join(
                UserRole, RolePermission.role_id == UserRole.role_id
            ).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            )
            
            if organization_id:
                query = query.filter(
                    (UserRole.organization_id == organization_id) |
                    (UserRole.organization_id.is_(None))
                )
            
            permissions = query.all()
            return {perm.slug for perm in permissions}
            
        except Exception as e:
            logger.error("Failed to get user permissions", user_id=str(user_id), error=str(e))
            return set()
    
    def has_permission(
        self,
        user_id: uuid.UUID,
        permission_slug: str,
        organization_id: Optional[uuid.UUID] = None
    ) -> bool:
        """Check if user has a specific permission"""
        permissions = self.get_user_permissions(user_id, organization_id)
        return permission_slug in permissions
