"""
Match repository for database operations using Beanie (MongoDB).
"""
from typing import List, Optional
from app.repositories.base import BaseRepository
from app.models.match import Match
from app.core.exceptions import DatabaseError
from app.core.logging import get_logger

logger = get_logger(__name__)

class MatchRepository(BaseRepository[Match]):
    """Repository for Match model operations."""
    
    def __init__(self) -> None:
        """Initialize match repository."""
        super().__init__(Match)
    
    async def get_by_user(self, user_id: str) -> List[Match]:
        """Get matches for a specific user."""
        try:
            return await Match.find(Match.user_id == user_id).sort("-created_at").to_list()
        except Exception as e:
            logger.error(f"Error getting matches for user {user_id}: {str(e)}")
            raise DatabaseError("Failed to get matches") from e

    async def get_by_job(self, job_id: str) -> List[Match]:
        """Get matches for a specific job."""
        try:
            return await Match.find(Match.job_id == job_id).sort("-match_score").to_list()
        except Exception as e:
            logger.error(f"Error getting matches for job {job_id}: {str(e)}")
            raise DatabaseError("Failed to get matches") from e
