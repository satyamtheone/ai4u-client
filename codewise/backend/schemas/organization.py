from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import uuid

class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = Field(None, max_length=100)

class OrganizationCreate(OrganizationBase):
    slug: str = Field(..., min_length=1, max_length=100)
    company_size: Optional[str] = None

    @validator('slug')
    def validate_slug(cls, v):
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug must contain only alphanumeric characters, hyphens, and underscores')
        return v.lower()

class OrganizationResponse(OrganizationBase):
    id: uuid.UUID
    slug: str
    logo_url: Optional[str]
    company_size: str
    subscription_plan: str
    subscription_status: str
    max_users: int
    current_user_count: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
