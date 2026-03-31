from typing import Optional, List
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from app.models.enums import JobStatus

class Job(Document):
    """Job model using Beanie (MongoDB)."""
    title: str
    company: str
    location: Optional[str] = None
    description: str
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    hr_email: Optional[str] = None
    status: JobStatus = JobStatus.PENDING
    skills_required: List[str] = []
    
<<<<<<< Updated upstream
    # Relationships (ObjectIds as strings)
=======
    # Ownership
>>>>>>> Stashed changes
    user_id: PydanticObjectId
    
    # Metadata
    applied_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "jobs"
        indexes = [
            "title",
            "company",
            "status",
            "user_id",
            "skills_required",
<<<<<<< Updated upstream
            # Compound index for common filter patterns
=======
>>>>>>> Stashed changes
            [("user_id", 1), ("status", 1)],
            [("user_id", 1), ("created_at", -1)]
        ]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Senior Software Engineer",
                "company": "Google",
                "location": "Remote",
                "description": "Building next-gen AI systems...",
                "status": "pending",
                "user_id": "60d5ecb8b392d40015f8c8d2"
            }
        }
    )

class ScrapedJob(Document):
    title: str
    company: str
    location: str
    link: str
    description: Optional[str] = None
    posted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "scraped_jobs"
        indexes = [
            "link",
            "title",
            "company"
        ]
