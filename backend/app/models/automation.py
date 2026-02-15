from typing import Optional, List
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field

class AutomationRun(Document):
    user_id: PydanticObjectId
    resume_id: PydanticObjectId
    applied_jobs: List[str] = [] # List of Job IDs
    status: str = "running" # running, completed, failed
    applied_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "automation_runs"
        indexes = [
            "user_id",
            "status"
        ]
