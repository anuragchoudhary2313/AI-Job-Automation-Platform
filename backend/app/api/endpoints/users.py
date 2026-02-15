"""
User management endpoints.
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException

from app.api import deps
from app.core.exceptions import handle_exception, AuthenticationError, ValidationError, NotFoundError
from app.core.logging import get_logger
from app.services.auth_service import AuthService
from app.schemas.user import User as UserSchema
from app.models.user import User
from app.repositories.user import UserRepository

router = APIRouter()
logger = get_logger(__name__)

@router.get("/users/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get current user."""
    return current_user

@router.get("/users/me/info", response_model=UserSchema)
async def read_user_info(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get current user info (alias for me)."""
    return current_user

# Note: change-password should be in auth, but if kept here:
from app.repositories.team import TeamRepository
@router.post("/users/change-password")
async def change_password_endpoint(
    current_password: str,
    new_password: str,
    current_user: User = Depends(deps.get_current_user),
    user_repo: UserRepository = Depends(deps.get_user_repository),
    team_repo: TeamRepository = Depends(deps.get_team_repository)
) -> Any:
    """Change user password."""
    auth_service = AuthService(user_repo, team_repo)
    try:
        await auth_service.change_password(
            user_id=str(current_user.id),
            current_password=current_password,
            new_password=new_password
        )
        return {"message": "Password updated successfully"}
    except (AuthenticationError, ValidationError) as e:
        raise handle_exception(e)

@router.get("/admin/users", response_model=List[UserSchema])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """Retrieve users."""
    users = await user_repo.get_all(skip=skip, limit=limit)
    return users

@router.get("/admin/users/{user_id}", response_model=UserSchema)
async def read_user_by_id(
    user_id: str,
    current_user: User = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """Get a specific user by id."""
    try:
        user = await user_repo.get_or_404(user_id)
        return user
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
