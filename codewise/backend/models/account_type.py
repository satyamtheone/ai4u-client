from sqlalchemy import Column, Boolean, DateTime, ForeignKey, Enum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from core.database import Base

class AccountTypeEnum(enum.Enum):
    INDIVIDUAL = "individual"
    ORGANIZATION_MEMBER = "organization_member"
    ORGANIZATION_ADMIN = "organization_admin"

class AccountType(Base):
    __tablename__ = "account_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    account_type = Column(
        Enum(AccountTypeEnum, name="accounttypeenum"), 
        nullable=False
    )
    is_primary = Column(Boolean, default=True, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="account_types")
    organization = relationship("Organization", back_populates="account_types")

    __table_args__ = (
        CheckConstraint(
            "(account_type = 'individual' AND organization_id IS NULL) OR "
            "(account_type = 'organization_member' AND organization_id IS NOT NULL)",
            name="account_type_logic"
        ),
    )

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")
    organization = relationship("Organization", back_populates="user_roles")
