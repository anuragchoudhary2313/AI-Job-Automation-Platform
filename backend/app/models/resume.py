from typing import Optional, List, Dict, Any
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field

class Resume(Document):
    user_id: PydanticObjectId # Reference to User ID
    content: Optional[str] = None  # Make optional since we extract from PDF
    file_path: Optional[str] = None
    filename: Optional[str] = None  # Original filename for display
    template: str = "professional"
    job_id: Optional[PydanticObjectId] = None # Optional reference to a specific job
    
    parsed_data: Dict[str, Any] = {}
    embedding_vector: List[float] = []

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "resumes"
        indexes = [
            "user_id"
        ]
