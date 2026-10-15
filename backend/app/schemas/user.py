from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    currency: str = "PKR"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_superuser: bool = False
    role: str = "staff"
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class StaffCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "staff"  # "staff", "accountant", "super_admin"
    currency: str = "PKR"

class StaffUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    currency: Optional[str] = None

class StaffDetailResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "staff"
    is_superuser: bool = False
    is_active: bool = True
    currency: str = "PKR"
    password_display: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
