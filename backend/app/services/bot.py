"""
Bot automation service with retry logic and fault tolerance.
"""
import logging
import asyncio
from typing import List, Dict, Any

from app.core.logging import get_logger

logger = get_logger(__name__)

from app.models.job import Job, JobStatus
from app.models.user import User
from app.services.email import email_service
from app.repositories.resume import ResumeRepository
from app.services.resume_service import ResumeService
from app.services.match_service import MatchService
from app.repositories.match import MatchRepository
from app.models.automation import AutomationRun
from app.models.automation_event import AutomationEvent
from app.models.automation_dead_letter import AutomationDeadLetter
from app.core.retry import async_retry_with_backoff, timeout
from app.services.ai_service import ai_service
from app.services.automation_policy_service import automation_policy_service

# Instantiate dependencies
resume_repo = ResumeRepository()
resume_service = ResumeService(resume_repo)
match_repo = MatchRepository()
match_service = MatchService(match_repo)


class BotService:
    """Bot automation service with fault tolerance."""

    ATS_AUTO_APPLY_MIN_SCORE = 78

    async def _log_event(
        self,
        *,
        user_id: str,
        stage: str,
        action: str,
        company: str | None = None,
        role: str | None = None,
        reason: str | None = None,
        ats_score: int | None = None,
        passes_gate: bool | None = None,
        metadata: Dict[str, Any] | None = None,
    ) -> None:
        try:
            await AutomationEvent(
                user_id=str(user_id),
                source="bot_service",
                stage=stage,
                company=company,
                role=role,
                action=action,
                reason=reason,
                ats_score=ats_score,
                passes_gate=passes_gate,
                metadata=metadata or {},
            ).insert()
        except Exception as e:
            logger.warning(f"Failed to persist bot automation event: {e}")
    
    @timeout(3600)  # 1 hour timeout for entire automation
    async def run_job_automation(self, user_id: str) -> Dict[str, Any]:
        """
        Run job automation for a user.
        """
        results = {
            'jobs_processed': 0,
            'jobs_applied': 0,
            'errors': []
        }
        
        try:
            logger.info(f"Starting job automation for user {user_id}")
            
            # Fetch user first
            user = await User.get(user_id)
            if not user:
                logger.warning(f"No user found for {user_id}")
                return results

            # Get user's primary resume
            resumes = await resume_service.get_user_resumes(user=user)
            if not resumes:
                logger.warning(f"No resumes found for {user_id}")
                return results
                
            resume = resumes[0] # Use most recent
            
            # Create automation run record with required resume_id
            run = await AutomationRun(
                user_id=user_id,
                resume_id=resume.id,
                status="running",
                applied_jobs=[],
                applied_count=0
            ).insert()
            
            # Get pending jobs
            jobs = await self._get_pending_jobs(user_id)
            results['jobs_processed'] = len(jobs)
            
            # Process each job with individual timeout
            for job in jobs:
                try:
                    # Check match score before applying
                    match = await match_service.match_resume_with_job(resume, job)
                    if match.match_score < 0.5:
                        logger.info(f"Skipping job {job.id} due to low match score: {match.match_score}")
                        await self._log_event(
                            user_id=user_id,
                            stage="match_gate",
                            action="skip",
                            company=job.company,
                            role=job.title,
                            reason="Match score below threshold",
                            metadata={"match_score": match.match_score, "threshold": 0.5},
                        )
                        continue

                    policy_allowed, policy_reason, policy_meta = await automation_policy_service.evaluate(
                        user_id=str(user_id),
                        company=job.company,
                        role=job.title,
                    )
                    if not policy_allowed:
                        logger.info(f"Skipping job {job.id} due to policy gate: {policy_reason}")
                        await self._log_event(
                            user_id=user_id,
                            stage="policy_gate",
                            action="skip",
                            company=job.company,
                            role=job.title,
                            reason=policy_reason,
                            metadata=policy_meta,
                        )
                        continue

                    # ATS quality gate before auto-apply (prevents low-quality submissions).
                    ats_allowed, ats_meta = await self._ats_gate_allows_apply(
                        job_description=job.description,
                        base_resume_text=resume.content or "",
                    )
                    if not ats_allowed:
                        logger.info(
                            f"Skipping job {job.id} due to ATS gate. "
                            f"score={ats_meta.get('ats_score')} pass={ats_meta.get('passes_auto_gate')}"
                        )
                        await self._log_event(
                            user_id=user_id,
                            stage="ats_gate",
                            action="skip",
                            company=job.company,
                            role=job.title,
                            reason="ATS gate failed",
                            ats_score=int(ats_meta.get("ats_score", 0)),
                            passes_gate=bool(ats_meta.get("passes_auto_gate")),
                            metadata={"threshold": self.ATS_AUTO_APPLY_MIN_SCORE},
                        )
                        continue
                        
                    await self._process_job_safe(job, user_id)
                    await self._log_event(
                        user_id=user_id,
                        stage="apply",
                        action="applied",
                        company=job.company,
                        role=job.title,
                        reason="Bot auto-apply completed",
                    )
                    results['jobs_applied'] += 1
                    run.applied_jobs.append(str(job.id))
                    run.applied_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to process job {job.id}: {e}")
                    try:
                        await AutomationDeadLetter(
                            user_id=str(user_id),
                            source="bot_service",
                            stage="process_job",
                            task_name="process_job",
                            error_message=str(e),
                            payload={
                                "job_id": str(job.id),
                                "company": job.company,
                                "role": job.title,
                            },
                            metadata={"handler": "run_job_automation_loop"},
                            retry_count=0,
                            status="open",
                        ).insert()
                    except Exception as dlq_err:
                        logger.warning(f"Failed to persist bot job dead letter: {dlq_err}")
                    await self._log_event(
                        user_id=user_id,
                        stage="apply",
                        action="error",
                        company=job.company,
                        role=job.title,
                        reason="Job processing failed",
                        metadata={"error": str(e)},
                    )
                    results['errors'].append({
                        'job_id': str(job.id),
                        'error': str(e)
                    })
            
            run.status = "completed"
            await run.save()
            
            logger.info(
                f"Job automation completed: {results['jobs_applied']}/{results['jobs_processed']} jobs applied"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Job automation failed: {e}", exc_info=True)
            try:
                await AutomationDeadLetter(
                    user_id=str(user_id),
                    source="bot_service",
                    stage="run_job_automation",
                    task_name="run_job_automation",
                    error_message=str(e),
                    payload={"user_id": str(user_id)},
                    metadata={"handler": "run_job_automation"},
                    retry_count=0,
                    status="open",
                ).insert()
            except Exception as dlq_err:
                logger.warning(f"Failed to persist bot dead letter: {dlq_err}")
            if 'run' in locals():
                run.status = "failed"
                await run.save()
            raise

    async def _ats_gate_allows_apply(self, job_description: str, base_resume_text: str) -> tuple[bool, Dict[str, Any]]:
        """Return whether ATS quality gate allows auto-apply for this job."""
        try:
            latex_resume = await ai_service.generate_latex_resume(
                job_description=job_description,
                resume_text=base_resume_text or None,
            )
            assessment = ai_service.score_latex_resume(job_description, latex_resume)
            allowed = bool(assessment.get("passes_auto_gate")) and int(assessment.get("ats_score", 0)) >= self.ATS_AUTO_APPLY_MIN_SCORE
            return allowed, assessment
        except Exception as e:
            logger.warning(f"ATS gate fallback deny due to scoring error: {e}")
            return False, {"ats_score": 0, "passes_auto_gate": False, "error": str(e)}
    
    async def _get_pending_jobs(self, user_id: str) -> List[Job]:
        """Get pending jobs for user."""
        from beanie import PydanticObjectId
        # Beanie query - user_id must be PydanticObjectId for exact match
        return await Job.find(
            Job.user_id == PydanticObjectId(user_id),
            Job.status == JobStatus.PENDING
        ).limit(10).to_list()
    
    @timeout(600)  # 10 minute timeout per job
    async def _process_job_safe(self, job: Job, user_id: str):
        """
        Process single job with timeout and error handling.
        """
        try:
            # Get user profile
            user = await User.get(user_id)
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Generate resume with retry
            resume_content = await self._generate_resume_with_retry(
                job.description,
                user
            )
            
            # Send application email with retry
            await self._send_application_email_with_retry(
                job,
                user,
                resume_content
            )
            
            # Update job status
            job.status = JobStatus.APPLIED
            await job.save()
            
            logger.info(f"Successfully processed job {job.id}")
            
        except Exception as e:
            logger.error(f"Failed to process job {job.id}: {e}", exc_info=True)
            job.status = JobStatus.FAILED
            await job.save()
            raise
    
    @async_retry_with_backoff(
        max_retries=3,
        initial_delay=2.0,
        max_delay=30.0
    )
    async def _generate_resume_with_retry(
        self,
        job_description: str,
        user: User
    ) -> str:
        """Generate resume with retry logic."""
        # Mocking user profile data extraction
        user_profile = {
            'name': user.username,
            'email': user.email,
            # 'skills': user.skills if hasattr(user, 'skills') else [], 
            # 'experience': user.experience if hasattr(user, 'experience') else '', 
            # 'education': user.education if hasattr(user, 'education') else ''
        }
        
        # NOTE: resume_service.generate_resume is NOT defined in ResumeService I refactored!
        # It was probably in the old service or I missed it.
        # I checked ResumeService in step 584, it has 'create_resume' (DB) but no AI generation.
        # AI generation is in 'ai_service.py' (see step 588).
        # BotService should use AIService for generation.
        
        return await ai_service.generate_resume_content(job_description)

    
    @async_retry_with_backoff(
        max_retries=3,
        initial_delay=2.0,
        max_delay=30.0
    )
    async def _send_application_email_with_retry(
        self,
        job: Job,
        user: User,
        resume_content: str
    ):
        """Send application email with retry logic."""
        subject = f"Application for {job.title} at {job.company}"
        body = f"""
Dear Hiring Manager,

I am writing to express my interest in the {job.title} position at {job.company}.

Please find my resume attached.

Best regards,
{user.username}
"""
        
        # Save resume to temp file
        import tempfile
        import os
        
        fd, resume_path = tempfile.mkstemp(suffix='.txt')
        try:
            with os.fdopen(fd, 'w') as f:
                f.write(resume_content)
            
            await email_service.send_email_async(
                to_email=job.hr_email or 'hr@example.com',
                subject=subject,
                body=body,
                attachments=[resume_path]
            )
        finally:
            # Cleanup temp file
            try:
                os.unlink(resume_path)
            except Exception:
                pass


# Singleton instance
bot_service = BotService()


async def run_job_automation():
    """
    Global function to run job automation for all users.
    Called by scheduler.
    """
    # Get all active users
    users = await User.find(User.is_active == True).to_list()
    
    logger.info(f"Running automation for {len(users)} users")
    
    # Process users concurrently with limit
    semaphore = asyncio.Semaphore(5)  # Max 5 concurrent users
    
    async def process_user(user: User):
        async with semaphore:
            try:
                await bot_service.run_job_automation(str(user.id))
            except Exception as e:
                logger.error(f"Automation failed for user {user.id}: {e}")
    
    await asyncio.gather(
        *[process_user(user) for user in users],
        return_exceptions=True
    )
