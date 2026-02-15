"""
Job wrapper with execution locks and timeout handling.

This module provides a safe wrapper for scheduled jobs that prevents
concurrent execution and handles timeouts.
"""
import asyncio
import logging
import threading
from datetime import datetime
from typing import Callable, Dict
from functools import wraps

logger = logging.getLogger(__name__)

# Global locks for job execution
_job_locks: Dict[str, threading.Lock] = {}
_running_jobs: Dict[str, datetime] = {}

def with_execution_lock(job_id: str, timeout_seconds: int = 600):
    """
    Decorator to add execution lock and timeout to scheduled jobs.
    
    Args:
        job_id: Unique identifier for the job
        timeout_seconds: Maximum execution time (default: 10 minutes)
    
    Usage:
        @with_execution_lock("scrape_jobs", timeout_seconds=600)
        async def scrape_jobs_task():
            # Job implementation
            pass
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Initialize lock for this job if not exists
            if job_id not in _job_locks:
                _job_locks[job_id] = threading.Lock()
            
            # Try to acquire lock (non-blocking)
            if not _job_locks[job_id].acquire(blocking=False):
                logger.warning(
                    f"Job '{job_id}' is already running, skipping this execution. "
                    f"Started at: {_running_jobs.get(job_id, 'unknown')}"
                )
                return {"status": "skipped", "reason": "already_running"}
            
            try:
                # Track job start time
                start_time = datetime.now()
                _running_jobs[job_id] = start_time
                logger.info(f"Job '{job_id}' started at {start_time}")
                
                # Execute with timeout
                try:
                    result = await asyncio.wait_for(
                        func(*args, **kwargs),
                        timeout=timeout_seconds
                    )
                    
                    duration = (datetime.now() - start_time).total_seconds()
                    logger.info(
                        f"Job '{job_id}' completed successfully in {duration:.2f}s"
                    )
                    return result
                    
                except asyncio.TimeoutError:
                    duration = (datetime.now() - start_time).total_seconds()
                    logger.error(
                        f"Job '{job_id}' timed out after {duration:.2f}s "
                        f"(limit: {timeout_seconds}s)"
                    )
                    return {"status": "timeout", "duration": duration}
                    
            except Exception as e:
                duration = (datetime.now() - start_time).total_seconds()
                logger.error(
                    f"Job '{job_id}' failed after {duration:.2f}s: {str(e)}",
                    exc_info=True
                )
                return {"status": "error", "error": str(e), "duration": duration}
                
            finally:
                # Always release lock and clean up
                if job_id in _running_jobs:
                    del _running_jobs[job_id]
                _job_locks[job_id].release()
                
        return wrapper
    return decorator


def get_running_jobs() -> Dict[str, datetime]:
    """Get currently running jobs and their start times."""
    return _running_jobs.copy()


def is_job_running(job_id: str) -> bool:
    """Check if a specific job is currently running."""
    return job_id in _running_jobs
