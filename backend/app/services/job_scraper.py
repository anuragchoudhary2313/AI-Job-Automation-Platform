import logging
import asyncio

from app.models.job import ScrapedJob, JobStatus
from app.automation.browser import BrowserManager
from app.automation.scrapers.linkedin import LinkedInScraper
from app.notifications.telegram import telegram_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class JobScraperService:
    def __init__(self):
        self.browser_manager = BrowserManager()
        
    async def scrape_jobs(self, keyword: str, location: str, limit: int = 10):
        if not settings.JOB_SCRAPING_ENABLED:
            logger.warning("Job scraping is disabled by feature flag.")
            return {"message": "Scraping disabled"}

        logger.info(f"Starting scrape for {keyword} in {location}")
        
        try:
            page = await self.browser_manager.launch()
            scraper = LinkedInScraper(page)
            
            # Login (if cookies exist)
            await scraper.login()
            
            # Scrape
            jobs_data = await scraper.scrape_jobs(keyword, location, limit)
            
            new_jobs_count = 0
            for job_data in jobs_data:
                # Check duplicates
                existing = await ScrapedJob.find_one(ScrapedJob.link == job_data["link"])
                
                if not existing:
                    new_job = ScrapedJob(**job_data)
                    await new_job.insert()
                    new_jobs_count += 1
                    
                    # Alert for new job
                    await telegram_service.send_alert(
                        f"🎯 <b>New Job Found</b>\n"
                        f"<b>Role:</b> {new_job.title}\n"
                        f"<b>Company:</b> {new_job.company}\n"
                        f"<b>Location:</b> {new_job.location}\n"
                        f"<a href='{new_job.link}'>Apply Now</a>"
                    )
            
            logger.info(f"Scraping completed. Found {len(jobs_data)} jobs, {new_jobs_count} new.")
            return {"total": len(jobs_data), "new": new_jobs_count}

        except Exception as e:
            logger.error(f"Scraping failed: {e}")
            await telegram_service.send_alert(f"⚠️ <b>Job Scraping Failed</b>\nError: {str(e)}")
            raise e
        finally:
            await self.browser_manager.close()

    async def get_jobs(self, skip: int = 0, limit: int = 100) -> list[ScrapedJob]:
        """
        Get list of scraped jobs from database.
        """
        return await ScrapedJob.find_all().sort("-created_at").skip(skip).limit(limit).to_list()

job_scraper_service = JobScraperService()
