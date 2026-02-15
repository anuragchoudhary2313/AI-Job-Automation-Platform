from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field

class Team(Document):
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "teams"
