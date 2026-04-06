from datetime import datetime
from typing import Any, Dict, Optional

from beanie import Document
from pydantic import Field


class AutomationDeadLetter(Document):
    """Persistent failures from automation pipelines for triage/replay."""

    user_id: Optional[str] = None
    source: str
    stage: str
    task_name: str
    error_message: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    retry_count: int = 0
    status: str = "open"  # open | replayed | ignored
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "automation_dead_letters"
        indexes = [
            "source",
            "stage",
            "task_name",
            "status",
            "user_id",
            "created_at",
        ]
