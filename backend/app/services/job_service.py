"""
Job service for job-related business logic.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.exceptions import AuthorizationError
from app.core.logging import get_logger
from app.core.cache import cache
from app.core.pagination import create_offset_paginated_response
from app.repositories.job import JobRepository
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobCreateResponse

logger = get_logger(__name__)


class JobService:
    """Service for job operations."""

    STATS_CACHE_TTL_SECONDS = 60

    def __init__(self, job_repo: JobRepository) -> None:
        """Initialize job service."""
        self.job_repo = job_repo

    @staticmethod
    def _stats_cache_key(user_id: str) -> str:
        return f"jobs:stats:{user_id}"

    @staticmethod
    def _normalize_stats(raw_stats: Dict[str, Any]) -> Dict[str, Any]:
        by_status = raw_stats.get("by_status") or {}

        applied = int(by_status.get("applied", 0))
        interviewing = int(by_status.get("interviewing", 0))
        offered = int(by_status.get("offered", 0))
        rejected = int(by_status.get("rejected", 0))
        pending = int(by_status.get("pending", 0))
        failed = int(by_status.get("failed", 0))
        total = int(raw_stats.get("total", 0))

        return {
            "total": total,
            "by_status": by_status,
            "applied": applied,
            "interview": interviewing,
            "offer": offered,
            "rejected": rejected,
            "pending": pending,
            "failed": failed,
        }

    @staticmethod
    def build_dashboard_stats(stats: Dict[str, Any]) -> Dict[str, Any]:
        total_jobs = int(stats.get("total", 0))
        applied = int(stats.get("applied", 0))
        interview = int(stats.get("interview", 0))
        offer = int(stats.get("offer", 0))
        rejected = int(stats.get("rejected", 0))
        pending = int(stats.get("pending", 0))

        shortlisted = interview + offer
        success_rate = round((shortlisted / total_jobs) * 100, 1) if total_jobs > 0 else 0.0

        distribution = [
            {"name": "Pending", "value": pending},
            {"name": "Applied", "value": applied},
            {"name": "Interview", "value": interview},
            {"name": "Offer", "value": offer},
            {"name": "Rejected", "value": rejected},
        ]

        return {
            "total_applied": total_jobs,
            "emailed": applied,
            "shortlisted": shortlisted,
            "rejected": rejected,
            "success_rate": success_rate,
            "daily_activity": [],
            "status_distribution": [d for d in distribution if d["value"] > 0],
        }

    async def _invalidate_stats_cache(self, user_id: str) -> None:
        await cache.delete(self._stats_cache_key(user_id))

    async def get_job(self, job_id: str, user: User) -> Job:
        """Get job by ID with authorization check."""
        job = await self.job_repo.get_or_404(job_id)

        if str(job.user_id) != str(user.id):
            logger.info(
                f"Authorization failed - job user_id '{job.user_id}' != user id '{user.id}'"
            )
            raise AuthorizationError("You don't have access to this job")

        return job

    async def get_jobs(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = None,
    ) -> List[Job]:
        """Get jobs for current user with optional filters."""
        jobs = await self.job_repo.get_by_user(
            user_id=str(user.id),
            skip=skip,
            limit=limit,
            status=status,
            search=search,
            sort=sort,
        )
        logger.info(f"Retrieved {len(jobs)} jobs for user {user.id}")
        return jobs

    async def get_jobs_paginated(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        items, total = await self.job_repo.get_by_user_with_total(
            user_id=str(user.id),
            skip=skip,
            limit=limit,
            status=status,
            search=search,
            sort=sort,
        )
        return create_offset_paginated_response(items, total, skip, limit).model_dump()

    async def create_job(self, job_data: JobCreate, user: User) -> tuple[Job, bool]:
        """Create a new job, rejecting duplicates by URL per user.

        Returns:
            tuple: (job, created) where created is True if newly created, False if already existed
        """
        # Deduplication: if a job_url is provided, check if it already exists for this user.
        if job_data.job_url:
            existing = await self.job_repo.get_by_url_and_user(
                job_url=job_data.job_url,
                user_id=str(user.id),
            )
            if existing:
                logger.info(
                    f"Duplicate job URL {job_data.job_url} for user {user.id}, returning existing"
                )
                return existing, False  # Return existing job and False for created

        job = await self.job_repo.create(
            title=job_data.title,
            company=job_data.company,
            location=job_data.location,
            description=job_data.description,
            job_url=job_data.job_url,
            salary_range=job_data.salary_range,
            status=job_data.status or "pending",
            user_id=str(user.id),
        )

        logger.info(f"Created job {job.id} for user {user.id}")
        await self._invalidate_stats_cache(str(user.id))
        return job, True  # Return new job and True for created

    async def create_job_with_response(self, job_data: JobCreate, user: User) -> JobCreateResponse:
        """Create a new job and return structured response indicating if it was created or existed."""
        job, created = await self.create_job(job_data, user)

        if created:
            message = "Job successfully added to your applications!"
        else:
            message = "Job already exists in your applications!"

        return JobCreateResponse(
            job=job,
            created=created,
            message=message
        )

    async def update_job(self, job_id: str, job_data: JobUpdate, user: User) -> Job:
        """Update a job."""
        # Check authorization
        job = await self.get_job(job_id, user)

        # Update job
        update_data = job_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        updated_job = await self.job_repo.update(job_id, **update_data)

        logger.info(f"Updated job {job_id}")
        await self._invalidate_stats_cache(str(user.id))
        return updated_job

    async def delete_job(self, job_id: str, user: User) -> bool:
        """Delete a job."""
        # Check authorization
        await self.get_job(job_id, user)

        # Delete job
        result = await self.job_repo.delete(job_id)

        logger.info(f"Deleted job {job_id}")
        await self._invalidate_stats_cache(str(user.id))
        return result

    async def search_jobs(
        self, query: str, user: User, skip: int = 0, limit: int = 100
    ) -> List[Job]:
        """Search jobs by title or company."""
        jobs = await self.job_repo.search_by_user(
            user_id=str(user.id), query=query, skip=skip, limit=limit
        )
        logger.info(f"Found {len(jobs)} jobs matching '{query}' for user")
        return jobs

    async def get_job_stats(self, user: User) -> Dict[str, Any]:
        """Get job statistics for current user."""
        cache_key = self._stats_cache_key(str(user.id))
        cached_stats = await cache.get(cache_key)
        if isinstance(cached_stats, dict):
            return cached_stats

        raw_stats = await self.job_repo.get_stats_by_user(str(user.id))
        stats = self._normalize_stats(raw_stats)
        await cache.set(cache_key, stats, expire=self.STATS_CACHE_TTL_SECONDS)
        logger.info(f"Retrieved job stats for user {user.id}")
        return stats

    async def update_job_status(self, job_id: str, status: str, user: User) -> Job:
        """Update job status."""
        # Check authorization
        await self.get_job(job_id, user)

        # Update status
        job = await self.job_repo.update_status(job_id, status)

        logger.info(f"Updated job {job_id} status to {status}")
        await self._invalidate_stats_cache(str(user.id))
        return job
