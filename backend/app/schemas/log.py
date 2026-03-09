from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LogBase(BaseModel):
    action: str
    details: Optional[str] = None
    level: str = "info"

class LogCreate(LogBase):
    pass

class Log(LogBase):
    id: str
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
