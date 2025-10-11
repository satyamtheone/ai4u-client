from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from core.database import Base

class AuthMethodEnum(enum.Enum):
    EMAIL = "email"
    SSO = "sso"
    HYBRID = "hybrid"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    email_hash = Column(String(64))  # Generated column, handled by PostgreSQL
    password_hash = Column(String(255))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    full_name = Column(String(201))  # Generated column, handled by PostgreSQL
    phone = Column(String(20))
    avatar_url = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    email_verification_token = Column(String(255))
    password_reset_token = Column(String(255))
    password_reset_expires_at = Column(DateTime(timezone=True))
    last_login_at = Column(DateTime(timezone=True))
    login_count = Column(Integer, default=0, nullable=False)
    auth_method = Column(Enum(AuthMethodEnum), default=AuthMethodEnum.EMAIL, nullable=False)
    timezone = Column(String(50), default="UTC")
    locale = Column(String(10), default="en")
    accept_terms = Column(Boolean, default=False, nullable=False)
    subscribe_newsletter = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    account_types = relationship("AccountType", back_populates="user")
    user_roles = relationship("UserRole", back_populates="user")
    social_accounts = relationship("UserSocialAccount", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    quiz_submissions = relationship("QuizSubmission", back_populates="user")
    user_progress = relationship("UserProgress", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    created_questions = relationship("QuizQuestion", foreign_keys="QuizQuestion.created_by")
    created_organizations = relationship("Organization", foreign_keys="Organization.created_by")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
