"""
Optimized bot automation engine with parallel processing.
"""
import asyncio
import logging
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor
import time

from bot_engine.scrapers.parallel_scraper import scraper
from bot_engine.queue.resume_queue import resume_queue

logger = logging.getLogger(__name__)


class BotEngine:
    """Optimized bot engine for high-throughput job applications."""
    
    def __init__(self, max_concurrent_jobs: int = 10):
        """
        Initialize bot engine.
        
        Args:
            max_concurrent_jobs: Maximum concurrent job applications
        """
        self.max_concurrent_jobs = max_concurrent_jobs
        self.semaphore = asyncio.Semaphore(max_concurrent_jobs)
        self.executor = ThreadPoolExecutor(max_workers=max_concurrent_jobs)
        
        # Start resume generation queue
        resume_queue.start()
    
    async def process_jobs(
        self,
        jobs: List[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process multiple jobs in parallel.
        
        Args:
            jobs: List of job data
            user_profile: User profile for resume generation
            
        Returns:
            Processing results
        """
        start_time = time.time()
        
        results = {
            'total': len(jobs),
            'successful': 0,
            'failed': 0,
            'errors': []
        }
        
        # Process jobs concurrently
        tasks = [
            self._process_single_job(job, user_profile)
            for job in jobs
        ]
        
        # Wait for all tasks to complete
        task_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        for i, result in enumerate(task_results):
            if isinstance(result, Exception):
                results['failed'] += 1
                results['errors'].append({
                    'job_id': jobs[i].get('id'),
                    'error': str(result)
                })
            elif result:
                results['successful'] += 1
            else:
                results['failed'] += 1
        
        elapsed = time.time() - start_time
        results['elapsed_seconds'] = elapsed
        results['jobs_per_hour'] = (results['successful'] / elapsed) * 3600 if elapsed > 0 else 0
        
        logger.info(
            f"Processed {results['total']} jobs in {elapsed:.2f}s "
            f"({results['jobs_per_hour']:.1f} jobs/hour). "
            f"Success: {results['successful']}, Failed: {results['failed']}"
        )
        
        return results
    
    async def _process_single_job(
        self,
        job: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> bool:
        """
        Process single job application.
        
        Args:
            job: Job data
            user_profile: User profile
            
        Returns:
            True if successful, False otherwise
        """
        async with self.semaphore:
            try:
                job_id = job.get('id', 'unknown')
                logger.info(f"Processing job {job_id}: {job.get('title', 'Unknown')}")
                
                # Step 1: Generate resume (async queue)
                task_id = f"resume_{job_id}_{int(time.time())}"
                await resume_queue.submit(
                    task_id=task_id,
                    job_description=job.get('description', ''),
                    user_profile=user_profile
                )
                
                # Wait for resume generation
                resume_result = await resume_queue.get_result(task_id, timeout=60)
                
                if not resume_result or resume_result['status'] != 'completed':
                    raise Exception(f"Resume generation failed: {resume_result.get('error')}")
                
                resume_content = resume_result['resume']
                
                # Step 2: Send application email (async)
                await self._send_application_email(
                    job=job,
                    resume=resume_content,
                    user_profile=user_profile
                )
                
                logger.info(f"Successfully processed job {job_id}")
                return True
                
            except Exception as e:
                logger.error(f"Failed to process job {job.get('id')}: {e}", exc_info=True)
                return False
    
    async def _send_application_email(
        self,
        job: Dict[str, Any],
        resume: str,
        user_profile: Dict[str, Any]
    ):
        """
        Send application email asynchronously.
        
        Args:
            job: Job data
            resume: Resume content
            user_profile: User profile
        """
        # Simulate email sending (replace with actual email service)
        await asyncio.sleep(1)
        
        logger.info(f"Sent application email for job {job.get('id')}")
    
    async def scrape_and_apply(
        self,
        job_urls: List[str],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Scrape jobs and apply in one flow.
        
        Args:
            job_urls: List of job URLs to scrape
            user_profile: User profile
            
        Returns:
            Processing results
        """
        logger.info(f"Starting scrape and apply for {len(job_urls)} URLs")
        
        # Step 1: Parallel scraping
        jobs = await scraper.scrape_jobs(job_urls)
        
        if not jobs:
            logger.warning("No jobs scraped successfully")
            return {
                'total': 0,
                'successful': 0,
                'failed': len(job_urls),
                'errors': ['Failed to scrape any jobs']
            }
        
        # Step 2: Parallel application
        results = await self.process_jobs(jobs, user_profile)
        
        return results
    
    def shutdown(self):
        """Shutdown bot engine."""
        logger.info("Shutting down bot engine...")
        
        # Stop resume queue
        resume_queue.stop()
        
        # Shutdown scraper
        scraper.shutdown()
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("Bot engine shut down successfully")


# Global bot engine instance
bot_engine = BotEngine(max_concurrent_jobs=10)
