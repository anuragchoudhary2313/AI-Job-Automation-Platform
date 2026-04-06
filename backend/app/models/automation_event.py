from datetime import datetime
from typing import Any, Dict, Optional

from beanie import Document
from pydantic import Field


class AutomationEvent(Document):
    """Audit log for automation decisions and actions."""

    user_id: str
    source: str
    stage: str
    company: Optional[str] = None
    role: Optional[str] = None
    action: str
    reason: Optional[str] = None
    ats_score: Optional[int] = None
    passes_gate: Optional[bool] = None
    override_used: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "automation_events"
        indexes = [
            "user_id",
            "source",
            "stage",
            "action",
            "created_at",
        ]
