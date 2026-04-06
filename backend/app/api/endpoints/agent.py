from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, BackgroundTasks, Query, HTTPException
from pydantic import BaseModel
import logging

from app.api import deps
from app.models.user import User
from app.core.features import features
from app.models.automation_event import AutomationEvent
from app.models.automation_dead_letter import AutomationDeadLetter
from agents.orchestrator_agent import OrchestratorAgent
from app.services.dead_letter_replay_service import dead_letter_replay_service
from app.services.email_reader import email_reader_service

router = APIRouter()
logger = logging.getLogger(__name__)

class MultiApplyRequest(BaseModel):
    keyword: str
    location: str
    limit: int = 5
    ats_override: bool = False


class DeadLetterStatusRequest(BaseModel):
    status: str

async def run_multi_agent_background(keyword: str, location: str, limit: int, ats_override: bool, user: User):
    """Background wrapper for executing the multi-agent orchestrator."""
    orchestrator = OrchestratorAgent(user=user)
    try:
        logger.info(f"Multi-Agent background task started for {keyword} in {location}")
        result = await orchestrator.run_pipeline(keyword, location, limit, ats_override=ats_override)
        logger.info(f"Multi-Agent finished: {result}")
    except Exception as e:
        logger.error(f"Multi-Agent workflow failed: {e}", exc_info=True)
        try:
            await AutomationDeadLetter(
                user_id=str(user.id),
                source="orchestrator_agent",
                stage="pipeline",
                task_name="multi_apply",
                error_message=str(e),
                payload={
                    "keyword": keyword,
                    "location": location,
                    "limit": limit,
                    "ats_override": ats_override,
                },
                metadata={"handler": "run_multi_agent_background"},
                retry_count=0,
                status="open",
            ).insert()
        except Exception as dlq_err:
            logger.warning(f"Failed to persist dead letter for multi-agent failure: {dlq_err}")


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
        request.ats_override,
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


@router.get("/events")
async def get_automation_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    source: str | None = Query(None),
    stage: str | None = Query(None),
    action: str | None = Query(None),
    current_user: User = Depends(deps.get_current_user),
):
    """List recent automation events for the current user."""
    query = AutomationEvent.find(AutomationEvent.user_id == str(current_user.id))
    if source:
        query = query.find(AutomationEvent.source == source)
    if stage:
        query = query.find(AutomationEvent.stage == stage)
    if action:
        query = query.find(AutomationEvent.action == action)

    events = await query.sort("-created_at").skip(skip).limit(limit).to_list()

    payload = []
    for item in events:
        row = item.model_dump(by_alias=False)
        row["id"] = str(item.id)
        payload.append(row)
    return payload


@router.get("/dead-letters")
async def get_dead_letters(
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None),
    source: str | None = Query(None),
    current_user: User = Depends(deps.get_current_user),
):
    """List automation dead-letter failures for the current user."""
    query = AutomationDeadLetter.find(AutomationDeadLetter.user_id == str(current_user.id))
    if status:
        query = query.find(AutomationDeadLetter.status == status)
    if source:
        query = query.find(AutomationDeadLetter.source == source)

    rows = await query.sort("-created_at").limit(limit).to_list()

    payload = []
    for item in rows:
        row = item.model_dump(by_alias=False)
        row["id"] = str(item.id)
        payload.append(row)
    return payload


@router.post("/dead-letters/{dead_letter_id}/status")
async def update_dead_letter_status(
    dead_letter_id: str,
    request: DeadLetterStatusRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """Update dead-letter status for user-owned records."""
    next_status = (request.status or "").strip().lower()
    if next_status not in {"open", "replayed", "ignored"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    try:
        oid = PydanticObjectId(dead_letter_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dead letter id")

    item = await AutomationDeadLetter.get(oid)
    if item is None:
        raise HTTPException(status_code=404, detail="Dead letter not found")
    if str(item.user_id or "") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized for this dead letter")

    item.status = next_status
    await item.save()

    return {"id": str(item.id), "status": item.status}


@router.post("/dead-letters/{dead_letter_id}/replay")
async def replay_dead_letter(
    dead_letter_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
):
    """Replay a user-owned dead-letter item in background for supported sources."""
    try:
        oid = PydanticObjectId(dead_letter_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dead letter id")

    item = await AutomationDeadLetter.get(oid)
    if item is None:
        raise HTTPException(status_code=404, detail="Dead letter not found")
    if str(item.user_id or "") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized for this dead letter")

    allowed, reason = await dead_letter_replay_service.queue_replay(
        item,
        actor_user_id=str(current_user.id),
        actor_is_admin=False,
    )
    if not allowed:
        raise HTTPException(status_code=429, detail=reason)

    background_tasks.add_task(
        dead_letter_replay_service.run_replay,
        str(item.id),
        actor_user_id=str(current_user.id),
        actor_is_admin=False,
    )

    return {
        "status": "queued",
        "message": "Dead letter replay queued",
        "dead_letter_id": str(item.id),
    }
