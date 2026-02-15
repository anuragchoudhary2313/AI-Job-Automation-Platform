import logging
import asyncio
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.logging import get_logger
from app.core.features import features
from app.scheduler.job_wrapper import with_execution_lock
from app.services.job_scraper import job_scraper_service
from app.services.bot import run_job_automation
from app.models.job import Job, JobStatus
from app.models.log import Log
from app.notifications.telegram import telegram_service

logger = get_logger(__name__)

@with_execution_lock("scrape_jobs", timeout_seconds=600)
async def scrape_jobs_task():
    """
    Periodic task to scrape jobs.
    """
    if not features.is_enabled("job_scraping"):
        logger.debug("Skipping scrape_jobs_task (Feature Disabled)")
        return

    logger.info("🕒 Starting scheduled job: Scrape Jobs")
    try:
        # Defined keywords/locations can be moved to DB settings later
        # For now, running a default set
        await job_scraper_service.scrape_jobs(keyword="Python Developer", location="Remote", limit=5)
            
        logger.info("✅ Scheduled job finished: Scrape Jobs")
    except Exception as e:
        logger.error(f"❌ Scheduled job failed: Scrape Jobs - {e}")

@with_execution_lock("check_follow_ups", timeout_seconds=300)
async def check_follow_ups_task():
    """
    Periodic task to check for jobs applied > 3 days ago and alert for follow-up.
    """
    logger.info("🕒 Starting scheduled job: Check Follow-ups")
    try:
        # Configurable follow-up delay (default 3 days)
        FOLLOW_UP_DAYS = 3
        cutoff_date = datetime.now() - timedelta(days=FOLLOW_UP_DAYS)
        
        # Query jobs that are APPLIED and applied_at < cutoff_date
        jobs_needing_followup = await Job.find(
            Job.status == JobStatus.APPLIED,
            Job.applied_at < cutoff_date
        ).to_list()
        
        if not jobs_needing_followup:
            logger.info("No jobs need follow-up today.")
            return

        logger.info(f"Found {len(jobs_needing_followup)} jobs needing follow-up.")
        
        for job in jobs_needing_followup:
            days_since = (datetime.now() - job.applied_at).days if job.applied_at else 0
            
            message = (
                f"⏳ <b>Follow-up Recommended</b>\n"
                f"<b>Role:</b> {job.title}\n"
                f"<b>Company:</b> {job.company}\n"
                f"<b>Applied:</b> {days_since} days ago\n"
                f"It might be time to send a polite follow-up email."
            )
            
            await telegram_service.send_alert(message)
            
            # TODO: Mark as alerted to avoid daily spam? 
            
        logger.info("✅ Scheduled job finished: Check Follow-ups")
    except Exception as e:
        logger.error(f"❌ Scheduled job failed: Check Follow-ups - {e}", exc_info=True)

@with_execution_lock("cleanup_logs", timeout_seconds=180)
async def cleanup_old_logs_task():
    """Cleanup logs older than 30 days."""
    try:
        logger.info("Starting log cleanup...")
        
        cutoff_date = datetime.now() - timedelta(days=30)
        
        result = await Log.find(Log.created_at < cutoff_date).delete()
        
        logger.info(f"Deleted {result.deleted_count} old log entries")
            
    except Exception as e:
        logger.error(f"Log cleanup failed: {e}", exc_info=True)

async def run_job_automation_task():
    """
    Wrapper for job automation with error handling.
    """
    try:
        logger.info("Starting scheduled job automation...")
        
        # Run with timeout
        await asyncio.wait_for(
            run_job_automation(),
            timeout=3600  # 1 hour timeout
        )
        
        logger.info("Scheduled job automation completed successfully")
        
    except asyncio.TimeoutError:
        logger.error("Job automation timed out after 1 hour")
    except Exception as e:
        logger.error(f"Job automation failed: {e}", exc_info=True)
