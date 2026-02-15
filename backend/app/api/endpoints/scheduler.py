from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from app.api import deps
from app.core.config import settings
from app.scheduler.scheduler import get_scheduler
from app.models.user import User

router = APIRouter()

@router.get("/status")
async def get_scheduler_status(
    current_user: User = Depends(deps.require_admin),
):
    """
    Get scheduler status (Admin only).
    """
    scheduler = get_scheduler()
    
    if not scheduler:
        return {
            "running": False,
            "jobs": [],
            "timezone": settings.SCHEDULER_TIMEZONE
        }
    
    jobs = []
    if scheduler.running:
        for job in scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time),
                "trigger": str(job.trigger)
            })
        
    return {
        "running": scheduler.running,
        "jobs": jobs,
        "timezone": str(scheduler.timezone)
    }

@router.post("/restart")
async def restart_scheduler_endpoint(
    current_user: User = Depends(deps.require_admin),
):
    """
    Restart the scheduler (Admin only).
    """
    from app.scheduler.scheduler import start_scheduler, shutdown_scheduler
    
    shutdown_scheduler()
    start_scheduler()
    
    return {"message": "Scheduler restarted successfully"}

class JobResponse(BaseModel):
    id: str
    next_run_time: Any 
    # args: List[Any] # args might not be serializable or needed for simple list

@router.get("/jobs", response_model=List[Dict[str, Any]])
def list_jobs(
    current_user: User = Depends(deps.require_admin)
):
    """
    List all active scheduled jobs.
    """
    scheduler = get_scheduler()
    if not scheduler:
        return []
        
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "next_run_time": job.next_run_time,
             # "args": job.args # removed to avoid issues
        })
    return jobs

# Removed dynamic job endpoints as they are not supported by SchedulerManager
# and job automation is currently global.
