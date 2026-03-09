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
    role: str = "user"

class RoleUpdate(BaseModel):
    role: str

@router.post("/invite")
async def invite_team_member(
    invite: TeamInvite,
    current_user: UserModel = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """
    Invite a new member to the team.
    """
    # Check if user with this email already exists
    existing_user = await user_repo.get_by_email(invite.email)
    if existing_user:
        if existing_user.team_id and str(existing_user.team_id) == str(current_user.team_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a member of this team"
            )
        # If user exists but not in team, add them to the team
        if current_user.team_id:
            await user_repo.update(str(existing_user.id), team_id=current_user.team_id, role=invite.role)
            logger.info(f"User {existing_user.id} added to team {current_user.team_id}")
            return {"message": f"User {invite.email} added to the team"}
    
    logger.info(f"Invitation sent to {invite.email} by user {current_user.id}")
    return {"message": f"Invitation sent to {invite.email}"}

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

@router.put("/members/{user_id}/role")
async def update_member_role(
    user_id: str,
    role_update: RoleUpdate,
    current_user: UserModel = Depends(deps.require_admin),
    user_repo: UserRepository = Depends(deps.get_user_repository)
) -> Any:
    """
    Update a team member's role.
    """
    # Validate role value
    valid_roles = [r.value for r in UserRole]
    if role_update.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Get the target user
    user_to_update = await user_repo.get_or_404(user_id)
    
    # Ensure user belongs to the same team
    if str(user_to_update.team_id) != str(current_user.team_id):
        raise HTTPException(status_code=404, detail="User not found in your team")
    
    # Prevent removing yourself as admin
    if str(user_to_update.id) == str(current_user.id) and role_update.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Update the role
    await user_repo.update(user_id, role=role_update.role)
    logger.info(f"User {user_id} role updated to {role_update.role} by {current_user.id}")
    
    return {"message": f"Role updated to {role_update.role}"}

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

    # Remove from team by clearing team_id
    await user_repo.update(user_id, team_id=None)
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

