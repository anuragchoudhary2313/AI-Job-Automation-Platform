"""
Resume generation queue with worker pool.
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from queue import Queue
from threading import Thread
import time

logger = logging.getLogger(__name__)


class ResumeGenerationQueue:
    """Queue-based resume generation with worker pool."""
    
    def __init__(self, num_workers: int = 3):
        """
        Initialize resume generation queue.
        
        Args:
            num_workers: Number of worker threads
        """
        self.num_workers = num_workers
        self.queue = Queue()
        self.results = {}
        self.workers = []
        self.running = False
    
    def start(self):
        """Start worker threads."""
        if self.running:
            return
        
        self.running = True
        
        for i in range(self.num_workers):
            worker = Thread(
                target=self._worker,
                name=f"ResumeWorker-{i}",
                daemon=True
            )
            worker.start()
            self.workers.append(worker)
        
        logger.info(f"Started {self.num_workers} resume generation workers")
    
    def stop(self):
        """Stop worker threads."""
        self.running = False
        
        # Add sentinel values to unblock workers
        for _ in range(self.num_workers):
            self.queue.put(None)
        
        # Wait for workers to finish
        for worker in self.workers:
            worker.join(timeout=5)
        
        self.workers.clear()
        logger.info("Stopped resume generation workers")
    
    def _worker(self):
        """Worker thread that processes resume generation tasks."""
        while self.running:
            try:
                # Get task from queue (blocking)
                task = self.queue.get(timeout=1)
                
                if task is None:  # Sentinel value
                    break
                
                task_id = task['id']
                job_description = task['job_description']
                user_profile = task['user_profile']
                
                logger.info(f"Worker {Thread.current_thread().name} processing task {task_id}")
                
                # Generate resume
                try:
                    resume = self._generate_resume(job_description, user_profile)
                    self.results[task_id] = {
                        'status': 'completed',
                        'resume': resume,
                        'error': None
                    }
                    logger.info(f"Task {task_id} completed successfully")
                    
                except Exception as e:
                    logger.error(f"Task {task_id} failed: {e}", exc_info=True)
                    self.results[task_id] = {
                        'status': 'failed',
                        'resume': None,
                        'error': str(e)
                    }
                
                finally:
                    self.queue.task_done()
                    
            except Exception as e:
                if self.running:
                    logger.error(f"Worker error: {e}", exc_info=True)
    
    def _generate_resume(
        self,
        job_description: str,
        user_profile: Dict[str, Any]
    ) -> str:
        """
        Generate resume (placeholder - integrate with OpenAI).
        
        Args:
            job_description: Job description
            user_profile: User profile data
            
        Returns:
            Generated resume content
        """
        # Simulate processing time
        time.sleep(2)
        
        # In production, call OpenAI API here
        resume = f"""
RESUME FOR: {user_profile.get('name', 'Candidate')}

OBJECTIVE:
Seeking position matching: {job_description[:100]}...

SKILLS:
{', '.join(user_profile.get('skills', []))}

EXPERIENCE:
{user_profile.get('experience', 'N/A')}

EDUCATION:
{user_profile.get('education', 'N/A')}
"""
        return resume
    
    async def submit(
        self,
        task_id: str,
        job_description: str,
        user_profile: Dict[str, Any]
    ) -> str:
        """
        Submit resume generation task.
        
        Args:
            task_id: Unique task ID
            job_description: Job description
            user_profile: User profile data
            
        Returns:
            Task ID for tracking
        """
        task = {
            'id': task_id,
            'job_description': job_description,
            'user_profile': user_profile
        }
        
        self.queue.put(task)
        self.results[task_id] = {'status': 'pending', 'resume': None, 'error': None}
        
        logger.info(f"Submitted task {task_id} to queue (queue size: {self.queue.qsize()})")
        return task_id
    
    async def get_result(
        self,
        task_id: str,
        timeout: int = 60
    ) -> Optional[Dict[str, Any]]:
        """
        Get result of resume generation task.
        
        Args:
            task_id: Task ID
            timeout: Max wait time in seconds
            
        Returns:
            Result dict or None if timeout
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if task_id in self.results:
                result = self.results[task_id]
                
                if result['status'] in ['completed', 'failed']:
                    return result
            
            await asyncio.sleep(0.5)
        
        logger.warning(f"Task {task_id} timed out after {timeout}s")
        return None
    
    def get_queue_size(self) -> int:
        """Get current queue size."""
        return self.queue.qsize()


# Global resume queue instance
resume_queue = ResumeGenerationQueue(num_workers=3)
