from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from beanie import PydanticObjectId
from app.models.enums import UserRole

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str
    full_name: str
    team_name: Optional[str] = None

class UserUpdate(BaseModel):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None

class UserInDBBase(UserBase):
    id: PydanticObjectId = Field(alias="_id")
    team_id: Optional[PydanticObjectId] = None
    role: str = UserRole.USER

    class Config:
        from_attributes = True
        populate_by_name = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    password_hash: str
