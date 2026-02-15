from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import JobStatus

class JobBase(BaseModel):
    title: str
    company: str
    description: str
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    hr_email: Optional[str] = None
    status: JobStatus = JobStatus.PENDING

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    hr_email: Optional[str] = None
    status: Optional[JobStatus] = None

class Job(JobBase):
    id: str
    team_id: Optional[str] = None
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
