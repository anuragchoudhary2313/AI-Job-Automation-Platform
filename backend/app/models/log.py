from typing import Optional, Any
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field

class AgentLog(Document):
    agent_name: str
    user_id: Optional[PydanticObjectId] = None
    input: Any = None
    output: Any = None
    execution_time_ms: float = 0.0
    status: str = "success"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "agent_logs"
        indexes = [
            "created_at",
            "agent_name",
            "user_id"
        ]

class Log(Document):
    action: str
    details: Optional[str] = None
    level: str = "info"
    user_id: Optional[PydanticObjectId] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "logs"
        indexes = [
            "created_at",
            "level",
            "action",
            "user_id"
        ]
