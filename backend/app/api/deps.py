from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

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

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Database session dependency removed as Beanie uses global connection


async def get_current_user(token: str = Depends(reusable_oauth2)) -> User:
    """
    Get current authenticated user from JWT token.
    """
    logger.info("Starting get_current_user authentication")
    try:
        logger.info(f"Decoding token: {token[:20]}...")
        payload = security.decode_token(token)
        token_data = TokenPayload(**payload)
        logger.info(f"Token decoded successfully, user_id: {token_data.sub}")
    except (JWTError, Exception) as e:
        logger.info(f"Token decode failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    # Reject refresh tokens used as access tokens
    if not security.verify_token_type(payload, security.ACCESS_TOKEN_TYPE):
        logger.info("Invalid token type - refresh token used as access token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    logger.info(f"Looking up user with ID: {token_data.sub}")
    user = await User.get(token_data.sub)

    if not user:
        logger.info(f"User not found with ID: {token_data.sub}")
        raise HTTPException(status_code=404, detail="User not found")

    logger.info(f"User found successfully: {user.username} (team_id: {user.team_id})")
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
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def require_team_member(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require at least team member (USER) role."""
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
