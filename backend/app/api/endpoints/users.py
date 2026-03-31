"""
User management endpoints.
"""

from typing import Any, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api import deps
from app.core.exceptions import handle_exception, NotFoundError
from app.core.logging import get_logger
from app.schemas.user import User as UserSchema
from app.models.user import User
from app.repositories.user import UserRepository
from app.core.pagination import OffsetPaginatedResponse, create_offset_paginated_response

router = APIRouter()
logger = get_logger(__name__)


@router.get("/admin/users", response_model=Union[List[UserSchema], OffsetPaginatedResponse[UserSchema]])
async def read_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    include_meta: bool = Query(False, description="Return pagination metadata envelope"),
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository),
) -> Any:
    """Retrieve all users (admin only)."""
    users = await user_repo.get_all(skip=skip, limit=limit)
    if include_meta:
        total = await User.find_all().count()
        return create_offset_paginated_response(users, total, skip, limit)
    return users


@router.get("/admin/users/{user_id}", response_model=UserSchema)
async def read_user_by_id(
    user_id: str,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository),
) -> Any:
    """Get a specific user by id (admin only)."""
    try:
        user = await user_repo.get_or_404(user_id)
        return user
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
