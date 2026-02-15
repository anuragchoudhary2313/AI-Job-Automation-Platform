from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ResumeBase(BaseModel):
    content: str
    template: str = "professional"
    job_id: Optional[str] = None

class ResumeCreate(ResumeBase):
    pass

class Resume(ResumeBase):
    id: str
    user_id: str
    file_path: Optional[str] = None
    job_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
