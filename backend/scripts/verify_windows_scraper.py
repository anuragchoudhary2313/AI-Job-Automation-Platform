import asyncio
import sys
import os
import logging
import anyio

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set event loop policy for Windows - CRITICAL FIX being verified
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.core.config import settings
from app.db.mongo import init_db
from app.services.job_scraper import job_scraper_service
from app.models.job import ScrapedJob

async def test_scraping():
    logger.info("Starting Scraper Verification on Windows...")
    
    try:
        # 1. Initialize DB
        logger.info("Initializing MongoDB...")
        await init_db()
        
        # 2. Run Scraper
        keyword = "Software Engineer"
        location = "Remote"
        limit = 1
        
        logger.info(f"Running scraper for '{keyword}' in '{location}' with limit {limit}")
        result = await job_scraper_service.scrape_jobs(keyword, location, limit=limit)
        
        logger.info(f"✅ Scraper completed successfully: {result}")
        
        # 3. Verify Database
        count = await ScrapedJob.count()
        logger.info(f"Total scraped jobs in DB: {count}")
        
    except NotImplementedError:
        logger.error("❌ FAILED: NotImplementedError occurred! The event loop fix failed.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Error during verification: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_scraping())
