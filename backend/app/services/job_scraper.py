import logging
import asyncio
from app.core.cache import cache

from app.models.job import ScrapedJob, JobStatus
from app.automation.browser import BrowserManager
from app.automation.scrapers.linkedin import LinkedInScraper
from app.notifications.telegram import telegram_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class JobScraperService:
    def __init__(self):
        self.browser_manager = BrowserManager()
        
    async def scrape_jobs(self, keyword: str, location: str, limit: int = 10, user_id: str = None):
        if not getattr(settings, "JOB_SCRAPING_ENABLED", False):
            logger.warning("Job scraping is disabled by feature flag.")
            return {"message": "Scraping disabled"}

        logger.info(f"Starting scrape for {keyword} in {location}")
        
        from app.services.socket_manager import manager
        from datetime import datetime
        
        async def send_progress(msg: str, type: str = "scraping"):
            if user_id:
                await manager.send_to_user(user_id, {
                    "type": "activity",
                    "data": {
                        "activityType": type,
                        "title": "Job Scraper",
                        "description": msg
                    },
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                })

        try:
            await send_progress(f"Launching browser agent for {keyword}...")
            page = await self.browser_manager.launch()
            scraper = LinkedInScraper(page)
            
            # Login (if cookies exist)
            await send_progress("Checking LinkedIn session...")
            await scraper.login()
            
            # Scrape
            await send_progress(f"Searching LinkedIn for {keyword} in {location}...")
            jobs_data = await scraper.scrape_jobs(keyword, location, limit)
            
            new_jobs_count = 0
            for job_data in jobs_data:
                # Check duplicates
                existing = await ScrapedJob.find_one(ScrapedJob.link == job_data["link"])
                
                if not existing:
                    new_job = ScrapedJob(**job_data)
                    await new_job.insert()
                    new_jobs_count += 1
                    
                    # Alert for new job - Non-blocking
                    alert_msg = (
                        f"🎯 <b>New Job Found</b>\n"
                        f"<b>Role:</b> {new_job.title}\n"
                        f"<b>Company:</b> {new_job.company}\n"
                        f"<b>Location:</b> {new_job.location}\n"
                        f"<a href='{new_job.link}'>Apply Now</a>"
                    )
                    asyncio.create_task(telegram_service.send_alert(alert_msg))
                else:
                    # Refresh timestamp for recurring jobs so they remain visible
                    # in the recent scraped-jobs portal window.
                    existing.created_at = datetime.utcnow()
                    await existing.save()
            
            logger.info(f"Scraping completed. Found {len(jobs_data)} jobs, {new_jobs_count} new.")
            await cache.clear_pattern("jobs:scraped:*")
            await send_progress(f"Scraping complete! Found {len(jobs_data)} jobs.", type="success")
            return {"total": len(jobs_data), "new": new_jobs_count}

        except Exception as e:
            error_details = str(e) or e.__class__.__name__
            if isinstance(e, NotImplementedError) and __import__("sys").platform == "win32":
                logger.warning("Playwright threading failed on Windows. Falling back to local scraper module.")
                await send_progress("Switched to synchronous local scraper...")
                import sys
                import os
                sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
                from bot_engine.scrapers.linkedin import scrape_jobs_from_linkedin
                
                jobs_data = scrape_jobs_from_linkedin(keyword, location)
                new_jobs_count = 0
                for job_data in jobs_data[:limit]:
                    existing = await ScrapedJob.find_one(ScrapedJob.link == job_data["link"])
                    if not existing:
                        new_job = ScrapedJob(**job_data)
                        await new_job.insert()
                        new_jobs_count += 1
                await cache.clear_pattern("jobs:scraped:*")
                return {"total": len(jobs_data), "new": new_jobs_count}

            logger.error(f"Scraping failed: {error_details}", exc_info=True)
            await send_progress(f"Scraping failed: {error_details}", type="error")
            asyncio.create_task(telegram_service.send_alert(f"⚠️ <b>Job Scraping Failed</b>\nError: {error_details}"))
            raise e
        finally:
            await self.browser_manager.close()

    async def get_jobs(self, skip: int = 0, limit: int = 100) -> list[ScrapedJob]:
        """
        Get list of scraped jobs from database.
        """
        return await ScrapedJob.find_all().sort("-created_at").skip(skip).limit(limit).to_list()

job_scraper_service = JobScraperService()
