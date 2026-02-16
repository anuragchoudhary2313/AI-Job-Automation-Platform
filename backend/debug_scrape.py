
import asyncio
import logging
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.getcwd())

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def main():
    try:
        print("Importing job_scraper_service...")
        from app.services.job_scraper import job_scraper_service
        
        print("Attempting to launch browser logic...")
        # We might need to mock settings if they rely on env vars not loaded
        # But let's assume .env is loaded or defaults are used.
        # Actually better to load dotenv
        from dotenv import load_dotenv
        load_dotenv()
        
        print("Calling scrape_jobs('software developer', 'remote', 1)...")
        result = await job_scraper_service.scrape_jobs("software developer", "remote", 1)
        print("Result:", result)
        
    except Exception as e:
        print("Caught exception during execution:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
