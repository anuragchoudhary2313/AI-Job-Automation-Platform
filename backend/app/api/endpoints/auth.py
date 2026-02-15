"""
Refactored authentication endpoints using service layer.
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm

from app.api import deps
from app.core.exceptions import AuthenticationError, ConflictError, ValidationError, handle_exception
from app.core.logging import get_logger
from app.repositories.user import UserRepository
from app.repositories.team import TeamRepository
from app.services.auth_service import AuthService
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema

router = APIRouter()
logger = get_logger(__name__)


def get_auth_service(
    user_repo: UserRepository = Depends(deps.get_user_repository),
    team_repo: TeamRepository = Depends(deps.get_team_repository)
) -> AuthService:
    """Dependency for auth service."""
    return AuthService(user_repo, team_repo)


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    """OAuth2 compatible token login."""
    try:
        # Login user
        user, tokens = await auth_service.login(
            email=form_data.username,  # OAuth2 uses username field
            password=form_data.password
        )
        
        # Set refresh token as HTTP-only cookie
        response.set_cookie(
            key="refresh_token",
            value=tokens.refresh_token,
            httponly=True,
            secure=True,  # HTTPS only in production
            samesite="lax",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        logger.info(f"User {user.id} logged in successfully")
        
        return tokens
        
    except (AuthenticationError, ValidationError) as e:
        raise handle_exception(e)
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    """Register a new user."""
    try:
        user = await auth_service.register_user(user_data)
        
        logger.info(f"User {user.id} registered successfully")
        
        return user
        
    except (ConflictError, ValidationError) as e:
        raise handle_exception(e)
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    """Refresh access token using refresh token."""
    try:
        # Create new access token via service (centralized logic)
        access_token = await auth_service.refresh_access_token(refresh_token)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
        
    except AuthenticationError as e:
        raise handle_exception(e)
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during token refresh"
        )


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get current user information."""
    return current_user


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(deps.get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    """Change user password."""
    try:
        await auth_service.change_password(
            user_id=str(current_user.id),
            current_password=current_password,
            new_password=new_password
        )
        
        logger.info(f"Password changed for user {current_user.id}")
        
        return {"message": "Password changed successfully"}
        
    except (AuthenticationError, ValidationError) as e:
        raise handle_exception(e)
    except Exception as e:
        logger.error(f"Password change error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during password change"
        )
