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
            from beanie import PydanticObjectId
            from app.models.user import User
            
            # Guard against invalid team_id
            if not team_id or team_id == "None":
                logger.warning(f"Invalid team_id provided to get_by_team: {team_id}")
                return []

            # Ensure team_id is a PydanticObjectId if it's a string
            team_id_obj = PydanticObjectId(team_id) if isinstance(team_id, str) else team_id
            
            users = await User.find(User.team_id == team_id_obj).to_list()
            user_ids = [u.id for u in users]

            logger.info(
                f"Found {len(users)} users in team {team_id}, querying their resumes"
            )

            resumes = (
                await Resume.find({"user_id": {"$in": user_ids + [str(uid) for uid in user_ids]}})
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
            from beanie import PydanticObjectId
            user_id_obj = PydanticObjectId(user_id) if isinstance(user_id, str) else user_id
            user_id_str = str(user_id)
            
            return (
                await Resume.find({"user_id": {"$in": [user_id_obj, user_id_str]}})
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
            from beanie import PydanticObjectId
            job_id_obj = PydanticObjectId(job_id) if isinstance(job_id, str) else job_id
            job_id_str = str(job_id)
            
            return await Resume.find_one({"job_id": {"$in": [job_id_obj, job_id_str]}})
        except Exception as e:
            logger.error(f"Error getting resume for job {job_id}: {str(e)}")
            raise DatabaseError("Failed to get job resume") from e
