"""
Job repository for database operations using Beanie (MongoDB).
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from beanie.operators import Or, RegEx

from app.repositories.base import BaseRepository
from app.models.job import Job
from app.core.exceptions import DatabaseError
from app.core.logging import get_logger

logger = get_logger(__name__)


class JobRepository(BaseRepository[Job]):
    """Repository for Job model operations."""
    
    def __init__(self) -> None:
        """Initialize job repository."""
        super().__init__(Job)
    
    async def get_by_team(
        self,
        team_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = None
    ) -> List[Job]:
        """Get jobs for a specific team with optional filtering and sorting."""
        try:
            query = Job.find(Job.team_id == team_id)
            
            if status:
                query = query.find(Job.status == status)
            
            if search:
                query = query.find(
                    Or(
                        RegEx(Job.title, search, "i"),
                        RegEx(Job.company, search, "i")
                    )
                )
            
            sort_field = "-created_at"
            if sort:
                if sort == "oldest":
                    sort_field = "created_at"
                elif sort == "title":
                    sort_field = "title"
                elif sort == "company":
                    sort_field = "company"
            
            return await query.sort(sort_field).skip(skip).limit(limit).to_list()
        except Exception as e:
            logger.error(f"Error getting jobs for team {team_id}: {str(e)}")
            raise DatabaseError("Failed to get jobs") from e
    
    async def get_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Job]:
        """Get jobs created by a specific user."""
        try:
            return await Job.find(Job.user_id == user_id).sort("-created_at").skip(skip).limit(limit).to_list()
        except Exception as e:
            logger.error(f"Error getting jobs for user {user_id}: {str(e)}")
            raise DatabaseError("Failed to get user jobs") from e
    
    async def get_stats_by_team(self, team_id: str) -> Dict[str, Any]:
        """Get job statistics for a team."""
        try:
            # Get all jobs for team
            jobs = await Job.find(Job.team_id == team_id).to_list()
            
            # Calculate stats
            total = len(jobs)
            by_status = {}
            
            for job in jobs:
                status = job.status or "unknown"
                by_status[status] = by_status.get(status, 0) + 1
            
            return {
                "total": total,
                "by_status": by_status,
                "applied": by_status.get("applied", 0),
                "interview": by_status.get("interviewing", 0), # Corrected key
                "offer": by_status.get("offered", 0), # Corrected key
                "rejected": by_status.get("rejected", 0)
            }
        except Exception as e:
            logger.error(f"Error getting job stats for team {team_id}: {str(e)}")
            raise DatabaseError("Failed to get job statistics") from e
    
    async def search(
        self,
        team_id: str,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Job]:
        """Search jobs by title or company."""
        try:
            # Case-insensitive regex search
            search_query = Job.find(
                Job.team_id == team_id,
                Or(
                    RegEx(Job.title, query, "i"),
                    RegEx(Job.company, query, "i")
                )
            )
            return await search_query.sort("-created_at").skip(skip).limit(limit).to_list()
        except Exception as e:
            logger.error(f"Error searching jobs: {str(e)}")
            raise DatabaseError("Failed to search jobs") from e
