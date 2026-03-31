from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body, Query
from typing import List, Any, Optional, Dict, Union
import hashlib
import json
from datetime import datetime, timedelta
from fastapi import Request, Response
from app.api import deps
from app.services.job_scraper import job_scraper_service
from app.core.features import features
from app.core.cache import cache
from app.services.job_service import JobService
from app.core.pagination import OffsetPaginatedResponse, create_offset_paginated_response
from app.repositories.job import JobRepository
from app.schemas.job import Job as JobSchema, JobCreate, JobUpdate, JobCreateResponse
from app.models.user import User as UserModel

router = APIRouter()


def get_job_service(
    job_repo: JobRepository = Depends(deps.get_job_repository),
) -> JobService:
    return JobService(job_repo)


@router.post("/scrape")
async def trigger_scrape(
    keyword: str,
    location: str,
    limit: int = 5,
    experience: Optional[str] = None,
    job_type: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    """
    Triggers a background job scraping task.
    """
    # Enforce Feature Flag
    features.require("job_scraping")

    # Experience is optional; enrich keyword query when provided.
    scrape_keyword = keyword.strip()
    if experience and experience.strip():
        scrape_keyword = f"{scrape_keyword} {experience.strip()}"
    if job_type and job_type.strip():
        scrape_keyword = f"{scrape_keyword} {job_type.strip()}"

    if background_tasks:
        background_tasks.add_task(
            job_scraper_service.scrape_jobs,
            scrape_keyword,
            location,
            limit,
            str(current_user.id),
        )
        return {
            "message": "Job scraping initialized in the background",
            "status": "started",
            "jobs_found": 0
        }
    else:
        # Fallback for synchronous if needed (though BackgroundTasks is usually present in FastAPI)
        result = await job_scraper_service.scrape_jobs(scrape_keyword, location, limit)
        return result


@router.get("/scraped")
async def list_scraped_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    days: int = Query(7, ge=1, le=30),
    compact: bool = Query(False, description="Return a compact payload for list views"),
    include_meta: bool = Query(False, description="Return pagination metadata envelope"),
    request: Request = None,
    response: Response = None,
    current_user: UserModel = Depends(deps.get_current_user),
):
    """
    List scraped jobs from the recent time window (defaults to 7 days).
    """
    from app.models.job import ScrapedJob

    safe_days = days
    cutoff = datetime.utcnow() - timedelta(days=safe_days)

    cache_key = f"jobs:scraped:{safe_days}:{skip}:{limit}:{1 if compact else 0}:{1 if include_meta else 0}"
    cached_payload = await cache.get(cache_key)
    if cached_payload is not None:
        etag = cached_payload.get("etag") if isinstance(cached_payload, dict) else None
        payload = cached_payload.get("payload") if isinstance(cached_payload, dict) else cached_payload
        if etag and request:
            inm = (request.headers.get("if-none-match") or "").strip()
            if inm == etag:
                return Response(status_code=304, headers={"ETag": etag, "Cache-Control": "private, max-age=30"})
            if response is not None:
                response.headers["ETag"] = etag
                response.headers["Cache-Control"] = "private, max-age=30"
        return payload

    total = await ScrapedJob.find(ScrapedJob.created_at >= cutoff).count()
    jobs = (
        await ScrapedJob.find(ScrapedJob.created_at >= cutoff)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )

    payload: Any
    if compact:
        items = [
            {
                "id": str(job.id),
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "link": job.link,
                "created_at": job.created_at,
            }
            for job in jobs
        ]
    else:
        items = [{**job.dict(), "id": str(job.id)} for job in jobs]

    if include_meta:
        payload = create_offset_paginated_response(items, total, skip, limit).model_dump()
    else:
        payload = items

    etag_seed = {
        "days": safe_days,
        "skip": skip,
        "limit": limit,
        "compact": compact,
        "total": total,
        "first": items[0]["id"] if items else None,
        "last": items[-1]["id"] if items else None,
    }
    etag = f'W/"{hashlib.md5(json.dumps(etag_seed, sort_keys=True, default=str).encode()).hexdigest()}"'

    if request:
        inm = (request.headers.get("if-none-match") or "").strip()
        if inm == etag:
            return Response(status_code=304, headers={"ETag": etag, "Cache-Control": "private, max-age=30"})

    if response is not None:
        response.headers["ETag"] = etag
        response.headers["Cache-Control"] = "private, max-age=30"

    await cache.set(cache_key, {"etag": etag, "payload": payload}, expire=30)
    return payload


@router.get("/stats")
async def get_stats(
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Get job statistics for the current user."""
    return await job_service.get_job_stats(current_user)


@router.get("/", response_model=Union[List[JobSchema], OffsetPaginatedResponse[JobSchema]])
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    include_meta: bool = Query(False, description="Return pagination metadata envelope"),
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """List jobs for the current user with optional filters."""
    if include_meta:
        return await job_service.get_jobs_paginated(current_user, skip, limit, status, search, sort)
    return await job_service.get_jobs(current_user, skip, limit, status, search, sort)


@router.get("/{job_id}", response_model=JobSchema)
async def read_job(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user),
) -> Any:
    """
    Get a specific job by id.
    """
    return await job_service.get_job(job_id, current_user)


@router.post("/", response_model=JobCreateResponse)
async def create_job(
    job_in: JobCreate = Body(...),
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new job or return existing if duplicate.
    """
    return await job_service.create_job_with_response(job_in, current_user)


@router.put("/{job_id}", response_model=JobSchema)
async def update_job(
    job_id: str,
    job_in: JobUpdate = Body(...),
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user),
) -> Any:
    """
    Update a job.
    """
    return await job_service.update_job(job_id, job_in, current_user)


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
    current_user: UserModel = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a job.
    """
    await job_service.delete_job(job_id, current_user)
    return {"message": "Job deleted"}
