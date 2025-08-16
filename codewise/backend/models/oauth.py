from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID, BYTEA
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from core.database import Base

class OAuthProviderEnum(enum.Enum):
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    GITHUB = "github"
    LINKEDIN = "linkedin"
    OKTA = "okta"
    AUTH0 = "auth0"
    CUSTOM = "custom"

class OAuthProvider(Base):
    __tablename__ = "oauth_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Enum(OAuthProviderEnum), nullable=False)
    display_name = Column(String(100), nullable=False)
    client_id = Column(String(255), nullable=False)
    client_secret_encrypted = Column(BYTEA, nullable=False)
    authorization_url = Column(Text, nullable=False)
    token_url = Column(Text, nullable=False)
    user_info_url = Column(Text, nullable=False)
    scope = Column(String(500), default="openid email profile")
    is_active = Column(Boolean, default=True, nullable=False)
    logo_url = Column(Text)
    button_color = Column(String(7), default="#4285f4")
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="oauth_providers")
    user_social_accounts = relationship("UserSocialAccount", back_populates="provider")

class UserSocialAccount(Base):
    __tablename__ = "user_social_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("oauth_providers.id", ondelete="CASCADE"), nullable=False)
    provider_user_id = Column(String(255), nullable=False)
    provider_email = Column(String(255))
    provider_name = Column(String(255))
    provider_avatar_url = Column(Text)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="social_accounts")
    provider = relationship("OAuthProvider", back_populates="user_social_accounts")
