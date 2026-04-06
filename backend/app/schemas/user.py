from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from beanie import PydanticObjectId
from app.models.enums import UserRole

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    full_name: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None

class UserInDBBase(UserBase):
    id: PydanticObjectId = Field(alias="_id")
    role: str = UserRole.USER

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    password_hash: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
