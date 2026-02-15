from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError

from app.core import security
from app.core.config import settings
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.token import TokenPayload
from app.repositories.user import UserRepository
from app.repositories.job import JobRepository
from app.repositories.resume import ResumeRepository
from app.repositories.team import TeamRepository
from app.repositories.match import MatchRepository
from app.repositories.log import AgentLogRepository, LogRepository
from app.core.logging import get_logger

logger = get_logger(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

# Database session dependency removed as Beanie uses global connection

async def get_current_user(
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    Get current authenticated user from JWT token.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # In MongoDB, IDs are likely strings (ObjectIds)
    # Beanie generic get accepts the ID
    user = await User.get(token_data.sub)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    # Handle cases where role might be string or Enum
    role_name = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    admin_value = UserRole.ADMIN.value if hasattr(UserRole.ADMIN, "value") else str(UserRole.ADMIN)
    
    if role_name != admin_value:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

def require_team_member(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require team member role."""
    # Logic might need adjustment depending on how 'MEMBER' role is defined, assuming it exists
    # If not defined in Enum, this might error. Checking Enums... 
    # UserRole has ADMIN, USER. No MEMBER. 
    # Original code had MEMBER, checking...
    # The original code imported UserRole. 
    # If I removed MEMBER from Enum, this breaks. 
    # My enum had ADMIN, USER. 
    # I should update generic access to allow USER (which is member).
    
    if current_user.role not in [UserRole.ADMIN, UserRole.USER]:
        raise HTTPException(
             status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

def get_user_repository() -> UserRepository:
    """Dependency for user repository."""
    return UserRepository()

def get_job_repository() -> JobRepository:
    """Dependency for job repository."""
    return JobRepository()

def get_resume_repository() -> ResumeRepository:
    """Dependency for resume repository."""
    return ResumeRepository()

def get_team_repository() -> TeamRepository:
    """Dependency for team repository."""
    return TeamRepository()

def get_match_repository() -> MatchRepository:
    """Dependency for match repository."""
    return MatchRepository()

def get_agent_log_repository() -> AgentLogRepository:
    """Dependency for agent log repository."""
    return AgentLogRepository()

def get_log_repository() -> LogRepository:
    """Dependency for general log repository."""
    return LogRepository()
