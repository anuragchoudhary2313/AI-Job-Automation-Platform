from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from app.core.config import settings
from .jobs import scrape_jobs_task, check_follow_ups_task, cleanup_old_logs_task, run_job_automation_task
import pytz
import logging
import threading
from typing import Dict
from datetime import datetime

logger = logging.getLogger(__name__)

class SchedulerManager:
    def __init__(self):
        self.scheduler = None
        self.timezone = pytz.timezone(settings.SCHEDULER_TIMEZONE)
        # Execution locks to prevent concurrent runs
        self.job_locks: Dict[str, threading.Lock] = {}
        # Track running jobs for monitoring
        self.running_jobs: Dict[str, datetime] = {}

    def start(self):
        if not settings.SCHEDULER_ENABLED:
            logger.info("Scheduler is DISABLED by configuration.")
            return

        if self.scheduler and self.scheduler.running:
            logger.warning("Scheduler is already running.")
            return

        self.scheduler = AsyncIOScheduler(timezone=self.timezone)
        
        # --- Add Jobs Here ---
        
        # 1. Job Scraping (Every 6 hours)
        self.scheduler.add_job(
            scrape_jobs_task,
            trigger=IntervalTrigger(hours=6),
            id="scrape_jobs",
            replace_existing=True,
            name="Scrape Jobs (Every 6 hours)"
        )
        
        # 2. Automation (Every 1 hour)
        self.scheduler.add_job(
            run_job_automation_task,
            trigger=IntervalTrigger(hours=1),
            id="job_automation",
            replace_existing=True,
            name="Job Automation (Every 1 hour)"
        )
        
        # 3. Follow-up Emails (Daily at 10 AM)
        self.scheduler.add_job(
            check_follow_ups_task,
            trigger=CronTrigger(hour=10, minute=0, timezone=self.timezone),
            id="check_follow_ups",
            replace_existing=True,
            name="Check Follow-up Emails (Daily 10 AM)"
        )
        
        # 4. Log Cleanup (Daily at 2 AM)
        self.scheduler.add_job(
            cleanup_old_logs_task,
            trigger=CronTrigger(hour=2, minute=0, timezone=self.timezone),
            id="cleanup_logs",
            replace_existing=True,
            name="Cleanup Logs (Daily 2 AM)"
        )

        self.scheduler.start()
        logger.info(f"Scheduler started with timezone {self.timezone}")

    def stop(self):
        if self.scheduler and self.scheduler.running:
            self.scheduler.shutdown()
            self.scheduler = None
            logger.info("Scheduler shut down.")
            
    def get_scheduler(self):
        return self.scheduler

scheduler_manager = SchedulerManager()

# Helper functions for main.py integration
def start_scheduler():
    scheduler_manager.start()

def shutdown_scheduler():
    scheduler_manager.stop()
    
def get_scheduler():
    return scheduler_manager.get_scheduler()
