"""
Resume service for resume-related business logic.
"""

from typing import List, Optional
import os
import shutil
from datetime import datetime
from fastapi import UploadFile, HTTPException, status

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
    
    async def save_resume_file(self, file: UploadFile, user: User) -> Resume:
        """Validate and save uploaded resume file, then create DB record."""
        # Validate file type
        if not file.filename or not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
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
                detail="Failed to save file to storage"
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
            
        # Parse resume content using AI
        parsed_data = {}
        try:
            parsed_data = await ai_service.parse_resume(content)
        except Exception as e:
            logger.error(f"Failed to parse resume with AI: {e}")

        # Create DB entry - use PydanticObjectId for user_id
        from beanie import PydanticObjectId
        resume = Resume(
            user_id=PydanticObjectId(user.id),  # Convert to ObjectId
            content=content,
            file_path=file_path,
            filename=file.filename,  # Store original filename
            parsed_data=parsed_data
        )
        await resume.insert()
        
        logger.info(f"Resume uploaded and parsed: {resume.id} by user {user.id}")
        return resume
    
    async def get_resume(self, resume_id: str, user: User) -> Resume:
        """Get resume by ID with authorization check."""
        resume = await self.resume_repo.get_or_404(resume_id)
        
        # Check authorization
        # Resume has no team_id. Check via user_id?
        # Or I need to trust team check in repo. 
        # But repo 'get_or_404' is generic.
        # I should fetch user of resume and check team?
        # Or just check if resume.user_id is in user's team?
        # If I don't have team_id in Resume, I must check owner.
        
        if resume.user_id == str(user.id):
            return resume
            
        # If not owner, check if team member?
        # Only if I fetch the user of the resume. 
        # For now, strict ownership or matching team_id if I added it?
        # I did not add team_id to resume model in step 467. 
        # I should probably add it or rely on user linkage.
        # For MVP, strict ownership or same team. 
        # Let's check user linkage.
        
        from app.models.user import User as UserModel
        resume_owner = await UserModel.get(resume.user_id)
        if resume_owner and resume_owner.team_id == str(user.team_id):
            return resume
            
        raise AuthorizationError("You don't have access to this resume")
    
    async def get_resumes(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100
    ) -> List[Resume]:
        """Get resumes for user's team."""
        resumes = await self.resume_repo.get_by_team(
            team_id=str(user.team_id),
            skip=skip,
            limit=limit
        )
        
        logger.info(f"Retrieved {len(resumes)} resumes for team {user.team_id}")
        return resumes
    
    async def get_user_resumes(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100
    ) -> List[Resume]:
        """Get resumes created by user."""
        resumes = await self.resume_repo.get_by_user(
            user_id=str(user.id),
            skip=skip,
            limit=limit
        )
        
        logger.info(f"Retrieved {len(resumes)} resumes for user {user.id}")
        return resumes
    
    async def create_resume(
        self,
        resume_data: ResumeCreate,
        user: User
    ) -> Resume:
        """Create a new resume."""
        resume = await self.resume_repo.create(
            # title=resume_data.title, # Model has no title? Checking... Step 467. 
            # Model: content, job_id, user_id, file_path, parsed_data, embedding_vector.
            # Schema 'ResumeCreate' has title? Checking Step 465.
            # Schema: content, job_id(int), user_id(int), file_path. No title.
            content=resume_data.content,
            file_path=resume_data.file_path,
            job_id=str(resume_data.job_id) if resume_data.job_id else None,
            user_id=str(user.id)
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
    
    async def get_resume_by_job(
        self,
        job_id: str,
        user: User
    ) -> Optional[Resume]:
        """Get resume for a specific job."""
        resume = await self.resume_repo.get_by_job(job_id)
        
        if resume:
             # Authorization check
            if resume.user_id == str(user.id):
                return resume
            
            from app.models.user import User as UserModel
            resume_owner = await UserModel.get(resume.user_id)
            if resume_owner and resume_owner.team_id == str(user.team_id):
                return resume
                
            raise AuthorizationError("You don't have access to this resume")
        
        return resume
