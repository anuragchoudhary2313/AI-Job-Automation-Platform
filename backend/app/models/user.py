from typing import Optional
from datetime import datetime
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field, EmailStr
from app.models.enums import UserRole
from app.models.team import Team

class User(Document):
    username: Indexed(str, unique=True)
    email: Indexed(EmailStr, unique=True)
    password_hash: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER
    is_active: bool = True
    team_id: Optional[PydanticObjectId] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "users"
