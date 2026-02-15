from typing import Optional
from datetime import datetime
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class Match(Document):
    user_id: PydanticObjectId
    resume_id: PydanticObjectId
    job_id: PydanticObjectId
    match_score: float
    reasoning: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "matches"
        indexes = [
            "user_id",
            "job_id",
            "resume_id"
        ]
