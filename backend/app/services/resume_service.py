"""
Resume service for resume-related business logic.
"""

from typing import List, Optional
import os
import shutil
from datetime import datetime
from fastapi import UploadFile, HTTPException, status, BackgroundTasks

from app.core.exceptions import AuthorizationError
from app.core.logging import get_logger
from app.repositories.resume import ResumeRepository
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeCreate
from app.services.ai_service import ai_service
from pypdf import PdfReader

logger = get_logger(__name__)

UPLOAD_DIR = "uploads"


class ResumeService:
    """Service for resume operations."""

    def __init__(self, resume_repo: ResumeRepository) -> None:
        """Initialize resume service."""
        self.resume_repo = resume_repo

    async def save_resume_file(self, file: UploadFile, user: User, background_tasks: Optional[BackgroundTasks] = None) -> Resume:
        """Validate and save uploaded resume file, then create DB record and queue processing."""
        # Validate file type
        if not file.filename or not file.filename.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed",
            )

        # Create team directory
        team_dir = os.path.join(UPLOAD_DIR, str(user.team_id))
        os.makedirs(team_dir, exist_ok=True)

        # Save file with timestamp
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(team_dir, safe_filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            logger.error(f"Failed to save file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file to storage",
            )

        # Extract text from PDF
        content = ""
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                content += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            content = "Failed to extract text"

        # Create DB entry - use PydanticObjectId for user_id
        from beanie import PydanticObjectId

        resume = Resume(
            user_id=PydanticObjectId(user.id),  # Convert to ObjectId
            content=content,
            file_path=file_path,
            filename=file.filename,  # Store original filename
            parsed_data={"status": "processing"},
        )
        await resume.insert()

        logger.info(f"Resume uploaded: {resume.id} by user {user.id}")
        
        # Async execution of LLM processing
        if background_tasks is not None:
            background_tasks.add_task(self.parse_and_update_resume, str(resume.id), content)
        else:
            # Fallback for sync contexts
            try:
                parsed_data = await ai_service.parse_resume(content)
                resume.parsed_data = parsed_data
                await resume.save()
            except Exception as e:
                logger.error(f"Sync fallback parse failed: {e}")
                
        return resume
        
    async def save_generated_resume(self, parsed_data: dict, user: User, content: str = "") -> Resume:
        """Save an AI-generated resume from its JSON structure."""
        from beanie import PydanticObjectId
        
        job_title = "Generated Resume"
        if parsed_data.get("experience") and len(parsed_data["experience"]) > 0:
            job_title = parsed_data["experience"][0].get("title", job_title)
            
        filename = f"{job_title} - AI Generated.json"
        
        resume = Resume(
            user_id=PydanticObjectId(user.id),
            content=content,
            filename=filename,
            parsed_data=parsed_data
        )
        await resume.insert()
        logger.info(f"Generated Resume saved: {resume.id} by user {user.id}")
        return resume
        
    async def parse_and_update_resume(self, resume_id: str, content: str) -> None:
        """Background task to extract structured JSON from raw resume text."""
        try:
            logger.info(f"Starting background parse for resume {resume_id}")
            parsed_data = await ai_service.parse_resume(content)
            
            # Fetch the resume fresh from the DB
            resume = await self.resume_repo.get_or_404(resume_id)
            if resume:
                resume.parsed_data = parsed_data
                await resume.save()
                logger.info(f"Finished background parse and updated resume {resume_id}")
        except Exception as e:
            logger.error(f"Background resume parsing failed: {e}")
            try:
                resume = await self.resume_repo.get_or_404(resume_id)
                if resume:
                    resume.parsed_data = {"status": "failed", "error": str(e)}
                    await resume.save()
            except:
                pass

    async def get_resume(self, resume_id: str, user: User) -> Resume:
        """Get resume by ID with authorization check."""
        resume = await self.resume_repo.get_or_404(resume_id)

        # Check ownership first
        if str(resume.user_id) == str(user.id):
            return resume

        # Fall back to team membership check
        from app.models.user import User as UserModel

        resume_owner = await UserModel.get(resume.user_id)
        if resume_owner and str(resume_owner.team_id) == str(user.team_id) and str(user.team_id) != "None":
            return resume

        raise AuthorizationError("You don't have access to this resume")

    async def get_resumes(
        self, user: User, skip: int = 0, limit: int = 100
    ) -> List[Resume]:
        """Get resumes for user's team, or user only if no team."""
        if user.team_id and str(user.team_id) != "None":
            resumes = await self.resume_repo.get_by_team(
                team_id=str(user.team_id), skip=skip, limit=limit
            )
            logger.info(f"Retrieved {len(resumes)} resumes for team {user.team_id}")
        else:
            resumes = await self.resume_repo.get_by_user(
                user_id=str(user.id), skip=skip, limit=limit
            )
            logger.info(f"Retrieved {len(resumes)} resumes for user {user.id}")
            
        return resumes

    async def get_user_resumes(
        self, user: User, skip: int = 0, limit: int = 100
    ) -> List[Resume]:
        """Get resumes created by user."""
        resumes = await self.resume_repo.get_by_user(
            user_id=str(user.id), skip=skip, limit=limit
        )

        logger.info(f"Retrieved {len(resumes)} resumes for user {user.id}")
        return resumes

    async def create_resume(self, resume_data: ResumeCreate, user: User) -> Resume:
        """Create a new resume."""
        from beanie import PydanticObjectId
        resume = await self.resume_repo.create(
            content=resume_data.content,
            file_path=resume_data.file_path,
            job_id=PydanticObjectId(resume_data.job_id) if resume_data.job_id else None,
            user_id=PydanticObjectId(user.id),
        )

        logger.info(f"Created resume {resume.id} for user {user.id}")
        return resume

    async def delete_resume(self, resume_id: str, user: User) -> bool:
        """Delete a resume."""
        # Check authorization
        await self.get_resume(resume_id, user)

        # Delete resume
        result = await self.resume_repo.delete(resume_id)

        logger.info(f"Deleted resume {resume_id}")
        return result

    async def get_resume_by_job(self, job_id: str, user: User) -> Optional[Resume]:
        """Get resume for a specific job."""
        resume = await self.resume_repo.get_by_job(job_id)

        if resume:
            # Authorization check
            if str(resume.user_id) == str(user.id):
                return resume

            from app.models.user import User as UserModel

            resume_owner = await UserModel.get(resume.user_id)
            if resume_owner and str(resume_owner.team_id) == str(user.team_id) and str(user.team_id) != "None":
                return resume

            raise AuthorizationError("You don't have access to this resume")

        return resume
