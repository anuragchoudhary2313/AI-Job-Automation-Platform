"""
Refactored resumes endpoints using service layer.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, BackgroundTasks, Body
from fastapi.responses import FileResponse
from typing import List, Any
import os
import tempfile
import subprocess
import uuid

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
    resume_repo: ResumeRepository = Depends(deps.get_resume_repository),
) -> ResumeService:
    """Dependency for resume service."""
    return ResumeService(resume_repo)


@router.post(
    "/upload", response_model=ResumeSchema, status_code=status.HTTP_201_CREATED
)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> Any:
    """Upload a resume file (PDF) for the current user."""
    try:
        resume = await resume_service.save_resume_file(file, current_user, background_tasks)

        # Convert Beanie model to dict for Pydantic schema
        resume_dict = resume.dict(by_alias=False)
        resume_dict["id"] = str(resume.id)
        resume_dict["user_id"] = str(resume.user_id)
        if resume.job_id:
            resume_dict["job_id"] = str(resume.job_id)

        return resume_dict

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}", exc_info=True)
        from app.core.exceptions import AppException
        if isinstance(e, AppException):
            raise handle_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while uploading resume",
        )

@router.post("/extract-text", response_model=str)
async def extract_text(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> str:
    """Extract raw text from a PDF or DOCX file for rapid AI processing without saving to DB."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
        
    ext = file.filename.lower()
    if not (ext.endswith(".pdf") or ext.endswith(".docx") or ext.endswith(".doc")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
    try:
        content = ""
        if ext.endswith(".pdf"):
            from pypdf import PdfReader
            reader = PdfReader(file.file)
            for page in reader.pages:
                content += page.extract_text() + "\n"
        elif ext.endswith(".docx") or ext.endswith(".doc"):
            import docx
            doc = docx.Document(file.file)
            for para in doc.paragraphs:
                content += para.text + "\n"
                
        return content.strip()
    except Exception as e:
        logger.error(f"Error extracting text from file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract text from file")


@router.post("/compile-latex")
async def compile_latex(
    latex: str = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_user),
) -> FileResponse:
    """Compile LaTeX to PDF using tectonic and return the PDF."""
    try:
        temp_dir = tempfile.mkdtemp()
        file_id = str(uuid.uuid4())
        tex_path = os.path.join(temp_dir, f"{file_id}.tex")
        pdf_path = os.path.join(temp_dir, f"{file_id}.pdf")
        
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex)
            
        tectonic_exe = os.path.join(os.getcwd(), "tectonic.exe")
        if not os.path.exists(tectonic_exe):
            tectonic_exe = "tectonic"
            
        process = subprocess.run([tectonic_exe, tex_path], capture_output=True, text=True)
        
        if process.returncode != 0:
            logger.error(f"Tectonic compilation failed: {process.stderr}\n{process.stdout}")
            raise HTTPException(status_code=400, detail="LaTeX compilation failed. Check your syntax.")
            
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="Compiled PDF not found.")
            
        return FileResponse(
            pdf_path,
            filename="resume.pdf",
            media_type="application/pdf",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error compiling LaTeX: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while compiling LaTeX",
        )

@router.post("/save-generated", response_model=ResumeSchema, status_code=status.HTTP_201_CREATED)
async def save_generated_resume(
    resume_data: dict,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> Any:
    """Save an AI generated structured resume to library."""
    try:
        resume = await resume_service.save_generated_resume(parsed_data=resume_data, user=current_user)
        resume_dict = resume.dict(by_alias=False)
        resume_dict["id"] = str(resume.id)
        resume_dict["user_id"] = str(resume.user_id)
        if resume.job_id:
            resume_dict["job_id"] = str(resume.job_id)
        return resume_dict
    except Exception as e:
        logger.error(f"Error saving generated resume: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while saving generated resume",
        )


@router.get("/", response_model=List[ResumeSchema])
async def list_resumes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> Any:
    """List all resumes for the current user."""
    try:
        logger.info(f"List resumes request - user: {current_user.id}")

        resumes = await resume_service.get_resumes(
            user=current_user, skip=skip, limit=limit
        )

        logger.info(f"Found {len(resumes)} resumes for user {current_user.id}")

        # Convert Beanie models to dicts for Pydantic schema
        resume_list = []
        for resume in resumes:
            resume_dict = resume.dict(by_alias=False)
            resume_dict["id"] = str(resume.id)
            resume_dict["user_id"] = str(resume.user_id)
            if resume.job_id:
                resume_dict["job_id"] = str(resume.job_id)
            resume_list.append(resume_dict)
            logger.info(
                f"Resume: {resume_dict.get('filename', 'no filename')} - ID: {resume_dict['id']}"
            )

        logger.info(f"Returning {len(resume_list)} resumes")
        return resume_list

    except Exception as e:
        logger.error(f"Error listing resumes: {str(e)}", exc_info=True)
        from app.core.exceptions import AppException
        if isinstance(e, AppException):
            raise handle_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while listing resumes",
        )


@router.get("/{resume_id}", response_model=ResumeSchema)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> Any:
    """Get resume by ID."""
    try:
        resume = await resume_service.get_resume(resume_id, current_user)
        return resume

    except Exception as e:
        logger.error(f"Error getting resume {resume_id}: {str(e)}", exc_info=True)
        from app.core.exceptions import AppException
        if isinstance(e, AppException):
            raise handle_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting resume",
        )


@router.get("/{resume_id}/download")
async def download_resume(
    resume_id: str,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> FileResponse:
    """Download a specific resume."""
    try:
        resume = await resume_service.get_resume(resume_id, current_user)

        # Check if file exists
        if not os.path.exists(resume.file_path):
            logger.error(f"Resume file not found on server: {resume.file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server"
            )

        return FileResponse(
            resume.file_path,
            filename=os.path.basename(resume.file_path),
            media_type="application/pdf",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading resume {resume_id}: {str(e)}", exc_info=True)
        from app.core.exceptions import AppException
        if isinstance(e, AppException):
            raise handle_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while downloading resume",
        )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> None:
    """Delete a resume."""
    try:
        await resume_service.delete_resume(resume_id, current_user)
        return None

    except Exception as e:
        logger.error(f"Error deleting resume {resume_id}: {str(e)}", exc_info=True)
        from app.core.exceptions import AppException
        if isinstance(e, AppException):
            raise handle_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting resume",
        )


@router.get("/job/{job_id}", response_model=ResumeSchema)
async def get_resume_by_job(
    job_id: str,
    current_user: User = Depends(deps.get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> Any:
    """Get resume for a specific job."""
    try:
        resume = await resume_service.get_resume_by_job(job_id, current_user)

        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found for this job",
            )

        return resume

    except Exception as e:
        logger.error(f"Error getting resume for job {job_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting resume",
        )
