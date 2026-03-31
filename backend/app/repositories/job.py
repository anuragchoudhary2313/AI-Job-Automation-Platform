"""
Job repository for database operations using Beanie (MongoDB).
"""

from typing import Optional, List, Dict, Any
from beanie import PydanticObjectId
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

    async def get_by_url_and_user(self, job_url: str, user_id: str) -> Optional[Job]:
        """Check if a job with the same URL already exists for this user."""
        try:
            user_oid = PydanticObjectId(user_id)
            return await Job.find_one(Job.job_url == job_url, Job.user_id == user_oid)
        except Exception as e:
            logger.error(f"Error checking duplicate job url: {str(e)}")
            return None

    async def get_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = None,
    ) -> List[Job]:
        """Get jobs for a specific user with optional filtering and sorting."""
        try:
            user_oid = PydanticObjectId(user_id)
            query_obj = Job.find(Job.user_id == user_oid)

            if status:
                query_obj = query_obj.find(Job.status == status)

            if search:
                query_obj = query_obj.find(
                    Or(RegEx(Job.title, search, "i"), RegEx(Job.company, search, "i"))
                )

            sort_field = "-created_at"
            if sort:
                if sort == "oldest":
                    sort_field = "created_at"
                elif sort == "title":
                    sort_field = "title"
                elif sort == "company":
                    sort_field = "company"

            return await query_obj.sort(sort_field).skip(skip).limit(limit).to_list()
        except Exception as e:
            logger.error(f"Error getting jobs for user {user_id}: {str(e)}")
            raise DatabaseError("Failed to get jobs") from e

    async def get_stats_by_user(self, user_id: str) -> Dict[str, Any]:
        """Get job statistics for a user using server-side aggregation."""
        try:
            # Convert string to PydanticObjectId for proper MongoDB comparison
            from bson import ObjectId
            user_oid = ObjectId(user_id)
            pipeline = [
                {"$match": {"user_id": user_oid}},
                {
                    "$group": {
                        "_id": {"$ifNull": ["$status", "unknown"]},
                        "count": {"$sum": 1},
                    }
                },
            ]
            results = await Job.get_pymongo_collection().aggregate(pipeline).to_list(length=1000)

            by_status: Dict[str, int] = {}
            total = 0
            for row in results:
                s = row["_id"]
                c = row["count"]
                by_status[s] = c
                total += c

            return {
                "total": total,
                "by_status": by_status,
                "applied": by_status.get("applied", 0),
                "interview": by_status.get("interviewing", 0),
                "offer": by_status.get("offered", 0),
                "rejected": by_status.get("rejected", 0),
            }
        except Exception as e:
            logger.exception(f"Error getting job stats for user {user_id}")
            raise DatabaseError("Failed to get job statistics") from e

    async def search_by_user(
        self, user_id: str, query: str, skip: int = 0, limit: int = 100
    ) -> List[Job]:
        """Search jobs by title or company for a specific user."""
        try:
            user_oid = PydanticObjectId(user_id)
            search_query = Job.find(
                Job.user_id == user_oid,
                Or(RegEx(Job.title, query, "i"), RegEx(Job.company, query, "i")),
            )
            return (
                await search_query.sort("-created_at").skip(skip).limit(limit).to_list()
            )
        except Exception as e:
            logger.error(f"Error searching user jobs: {str(e)}")
            raise DatabaseError("Failed to search jobs") from e
