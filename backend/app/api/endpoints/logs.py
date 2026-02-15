"""
Optimized logs endpoints with async, caching, and pagination.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
import logging
from beanie.operators import RegEx

from app.api import deps
from app.models.log import Log
from app.models.user import User
from app.schemas.log import Log as LogSchema
from app.core.pagination import PaginationParams, PaginatedResponse, paginate
from app.core.cache import cached

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=PaginatedResponse[LogSchema])
@cached(expire=30, key_prefix="logs_list")
async def list_logs(
    pagination: PaginationParams = Depends(),
    level: Optional[str] = None,
    action: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
) -> PaginatedResponse[LogSchema]:
    """
    List logs with pagination and filtering.
    """
    # Build query
    query = Log.find(Log.user_id == current_user.id)
    
    # Apply filters
    if level:
        query = query.find(Log.level == level)
    
    if action:
        # Regex search for action (ilike equivalent)
        query = query.find(RegEx(Log.action, action, "i"))
    
    # Order by created_at descending
    query = query.sort("-created_at")
    
    # Paginate
    items, total = await paginate(query, pagination)
    
    return PaginatedResponse.create(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )


@router.get("/{log_id}", response_model=LogSchema)
async def get_log(
    log_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Log:
    """Get log by ID."""
    log = await Log.get(log_id)
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log not found"
        )
    
    # Check ownership
    if log.user_id != current_user.id:  # Assuming Log stores user_id as matched type
        # In Beanie, user_id might be str or Link.
        # Log model in step 467: `user_id: str`.
        # User.id is PydanticObjectId (str).
        # Need to ensure string comparison.
        if str(log.user_id) != str(current_user.id):
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, # Obfuscate existence?
                detail="Log not found"
            )

    return log


@router.get("/test")
async def test_logging():
    """
    Test logging levels.
    """
    logger.debug("Debug log test")
    logger.info("Info log test")
    logger.warning("Warning log test")
    logger.error("Error log test (simulated)")
    
    return {
        "message": "Logging test completed. Check console/logs.",
        "levels_tested": ["DEBUG", "INFO", "WARNING", "ERROR"]
    }
