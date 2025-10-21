from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import uuid

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    auth_method: Optional[str] = Field("EMAIL")
    account_type: Optional[str] = Field("INDIVIDUAL")
    accept_terms: bool = True
    subscribe_newsletter: bool = False
    timezone: Optional[str] = Field(None, max_length=50)
    locale: Optional[str] = Field(None, max_length=10)

class OrganizationData(BaseModel):
    """Embedded organization data for registration"""
    name: str = Field(..., alias="organizationName", min_length=1, max_length=255)
    description: Optional[str] = None
    industry: str = Field(..., min_length=1, max_length=100)
    company_size: Optional[str] = Field(None, alias="size")
    website: Optional[str] = None

    class Config:
        populate_by_name = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    organization_data: Optional[OrganizationData] = Field(None, alias="organizationData")
    user_type: Optional[str] = Field(None, alias="userType")

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

    @validator('account_type', pre=True, always=True)
    def normalize_account_type(cls, v, values):
        """Normalize account_type to match AccountTypeEnum (lowercase)

        Note: For organization registration, we return 'individual' here.
        The user will be converted to 'organization_member' after the organization is created.
        This is necessary because the database constraint requires organization_id to be set
        when account_type = 'organization_member'.
        """
        # Use userType if account_type not provided
        if not v and 'user_type' in values:
            v = values['user_type']

        # If organization_data is present, always return 'individual'
        # (will be converted to organization_member after org creation)
        if 'organization_data' in values and values['organization_data']:
            return "individual"

        if not v:
            return "individual"

        # Convert to lowercase for comparison
        v_lower = str(v).lower()

        # Direct matches (AccountTypeEnum uses lowercase values)
        if v_lower in ["individual", "organization_member"]:
            return v_lower

        # Map legacy/alternative frontend values
        # For backward compatibility, but these should return 'individual' if org_data present
        mapping = {
            "organization_admin": "individual",  # Will be converted later
            "organization_user": "individual",   # Will be converted later
            "org_admin": "individual",
            "org_user": "individual",
        }

        return mapping.get(v_lower, "individual")

    class Config:
        populate_by_name = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    timezone: Optional[str] = Field(None, max_length=50)
    locale: Optional[str] = Field(None, max_length=10)

class OrganizationMemberCreate(BaseModel):
    """Schema for org admin to add members to their organization"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)
    role: Optional[str] = Field("org_member", description="Role: org_member or org_admin")
    send_invitation_email: bool = Field(True, description="Send invitation email to member")
    timezone: Optional[str] = Field("UTC", max_length=50)
    locale: Optional[str] = Field("en", max_length=10)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ["org_member", "org_admin"]
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v

class UserResponse(UserBase):
    id: uuid.UUID
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    is_email_verified: bool
    auth_method: str
    timezone: str
    locale: str
    login_count: int
    last_login_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True