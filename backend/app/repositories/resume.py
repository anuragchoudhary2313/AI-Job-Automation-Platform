"""
Resume repository for database operations using Beanie (MongoDB).
"""

from typing import List, Optional

from app.repositories.base import BaseRepository
from app.models.resume import Resume
from app.core.exceptions import DatabaseError
from app.core.logging import get_logger

logger = get_logger(__name__)


class ResumeRepository(BaseRepository[Resume]):
    """Repository for Resume model operations."""
    
    def __init__(self) -> None:
        """Initialize resume repository."""
        super().__init__(Resume)
    
    async def get_by_team(
        self,
        team_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Resume]:
        """Get resumes for a specific team."""
        try:
            # Note: Resume model doesn't strictly have team_id, but assuming it might be needed or linked via User
            # If Resume schema has no team_id, this might need adjustment.
            # Checking Resume model: it has user_id, job_id. No team_id.
            # SQL implementation had Resume.team_id. I should probably add it to the model or infer from User.
            # For now, I'll assumme query on User's team if not in model, or if I missed adding it.
            # Looking at my created Resume model: No team_id.
            # But the SQL repo used it.
            # Strategy: Find users in team, then find resumes for those users.
            
            from app.models.user import User
            users = await User.find(User.team_id == team_id).to_list()
            user_ids = [str(u.id) for u in users]
            
            return await Resume.find({"user_id": {"$in": user_ids}}).sort("-created_at").skip(skip).limit(limit).to_list()
            
        except Exception as e:
            logger.error(f"Error getting resumes for team {team_id}: {str(e)}")
            raise DatabaseError("Failed to get resumes") from e
    
    async def get_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Resume]:
        """Get resumes created by a specific user."""
        try:
            return await Resume.find(Resume.user_id == user_id).sort("-created_at").skip(skip).limit(limit).to_list()
        except Exception as e:
            logger.error(f"Error getting resumes for user {user_id}: {str(e)}")
            raise DatabaseError("Failed to get user resumes") from e
    
    async def get_by_job(self, job_id: str) -> Optional[Resume]:
        """Get resume for a specific job."""
        try:
            return await Resume.find_one(Resume.job_id == job_id)
        except Exception as e:
            logger.error(f"Error getting resume for job {job_id}: {str(e)}")
            raise DatabaseError("Failed to get job resume") from e
