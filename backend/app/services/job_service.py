"""
Job service for job-related business logic.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.exceptions import AuthorizationError
from app.core.logging import get_logger
from app.repositories.job import JobRepository
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobCreateResponse

logger = get_logger(__name__)


class JobService:
    """Service for job operations."""

    def __init__(self, job_repo: JobRepository) -> None:
        """Initialize job service."""
        self.job_repo = job_repo

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
        logger.info(f"Retrieved {len(jobs)} jobs for user {user.id}")
        return jobs

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
        return updated_job

    async def delete_job(self, job_id: str, user: User) -> bool:
        """Delete a job."""
        # Check authorization
        await self.get_job(job_id, user)

        # Delete job
        result = await self.job_repo.delete(job_id)

        logger.info(f"Deleted job {job_id}")
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
        stats = await self.job_repo.get_stats_by_user(str(user.id))
        logger.info(f"Retrieved job stats for user {user.id}")
        return stats

    async def update_job_status(self, job_id: str, status: str, user: User) -> Job:
        """Update job status."""
        # Check authorization
        await self.get_job(job_id, user)

        # Update status
        job = await self.job_repo.update_status(job_id, status)

        logger.info(f"Updated job {job_id} status to {status}")
        return job
