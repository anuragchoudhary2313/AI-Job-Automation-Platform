"""
Job service for job-related business logic.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
import os

from app.core.exceptions import AuthorizationError
from app.core.logging import get_logger
from app.core.cache import cache
from app.core.pagination import create_offset_paginated_response
from app.core.features import features
from app.repositories.job import JobRepository
from app.repositories.resume import ResumeRepository
from app.models.job import Job
from app.models.user import User
from app.models.enums import JobStatus
from app.schemas.job import JobCreate, JobUpdate, JobCreateResponse
from app.services.email_scraper import email_scraper
from app.email.sender import email_sender

logger = get_logger(__name__)


class JobService:
    """Service for job operations."""

    STATS_CACHE_TTL_SECONDS = 60

    def __init__(self, job_repo: JobRepository, resume_repo: Optional[ResumeRepository] = None) -> None:
        """Initialize job service."""
        self.job_repo = job_repo
        self.resume_repo = resume_repo or ResumeRepository()

    @staticmethod
    def _status_value(status: Any) -> str:
        if isinstance(status, JobStatus):
            return status.value
        if hasattr(status, "value"):
            return str(status.value)
        return str(status or "").lower()

    async def _auto_email_after_apply(self, job: Job, user: User) -> None:
        """Attempt to auto-email HR/recruiter when a job is marked as applied.

        This must never break the primary update flow.
        """
        if not features.is_enabled("email_automation"):
            return

        try:
            recipient_email = (job.hr_email or "").strip()

            if not recipient_email:
                hr_result = await email_scraper.scrape_hr_emails(company=job.company, domain=None)
                emails = hr_result.get("emails") or []
                if emails:
                    recipient_email = emails[0]
                    try:
                        await self.job_repo.update(job.id, hr_email=recipient_email, updated_at=datetime.utcnow())
                    except Exception:
                        logger.warning(f"Could not persist scraped HR email for job {job.id}")

            if not recipient_email:
                logger.info(f"Auto-email skipped for job {job.id}: no HR/recruiter email found")
                return

            candidate_name = (user.full_name or user.username or "Candidate").strip() or "Candidate"
            skills = "Software development, problem solving, collaboration"
            portfolio_link = ""
            attachments: List[str] = []

            try:
                resumes = await self.resume_repo.get_by_user(str(user.id), skip=0, limit=1)
                if resumes:
                    latest_resume = resumes[0]
                    parsed_data = latest_resume.parsed_data or {}
                    parsed_skills = parsed_data.get("skills")
                    if isinstance(parsed_skills, list) and parsed_skills:
                        skills = ", ".join(str(s) for s in parsed_skills[:10])

                    personal_info = parsed_data.get("personal_info") or {}
                    links = personal_info.get("links")
                    if isinstance(links, list) and links:
                        portfolio_link = str(links[0])

                    if latest_resume.file_path and os.path.exists(latest_resume.file_path):
                        attachments.append(latest_resume.file_path)
            except Exception:
                logger.warning(f"Could not enrich auto-email from resume for user {user.id}")

            context = {
                "company_name": job.company,
                "job_role": job.title,
                "candidate_name": candidate_name,
                "skills": skills,
                "portfolio_link": portfolio_link or "N/A",
            }

            try:
                html_body = email_sender.render_template("hr_initial_email.html", context)
            except Exception:
                html_body = (
                    f"<p>Dear Hiring Team at <strong>{job.company}</strong>,</p>"
                    f"<p>I am interested in the <strong>{job.title}</strong> role.</p>"
                    f"<p>Candidate: <strong>{candidate_name}</strong></p>"
                    f"<p>Skills: {skills}</p>"
                    f"<p>Portfolio: {portfolio_link or 'N/A'}</p>"
                    "<p>Thank you for your time and consideration.</p>"
                )

            sent = await email_sender.send_email(
                to_email=recipient_email,
                subject=f"Application for {job.title} - {candidate_name}",
                html_body=html_body,
                attachments=attachments or None,
            )

            if sent:
                logger.info(f"Auto-email sent for applied job {job.id} to {recipient_email}")
            else:
                logger.warning(f"Auto-email not sent for job {job.id}; sender returned False")
        except Exception as e:
            logger.error(f"Auto-email failed for applied job {job.id}: {e}")

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
        previous_status = self._status_value(job.status)

        # Update job
        update_data = job_data.dict(exclude_unset=True)
        next_status = self._status_value(update_data.get("status", job.status))
        if previous_status != JobStatus.APPLIED.value and next_status == JobStatus.APPLIED.value:
            update_data.setdefault("applied_at", datetime.utcnow())
        update_data["updated_at"] = datetime.utcnow()

        updated_job = await self.job_repo.update(job_id, **update_data)

        if previous_status != JobStatus.APPLIED.value and next_status == JobStatus.APPLIED.value:
            # Fire-and-forget: email flow should never block or fail the status update.
            asyncio.create_task(self._auto_email_after_apply(updated_job, user))

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
