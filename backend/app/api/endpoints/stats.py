"""
Refactored stats endpoints using service layer.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.api import deps
from app.core.logging import get_logger
from app.services.job_service import JobService
from app.repositories.job import JobRepository
from app.models.user import User

router = APIRouter()
logger = get_logger(__name__)


def get_job_service(
    job_repo: JobRepository = Depends(deps.get_job_repository)
) -> JobService:
    """Dependency for job service."""
    return JobService(job_repo)


@router.get("/")
async def get_stats(
    current_user: User = Depends(deps.get_current_user),
    job_service: JobService = Depends(get_job_service)
) -> Dict[str, Any]:
    """Fetch aggregated stats for the current user's team."""
    try:
        # Get job stats from service
        stats = await job_service.get_job_stats(current_user)
        
        # Calculate derived metrics
        total_jobs = stats.get("total", 0)
        by_status = stats.get("by_status", {})
        
        # Map statuses to frontend expectations
        # Note: keys in get_stats_by_team (job repo) must match these
        applied = by_status.get("applied", 0)
        interview = by_status.get("interviewing", 0) # Repo returns 'interviewing'
        offer = by_status.get("offered", 0) # Repo returns 'offered'
        rejected = by_status.get("rejected", 0)
        pending = by_status.get("pending", 0)
        
        shortlisted = interview + offer
        
        # Calculate success rate
        success_rate = 0.0
        if total_jobs > 0:
            success_rate = (shortlisted / total_jobs) * 100
        
        # Status distribution for charts
        distribution = [
            {"name": "Pending", "value": pending},
            {"name": "Applied", "value": applied},
            {"name": "Interview", "value": interview},
            {"name": "Offer", "value": offer},
            {"name": "Rejected", "value": rejected},
        ]
        
        # Filter out zero values
        distribution = [d for d in distribution if d["value"] > 0]
        
        # Daily activity (mock for now)
        daily_activity = []
        
        response = {
            "total_applied": total_jobs,
            "emailed": applied,
            "shortlisted": shortlisted,
            "rejected": rejected,
            "success_rate": round(success_rate, 1),
            "daily_activity": daily_activity,
            "status_distribution": distribution
        }
        
        logger.info(f"Retrieved stats for team {current_user.team_id}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting statistics"
        )
