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
from app.schemas.job import JobCreate, JobUpdate

logger = get_logger(__name__)


class JobService:
    """Service for job operations."""
    
    def __init__(self, job_repo: JobRepository) -> None:
        """Initialize job service."""
        self.job_repo = job_repo
    
    async def get_job(self, job_id: str, user: User) -> Job:
        """Get job by ID with authorization check."""
        job = await self.job_repo.get_or_404(job_id)
        
        # Check authorization
        # Convert user.team_id (if str) to match job.team_id (str)
        if job.team_id != str(user.team_id):
            raise AuthorizationError("You don't have access to this job")
        
        return job
    
    async def get_jobs(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = None
    ) -> List[Job]:
        """Get jobs for user's team."""
        jobs = await self.job_repo.get_by_team(
            team_id=str(user.team_id),
            skip=skip,
            limit=limit,
            status=status,
            search=search,
            sort=sort
        )
        
        logger.info(f"Retrieved {len(jobs)} jobs for team {user.team_id}")
        return jobs
    
    async def create_job(self, job_data: JobCreate, user: User) -> Job:
        """Create a new job."""
        
        job = await self.job_repo.create(
            title=job_data.title,
            company=job_data.company,
            location=job_data.location,
            description=job_data.description,
            job_url=job_data.job_url,
            salary_range=job_data.salary_range,
            status=job_data.status or "pending",
            team_id=str(user.team_id),
            user_id=str(user.id),
            # source=job_data.source, # JobCreate might not have source if not in schema? Checking schema...
            # JobCreate schema has fields from JobBase.
            # Base has no source. My Beanie model has source? 
            # Plan said `source` in Job model.
            # Schema `JobBase` in `schemas/job.py` does NOT have source. 
            # I should verify schema. Viewed step 464.
            # JobBase: title, company, description, location, salary_range, job_url, hr_email, status.
            # No `source`, no `skills_required`.
            # I'll stick to schema fields.
        )
        
        logger.info(f"Created job {job.id} for team {user.team_id}")
        return job
    
    async def update_job(
        self,
        job_id: str,
        job_data: JobUpdate,
        user: User
    ) -> Job:
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
        self,
        query: str,
        user: User,
        skip: int = 0,
        limit: int = 100
    ) -> List[Job]:
        """Search jobs by title or company."""
        jobs = await self.job_repo.search(
            team_id=str(user.team_id),
            query=query,
            skip=skip,
            limit=limit
        )
        
        logger.info(f"Found {len(jobs)} jobs matching '{query}'")
        return jobs
    
    async def get_job_stats(self, user: User) -> Dict[str, Any]:
        """Get job statistics for user's team."""
        stats = await self.job_repo.get_stats_by_team(str(user.team_id))
        
        logger.info(f"Retrieved job stats for team {user.team_id}")
        return stats
    
    async def update_job_status(
        self,
        job_id: str,
        status: str,
        user: User
    ) -> Job:
        """Update job status."""
        # Check authorization
        await self.get_job(job_id, user)
        
        # Update status
        job = await self.job_repo.update_status(job_id, status)
        
        logger.info(f"Updated job {job_id} status to {status}")
        return job
