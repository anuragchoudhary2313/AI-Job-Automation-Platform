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
        self, team_id: str, skip: int = 0, limit: int = 100
    ) -> List[Resume]:
        """Get resumes for a specific team via user membership."""
        try:
            from app.models.user import User
            from beanie import PydanticObjectId

            users = await User.find(User.team_id == team_id).to_list()
            user_ids = [PydanticObjectId(u.id) for u in users]

            logger.info(
                f"Found {len(users)} users in team {team_id}, querying their resumes"
            )

            resumes = (
                await Resume.find({"user_id": {"$in": user_ids}})
                .sort("-created_at")
                .skip(skip)
                .limit(limit)
                .to_list()
            )

            logger.info(f"Found {len(resumes)} resumes for team {team_id}")
            return resumes

        except Exception as e:
            logger.error(
                f"Error getting resumes for team {team_id}: {str(e)}", exc_info=True
            )
            raise DatabaseError("Failed to get resumes") from e

    async def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[Resume]:
        """Get resumes created by a specific user."""
        try:
            return (
                await Resume.find(Resume.user_id == user_id)
                .sort("-created_at")
                .skip(skip)
                .limit(limit)
                .to_list()
            )
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
