from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Optional
from pydantic import BaseModel
from app.api import deps
from app.services.email_automation import email_automation_service
from app.models.user import User as UserModel
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _validate_email_config() -> Optional[str]:
    if not settings.EMAIL_ENABLED:
        return "Email automation is disabled on the server."
    if settings.EMAIL_DEV_MODE:
        return None
    if not settings.RESEND_API_KEY:
        return "Resend API key is not configured. Set RESEND_API_KEY in deployment environment variables."
    if not (settings.RESEND_FROM_EMAIL or settings.EMAILS_FROM_EMAIL):
        return "Sender email is not configured. Set RESEND_FROM_EMAIL in deployment environment variables."
    return None


class AutoSendEmailRequest(BaseModel):
    """Request schema for auto-sending cold emails"""
    keyword: Optional[str] = None
    location: Optional[str] = None
    limit: int = 5
    candidate_name: Optional[str] = None
    skills: Optional[str] = None
    portfolio_link: Optional[str] = None
    resume_filename: Optional[str] = None


class AutoSendEmailResponse(BaseModel):
    """Response schema for auto-send results"""
    total: int
    sent: int
    failed: int
    results: list


@router.post("/auto-send")
async def auto_send_emails(
    request: AutoSendEmailRequest,
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(deps.get_current_user),
):
    """
    Automatically send cold HR emails to matching recent jobs.
    
    Finds jobs from the last 7 days and sends personalized emails.
    Skips jobs that already have emails sent or applications.
    
    Args:
        keyword: Job title/keyword filter (optional)
        location: Location filter (optional)
        limit: Number of emails to send (max 20)
        candidate_name: Your name for email
        skills: Your skills (optional, pulls from profile)
        portfolio_link: Your portfolio link (optional, pulls from profile)
        resume_filename: Resume to attach (optional)
    
    Returns:
        Campaign summary with sent/failed counts and detailed results
    """
    
    try:
        config_error = _validate_email_config()
        if config_error:
            raise HTTPException(status_code=503, detail=config_error)

        # Limit to reasonable number
        if request.limit > 20:
            request.limit = 20
        
        # Use background task for long-running operation
        background_tasks.add_task(
            email_automation_service.auto_send_emails,
            keyword=request.keyword,
            location=request.location,
            limit=request.limit,
            candidate_name=request.candidate_name or "Candidate",
            skills=request.skills or "",
            portfolio_link=request.portfolio_link or "",
            resume_filename=request.resume_filename
        )

        return {
            "status": "started",
            "message": f"Auto-email campaign started. Will send up to {request.limit} emails.",
            "total": 0,
            "sent": 0,
            "failed": 0,
            "results": []
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in auto_send_emails endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to start auto-email campaign"
        )
