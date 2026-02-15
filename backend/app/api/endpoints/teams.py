"""
Team management endpoints.
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.core.exceptions import handle_exception, NotFoundError, ConflictError
from app.core.logging import get_logger
from app.models.user import User as UserModel
from app.models.enums import UserRole
from app.models.team import Team
from app.repositories.team import TeamRepository
from app.repositories.user import UserRepository
from app.schemas.user import User as UserSchema

router = APIRouter()
logger = get_logger(__name__)

class TeamInvite(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.USER # Changed default to USER as MEMBER was not in my Enum

@router.post("/invite")
async def invite_team_member(
    invite: TeamInvite,
    current_user: UserModel = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """
    Invite a new member to the team. 
    """
    # Mock implementation
    return {"message": "Invitation sent"}

@router.get("/members", response_model=List[UserSchema])
async def read_team_members(
    current_user: UserModel = Depends(deps.require_team_member),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """
    Get all members of the current user's team.
    """
    if not current_user.team_id:
        return []
    members = await user_repo.get_team_members(str(current_user.team_id))
    return members

@router.delete("/members/{user_id}")
async def remove_team_member(
    user_id: str,
    current_user: UserModel = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """
    Remove a member from the team.
    """
    # Ensure user belongs to the same team
    user_to_remove = await user_repo.get_or_404(user_id)
    if str(user_to_remove.team_id) != str(current_user.team_id):
        raise HTTPException(status_code=404, detail="User not found in your team")
    
    if str(user_to_remove.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    await user_repo.delete(user_id) 
    return {"message": "Team member removed"}

class TeamSettingsCheck(BaseModel):
    email_notifications: bool
    auto_apply_enabled: Optional[bool] = None

@router.put("/settings")
async def update_team_settings(
    settings: TeamSettingsCheck,
    current_user: UserModel = Depends(deps.require_admin)
) -> Any:
    """
    Update team settings.
    """
    # Mock implementation
    return {"message": "Settings updated"}
