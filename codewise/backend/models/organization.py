from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from core.database import Base

class SubscriptionPlanEnum(enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"

class SubscriptionStatusEnum(enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"
    TRIAL = "trial"
    PAST_DUE = "past_due"

class CompanySizeEnum(enum.Enum):
    STARTUP = "startup"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    website = Column(String(255))
    logo_url = Column(Text)
    industry = Column(String(100))
    company_size = Column(Enum(CompanySizeEnum), default=CompanySizeEnum.STARTUP)
    subscription_plan = Column(Enum(SubscriptionPlanEnum), default=SubscriptionPlanEnum.FREE, nullable=False)
    subscription_status = Column(Enum(SubscriptionStatusEnum), default=SubscriptionStatusEnum.ACTIVE, nullable=False)
    max_users = Column(Integer, default=10, nullable=False)
    current_user_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    account_types = relationship("AccountType", back_populates="organization")
    user_roles = relationship("UserRole", back_populates="organization")
    oauth_providers = relationship("OAuthProvider", back_populates="organization")
    quiz_questions = relationship("QuizQuestion", back_populates="organization")
    user_progress = relationship("UserProgress", back_populates="organization")
    quiz_submissions = relationship("QuizSubmission", back_populates="organization")
    chat_sessions = relationship("ChatSession", back_populates="organization")

    def __repr__(self):
        return f"<Organization(id={self.id}, name={self.name})>"
