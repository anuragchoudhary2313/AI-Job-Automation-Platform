from pydantic import BaseModel, Field
from typing import List, Optional

class ResumeBullet(BaseModel):
    original: str
    optimized: str
    rationale: Optional[str] = None

class ResumeSection(BaseModel):
    title: str
    content: List[str]

class StructuredResume(BaseModel):
    summary: str = Field(..., description="Professional summary optimized for the job")
    skills: List[str] = Field(..., description="List of relevant technical and soft skills")
    experience: List[ResumeSection] = Field(..., description="Work experience sections with optimized bullets")
    education: List[ResumeSection] = Field(..., description="Education history")
    projects: Optional[List[ResumeSection]] = Field(None, description="Relevant projects")

class CoverLetter(BaseModel):
    recipient: str
    company: str
    content: str
    tone: str = Field("professional", description="The tone of the letter")

class AIResponse(BaseModel):
    """Generic wrapper for AI responses"""
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    meta: Optional[dict] = None
