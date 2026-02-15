from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import ai_service
from app.core.features import features
from app.schemas.ai import StructuredResume, CoverLetter

router = APIRouter()

class ResumeBulletRequest(BaseModel):
    bullet: str
    job_description: str

class CoverLetterRequest(BaseModel):
    resume_summary: str
    job_description: str
    company_name: str

class EmailPersonalizationRequest(BaseModel):
    template: str
    company_name: str
    role: str

class ResumeGenerationRequest(BaseModel):
    job_description: str

@router.post("/resume/generate", response_model=str)
async def generate_resume_content(request: ResumeGenerationRequest):
    """
    Generate optimized resume content based on job description.
    """
    features.require("ai_resume")
    try:
        return await ai_service.generate_resume_content(request.job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resume/generate-structured", response_model=StructuredResume)
async def generate_structured_resume(request: ResumeGenerationRequest):
    """
    Generate optimized resume content as structured JSON.
    """
    features.require("ai_resume")
    try:
        data = await ai_service.generate_structured_resume(request.job_description)
        return StructuredResume(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")



@router.post("/cover-letter/generate-structured", response_model=CoverLetter)
async def generate_structured_cover_letter(request: CoverLetterRequest):
    """
    Generate a professional cover letter as structured JSON.
    """
    features.require("ai_cover_letter")
    try:
        data = await ai_service.generate_structured_cover_letter(
            request.resume_summary, 
            request.job_description, 
            request.company_name
        )
        return CoverLetter(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")

@router.post("/resume/bullets", response_model=str)
async def generate_resume_bullets(request: ResumeBulletRequest):
    """
    Rewrite a resume bullet point using AI.
    """
    features.require("ai_resume")
    try:
        return await ai_service.generate_resume_bullets(request.bullet, request.job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cover-letter", response_model=str)
async def generate_cover_letter(request: CoverLetterRequest):
    """
    Generate a cover letter using AI.
    """
    features.require("ai_cover_letter")
    try:
        return await ai_service.generate_cover_letter(
            request.resume_summary, 
            request.job_description, 
            request.company_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/email", response_model=str)
async def personalize_email(request: EmailPersonalizationRequest):
    """
    Personalize an email template using AI.
    """
    features.require("email_automation")
    try:
        return await ai_service.personalize_email(
            request.template, 
            request.company_name, 
            request.role
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
