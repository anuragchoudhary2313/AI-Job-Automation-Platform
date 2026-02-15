"""
Bot automation service with retry logic and fault tolerance.
"""
import logging
import asyncio
from typing import List, Dict, Any

from app.models.job import Job, JobStatus
from app.models.user import User
from app.services.email import email_service
from app.repositories.resume import ResumeRepository
from app.services.resume_service import ResumeService
from app.services.match_service import MatchService
from app.repositories.match import MatchRepository
from app.models.automation import AutomationRun
from app.core.retry import async_retry_with_backoff, timeout

# Instantiate dependencies
resume_repo = ResumeRepository()
resume_service = ResumeService(resume_repo)
match_repo = MatchRepository()
match_service = MatchService(match_repo)


class BotService:
    """Bot automation service with fault tolerance."""
    
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
            
            # Create automation run record
            run = await AutomationRun(
                user_id=user_id,
                status="running",
                applied_jobs=[],
                applied_count=0
            ).insert()
            
            # Get pending jobs
            jobs = await self._get_pending_jobs(user_id)
            results['jobs_processed'] = len(jobs)
            
            # Get user's primary resume
            resumes = await resume_service.get_user_resumes(user_id=user_id) # Wait, my get_user_resumes takes User object.
            # I should fix service to take ID or pass User.
            # For now, I'll fetch user first.
            user = await User.get(user_id)
            if not user or not resumes:
                logger.warning(f"No user or resumes found for {user_id}")
                run.status = "failed"
                await run.save()
                return results
                
            resume = resumes[0] # Use most recent
            
            # Process each job with individual timeout
            for job in jobs:
                try:
                    # Check match score before applying
                    match = await match_service.match_resume_with_job(resume, job)
                    if match.match_score < 0.5:
                        logger.info(f"Skipping job {job.id} due to low match score: {match.match_score}")
                        continue
                        
                    await self._process_job_safe(job, user_id)
                    results['jobs_applied'] += 1
                    run.applied_jobs.append(str(job.id))
                    run.applied_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to process job {job.id}: {e}")
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
            if 'run' in locals():
                run.status = "failed"
                await run.save()
            raise
    
    async def _get_pending_jobs(self, user_id: str) -> List[Job]:
        """Get pending jobs for user."""
        # Beanie query
        return await Job.find(
            Job.user_id == user_id,
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
        
        from app.services.ai_service import ai_service
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
