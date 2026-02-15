from typing import Optional
from datetime import datetime
from pydantic import BaseModel

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

    class Config:
        from_attributes = True
