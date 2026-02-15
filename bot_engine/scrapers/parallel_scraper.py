"""
Parallel web scraping with thread pool and rate limiting.
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiter to avoid detection and respect site limits."""
    
    def __init__(self, max_requests: int = 10, time_window: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum requests per time window
            time_window: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        """Wait if rate limit exceeded."""
        async with self.lock:
            now = time.time()
            
            # Remove old requests outside time window
            self.requests = [
                req_time for req_time in self.requests
                if now - req_time < self.time_window
            ]
            
            # Wait if limit exceeded
            if len(self.requests) >= self.max_requests:
                oldest = self.requests[0]
                wait_time = self.time_window - (now - oldest)
                if wait_time > 0:
                    logger.info(f"Rate limit reached. Waiting {wait_time:.2f}s...")
                    await asyncio.sleep(wait_time)
                    # Retry acquire
                    return await self.acquire()
            
            # Record this request
            self.requests.append(now)
            
            # Add random delay to appear more human-like
            delay = random.uniform(1, 3)
            await asyncio.sleep(delay)


class ParallelScraper:
    """Parallel web scraper with thread pool."""
    
    def __init__(
        self,
        max_workers: int = 5,
        rate_limit: int = 10,
        headless: bool = True
    ):
        """
        Initialize parallel scraper.
        
        Args:
            max_workers: Maximum concurrent scrapers
            rate_limit: Max requests per minute
            headless: Run browsers in headless mode
        """
        self.max_workers = max_workers
        self.rate_limiter = RateLimiter(max_requests=rate_limit, time_window=60)
        self.headless = headless
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    def _create_driver(self) -> webdriver.Chrome:
        """Create Chrome WebDriver using shared utility."""
        from automation.selenium_driver import get_selenium_driver
        return get_selenium_driver(headless=self.headless)
    
    def _scrape_job(self, job_url: str) -> Optional[Dict[str, Any]]:
        """
        Scrape single job posting.
        
        Args:
            job_url: URL of job posting
            
        Returns:
            Job data or None if failed
        """
        driver = None
        try:
            driver = self._create_driver()
            driver.get(job_url)
            
            # Wait for page load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Extract job data (customize based on site)
            job_data = {
                'url': job_url,
                'title': self._safe_extract(driver, "//h1"),
                'company': self._safe_extract(driver, "//div[@class='company']"),
                'description': self._safe_extract(driver, "//div[@class='description']"),
                'location': self._safe_extract(driver, "//span[@class='location']"),
            }
            
            logger.info(f"Scraped job: {job_data.get('title', 'Unknown')}")
            return job_data
            
        except Exception as e:
            logger.error(f"Failed to scrape {job_url}: {e}")
            return None
            
        finally:
            if driver:
                driver.quit()
    
    def _safe_extract(self, driver: webdriver.Chrome, xpath: str) -> str:
        """Safely extract text from element."""
        try:
            element = driver.find_element(By.XPATH, xpath)
            return element.text.strip()
        except Exception:
            return ""
    
    async def scrape_jobs(self, job_urls: List[str]) -> List[Dict[str, Any]]:
        """
        Scrape multiple jobs in parallel.
        
        Args:
            job_urls: List of job URLs to scrape
            
        Returns:
            List of scraped job data
        """
        results = []
        
        # Submit scraping tasks to thread pool
        futures = []
        for url in job_urls:
            # Wait for rate limiter
            await self.rate_limiter.acquire()
            
            # Submit to thread pool
            future = self.executor.submit(self._scrape_job, url)
            futures.append(future)
        
        # Collect results as they complete
        for future in as_completed(futures):
            try:
                result = future.result(timeout=30)
                if result:
                    results.append(result)
            except Exception as e:
                logger.error(f"Scraping task failed: {e}")
        
        logger.info(f"Scraped {len(results)}/{len(job_urls)} jobs successfully")
        return results
    
    def shutdown(self):
        """Shutdown thread pool."""
        self.executor.shutdown(wait=True)


# Global scraper instance
scraper = ParallelScraper(max_workers=5, rate_limit=10)
