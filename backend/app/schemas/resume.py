from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ResumeBase(BaseModel):
    content: Optional[str] = None  # Make optional since we extract from PDF
    template: str = "professional"
    job_id: Optional[str] = None

class ResumeCreate(ResumeBase):
    pass

class Resume(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    content: Optional[str] = None
    file_path: Optional[str] = None
    filename: Optional[str] = None  # Add filename for display
    template: str = "professional"
    job_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
