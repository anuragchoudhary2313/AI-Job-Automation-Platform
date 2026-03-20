from typing import Optional
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class JobApplication(Document):
    """
    Tracks job applications and their evaluations over time.
    Provides memory records for the decision engine pattern matching.
    """
    company: str
    role: str
    decision: str
    score: float
    status: str
    reply_received: bool = False
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "job_applications"
        indexes = [
            IndexModel(
                [("company", ASCENDING), ("role", ASCENDING), ("user_id", ASCENDING)],
                unique=True,
                name="unique_user_application"
            )
        ]
