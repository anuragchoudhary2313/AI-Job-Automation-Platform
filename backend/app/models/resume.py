from typing import Optional, List, Dict, Any
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field

class Resume(Document):
    user_id: PydanticObjectId # Reference to User ID
    content: str
    file_path: Optional[str] = None
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
