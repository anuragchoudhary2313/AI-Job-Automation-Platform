from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
import logging

from app.api import deps
from app.models.user import User
from app.core.features import features
from agents.job_agent import JobAutomationAgent
from agents.orchestrator_agent import OrchestratorAgent
from app.services.email_reader import email_reader_service

router = APIRouter()
logger = logging.getLogger(__name__)

class MultiApplyRequest(BaseModel):
    keyword: str
    location: str
    limit: int = 5

async def run_multi_agent_background(keyword: str, location: str, limit: int, user: User):
    """Background wrapper for executing the multi-agent orchestrator."""
    orchestrator = OrchestratorAgent(user=user)
    try:
        logger.info(f"Multi-Agent background task started for {keyword} in {location}")
        result = await orchestrator.run_pipeline(keyword, location, limit)
        logger.info(f"Multi-Agent finished: {result}")
    except Exception as e:
        logger.error(f"Multi-Agent workflow failed: {e}", exc_info=True)


@router.post("/multi-apply")
async def multi_apply(
    request: MultiApplyRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Triggers the Multi-Agent pipeline (Decide -> Resume -> Email -> Notify).
    """
    # Enforce Auto Apply restrictions
    features.require("auto_apply")
    
    background_tasks.add_task(
        run_multi_agent_background, 
        request.keyword, 
        request.location, 
        request.limit, 
        current_user
    )
    
    return {
        "message": "Multi-Agent pipeline launched in the background successfully.",
        "status": "started",
        "agent": "OrchestratorAgent"
    }

async def trigger_email_scan_background():
    """Background task offloading IMAP extraction loops."""
    logger.info("Email Reader triggered manually. Executing trace...")
    await email_reader_service.check_inbox()

@router.post("/check-email")
async def check_email(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Manually triggers the background IMAP reader fetching & classifying recruiter replies.
    """
    # Requires standard feature gating
    features.require("email_automation")
    
    background_tasks.add_task(trigger_email_scan_background)
    
    return {
        "message": "Email reply classification scan started.",
        "status": "started",
        "service": "EmailReaderService"
    }
