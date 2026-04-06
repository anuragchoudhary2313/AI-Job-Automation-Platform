from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from app.api import deps
from app.services.email_scraper import email_scraper
from app.models.user import User as UserModel
from app.core.cache import cache
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ScrapeHREmailRequest(BaseModel):
    """Request schema for scraping HR emails"""
    company: str
    domain: Optional[str] = None


class HREmailResponse(BaseModel):
    """Response schema for HR email scraping"""
    company: str
    emails: List[str]
    source: str
    cached: bool


@router.post("/scrape-hr", response_model=HREmailResponse)
async def scrape_hr_emails(
    request: ScrapeHREmailRequest,
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(deps.get_current_user),
):
    """
    Scrape HR/recruiting emails for a company.
    
    Free endpoint - scrapes company website for contact emails.
    Results are cached for 30 days.
    Returns cached results immediately; updates in background if not cached.
    
    Args:
        company: Company name
        domain: Optional domain (e.g., acme.com). If not provided, will be guessed.
    
    Returns:
        HR emails list with metadata (cached=true if from cache, false if newly scraped)
    """
    
    company = request.company.strip()
    
    try:
        # Check cache first - return immediately if available
        cache_key = f"hr_emails:{company}:{request.domain}"
        cached_result = await cache.get(cache_key)
        
        if cached_result:
            return HREmailResponse(
                company=company,
                emails=cached_result.get('emails', []),
                source=cached_result.get('source', 'cache'),
                cached=True
            )
        
        # Not cached - start background task to scrape
        if background_tasks:
            background_tasks.add_task(
                email_scraper.scrape_hr_emails,
                company=company,
                domain=request.domain
            )
            # Return empty result immediately to avoid timeout
            return HREmailResponse(
                company=company,
                emails=[],
                source="pending",
                cached=False
            )
        else:
            # Fallback: try scraping synchronously with short timeout (no timeout for this path)
            result = await email_scraper.scrape_hr_emails(
                company=company,
                domain=request.domain
            )
            
            return HREmailResponse(
                company=result['company'],
                emails=result['emails'],
                source=result['source'],
                cached=result['cached']
            )
    
    except Exception as e:
        logger.error(f"Error scraping HR emails for {company}: {e}")
        # Return empty list instead of error to allow frontend to proceed
        return HREmailResponse(
            company=company,
            emails=[],
            source="error",
            cached=False
        )


@router.get("/check-cached/{company}")
async def check_cached_email(
    company: str,
    current_user: UserModel = Depends(deps.get_current_user),
):
    """
    Quick check if HR emails are cached for a company (no scraping).
    Useful for showing badges in job lists.
    
    Returns: {cached: bool, email_count: int}
    """
    
    try:
        cache_key = f"hr_emails:{company}:None"
        cached_emails = await cache.get(cache_key)
        
        return {
            'company': company,
            'cached': cached_emails is not None,
            'email_count': len(cached_emails) if cached_emails else 0
        }
    
    except Exception as e:
        logger.error(f"Error checking cached emails for {company}: {e}")
        return {
            'company': company,
            'cached': False,
            'email_count': 0
        }


@router.post("/validate-email")
async def validate_email(
    email: str,
    current_user: UserModel = Depends(deps.get_current_user),
):
    """
    Quick validation of an email address.
    Checks format and MX records.
    """
    
    is_valid = email_scraper._validate_email(email)
    
    return {
        'email': email,
        'valid': is_valid
    }
