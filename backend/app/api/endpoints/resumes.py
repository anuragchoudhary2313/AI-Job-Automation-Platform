"""
Refactored resumes endpoints using service layer.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from typing import List, Any
import os

from app.api import deps
from app.core.exceptions import NotFoundError, AuthorizationError, handle_exception
from app.core.logging import get_logger
from app.repositories.resume import ResumeRepository
from app.services.resume_service import ResumeService
from app.models.user import User
from app.schemas.resume import Resume as ResumeSchema

router = APIRouter()
logger = get_logger(__name__)

UPLOAD_DIR = "uploads"


def get_resume_service(
    resume_repo: ResumeRepository = Depends(deps.get_resume_repository)
) -> ResumeService:
    """Dependency for resume service."""
    return ResumeService(resume_repo)


@router.post("/upload", response_model=ResumeSchema, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service)
) -> Any:
    """Upload a resume file (PDF) for the team."""
    try:
        resume = await resume_service.save_resume_file(file, current_user)
        return resume
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while uploading resume"
        )


@router.get("/", response_model=List[ResumeSchema])
async def list_resumes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service)
) -> Any:
    """List all resumes for the team."""
    try:
        resumes = await resume_service.get_resumes(
            user=current_user,
            skip=skip,
            limit=limit
        )
        return resumes
        
    except Exception as e:
        logger.error(f"Error listing resumes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while listing resumes"
        )


@router.get("/{resume_id}", response_model=ResumeSchema)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service)
) -> Any:
    """Get resume by ID."""
    try:
        resume = await resume_service.get_resume(resume_id, current_user)
        return resume
        
    except Exception as e:
        logger.error(f"Error getting resume {resume_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting resume"
        )


@router.get("/{resume_id}/download")
async def download_resume(
    resume_id: str,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service)
) -> FileResponse:
    """Download a specific resume."""
    try:
        resume = await resume_service.get_resume(resume_id, current_user)
        
        # Check if file exists
        if not os.path.exists(resume.file_path): # Changed from path to file_path based on model
             # Check if model uses path or file_path. 
             # Schema has file_path. Beanie model has file_path.
             # Service save_resume_file uses file_path.
            logger.error(f"Resume file not found on server: {resume.file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on server"
            )
        
        return FileResponse(
            resume.file_path,
            filename=os.path.basename(resume.file_path), # Extract filename from path
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading resume {resume_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while downloading resume"
        )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service)
) -> None:
    """Delete a resume."""
    try:
        await resume_service.delete_resume(resume_id, current_user)
        return None
        
    except Exception as e:
        logger.error(f"Error deleting resume {resume_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting resume"
        )


@router.get("/job/{job_id}", response_model=ResumeSchema)
async def get_resume_by_job(
    job_id: str,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service)
) -> Any:
    """Get resume for a specific job."""
    try:
        resume = await resume_service.get_resume_by_job(job_id, current_user)
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found for this job"
            )
        
        return resume
        
    except Exception as e:
        logger.error(f"Error getting resume for job {job_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting resume"
        )
