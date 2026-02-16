from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Any, Optional
from app.api import deps
from app.services.job_scraper import job_scraper_service
from app.core.features import features
from app.services.job_service import JobService
from app.repositories.job import JobRepository
from app.schemas.job import Job as JobSchema
from app.models.user import User as UserModel

router = APIRouter()

def get_job_service(
    job_repo: JobRepository = Depends(deps.get_job_repository)
) -> JobService:
    return JobService(job_repo)

@router.post("/scrape")
async def trigger_scrape(
    keyword: str, 
    location: str, 
    limit: int = 5,
    background_tasks: BackgroundTasks = None,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Triggers a background job scraping task.
    """
    # Enforce Feature Flag
    features.require("job_scraping")
    
    # Passing current_user's team_id if needed, but scraper is global for now.
    # Updated scrape_jobs to not require DB session
    result = await job_scraper_service.scrape_jobs(keyword, location, limit)
    return result

@router.get("/stats")
async def get_stats(
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user)
):
    """
    Get job statistics for the current user's team.
    """
    return await job_service.get_job_stats(current_user)

@router.get("/", response_model=List[JobSchema])
async def list_jobs(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user)
):
    """
    List jobs for the current user's team with optional filters.
    """
    return await job_service.get_jobs(current_user, skip, limit, status, search, sort)

@router.get("/scraped", response_model=List[JobSchema])
async def list_scraped_jobs(
    skip: int = 0,
    limit: int = 100,
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user)
):
    """
    List global scraped jobs. 
    (Assuming distinction is made via status or source, need to clarify service method)
    For now, returning all jobs or implementing dedicated method.
    """
    # Assuming scraped jobs have 'pending' status?
    return await job_service.get_jobs(current_user, skip, limit, status="pending")

@router.get("/{job_id}", response_model=JobSchema)
async def read_job(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Get a specific job by id.
    """
    return await job_service.get_job(job_id, current_user)

@router.post("/", response_model=JobSchema)
async def create_job(
    job_in: Any, # Use loose type or specific schema
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Create a new job.
    """
    return await job_service.create_job(job_in, current_user)

@router.put("/{job_id}", response_model=JobSchema)
async def update_job(
    job_id: str,
    job_in: Any,
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Update a job.
    """
    return await job_service.update_job(job_id, job_in, current_user)

@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Delete a job.
    """
    await job_service.delete_job(job_id, current_user)
    return {"message": "Job deleted"}
