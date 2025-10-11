from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
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

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    timezone: Optional[str] = Field(None, max_length=50)
    locale: Optional[str] = Field(None, max_length=10)

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