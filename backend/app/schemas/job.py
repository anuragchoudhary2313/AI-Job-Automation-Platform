from typing import Optional, Annotated, Any
from datetime import datetime
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
from app.models.enums import JobStatus

def stringify_object_id(v: Any) -> Any:
    if v and hasattr(v, "__str__"):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(stringify_object_id)]

class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100, description="The job title")
    company: str = Field(..., min_length=2, max_length=100, description="The company name")
    description: str = Field(..., min_length=10, description="Detailed job description")
    location: Optional[str] = Field(None, max_length=100)
    salary_range: Optional[str] = Field(None, max_length=50)
    job_url: Optional[str] = Field(None, pattern=r"^https?://", description="Valid HTTP URL")
    hr_email: Optional[str] = Field(None, description="Valid email address")
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
    id: PyObjectId
    team_id: Optional[PyObjectId] = None
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class JobCreateResponse(BaseModel):
    """Response for job creation, indicating if job was created or already existed."""
    job: Job
    created: bool  # True if newly created, False if already existed
    message: str
