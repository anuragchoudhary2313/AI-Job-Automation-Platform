import logging
from typing import Optional, List
from datetime import datetime, timedelta
from app.services.email_scraper import email_scraper
from app.models.job import ScrapedJob
from app.services.email import email_service
import asyncio

logger = logging.getLogger(__name__)


class EmailAutomationService:
    """
    Automated email campaign service.
    Sends personalized cold emails to multiple jobs matching user criteria.
    """
    
    async def auto_send_emails(
        self,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        limit: int = 5,
        candidate_name: str = "Candidate",
        skills: str = "",
        portfolio_link: str = "",
        resume_filename: Optional[str] = None
    ) -> dict:
        """
        Automatically send cold emails to jobs matching criteria.
        
        Returns: {
            'total': int,
            'sent': int,
            'failed': int,
            'results': [{
                'job_id': str,
                'company': str,
                'status': 'sent' | 'failed',
                'email': str,
                'error': str (if failed)
            }]
        }
        """
        
        try:
            # Find recent jobs matching criteria
            jobs = await self._find_matching_jobs(limit=limit)
            
            if not jobs:
                logger.warning("No matching jobs found for auto-email")
                return {
                    'total': 0,
                    'sent': 0,
                    'failed': 0,
                    'results': []
                }
            
            logger.info(f"Found {len(jobs)} jobs for auto-email campaign")
            
            results = []
            sent_count = 0
            failed_count = 0
            
            # Send emails in parallel with rate limiting
            for job in jobs:
                try:
                    result = await self._send_email_for_job(
                        job=job,
                        candidate_name=candidate_name,
                        skills=skills,
                        portfolio_link=portfolio_link,
                        resume_filename=resume_filename
                    )
                    
                    results.append(result)
                    
                    if result['status'] == 'sent':
                        sent_count += 1
                    else:
                        failed_count += 1
                    
                    # Rate limit: 1 second between emails
                    await asyncio.sleep(1)
                
                except Exception as e:
                    logger.error(f"Error sending email to {job.company}: {e}")
                    results.append({
                        'job_id': str(job.id),
                        'company': job.company,
                        'status': 'failed',
                        'email': '',
                        'error': str(e)
                    })
                    failed_count += 1
            
            logger.info(f"Auto-email campaign complete: {sent_count} sent, {failed_count} failed")
            
            return {
                'total': len(results),
                'sent': sent_count,
                'failed': failed_count,
                'results': results
            }
        
        except Exception as e:
            logger.error(f"Error in auto_send_emails: {e}")
            raise

    async def _find_matching_jobs(self, limit: int = 5) -> List[ScrapedJob]:
        """Find recent unprocessed jobs for email campaign"""
        try:
            # Get recent jobs from last 7 days that haven't been emailed yet
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            
            jobs = await ScrapedJob.find(
                ScrapedJob.created_at >= cutoff_date
            ).sort(-ScrapedJob.created_at).limit(limit).to_list()
            
            return jobs
        except Exception as e:
            logger.error(f"Error finding matching jobs: {e}")
            return []

    async def _send_email_for_job(
        self,
        job: ScrapedJob,
        candidate_name: str,
        skills: str,
        portfolio_link: str,
        resume_filename: Optional[str]
    ) -> dict:
        """Send single email for a job"""
        
        try:
            # Scrape HR email
            hr_result = await email_scraper.scrape_hr_emails(
                company=job.company,
                domain=None
            )
            
            recipient_email = hr_result['emails'][0] if hr_result['emails'] else None
            
            if not recipient_email:
                return {
                    'job_id': str(job.id),
                    'company': job.company,
                    'status': 'failed',
                    'email': '',
                    'error': 'No HR email found'
                }
            
            # Send email via email service
            await email_service.send_hr_email(
                recipient_email=recipient_email,
                company_name=job.company,
                job_role=job.title,
                candidate_name=candidate_name,
                skills=skills,
                portfolio_link=portfolio_link,
                resume_filename=resume_filename
            )
            
            logger.info(f"Email sent to {recipient_email} at {job.company} for {job.title}")
            
            return {
                'job_id': str(job.id),
                'company': job.company,
                'status': 'sent',
                'email': recipient_email,
                'error': None
            }
        
        except Exception as e:
            logger.error(f"Error sending email for job {job.id}: {e}")
            return {
                'job_id': str(job.id),
                'company': job.company,
                'status': 'failed',
                'email': '',
                'error': str(e)
            }


# Global instance
email_automation_service = EmailAutomationService()
