"""
Refactored stats endpoints using service layer.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.models.resume import Resume

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
    """Fetch aggregated stats for the current user."""
    try:
        stats = await job_service.get_job_stats(current_user)
        response = job_service.build_dashboard_stats(stats)
        response["total_applications"] = response.get("total_applied", 0)
        response["total_resumes"] = await Resume.find({"user_id": {"$in": [current_user.id, str(current_user.id)]}}).count()
        
        logger.info(f"Retrieved stats for user {current_user.id}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting statistics"
        )
