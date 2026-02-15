"""
Authentication service for user authentication and authorization.
"""

from typing import Tuple
from datetime import datetime, timedelta
from jose import jwt

from app.core import security
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ValidationError
from app.core.logging import get_logger
from app.repositories.user import UserRepository
from app.repositories.team import TeamRepository
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.token import Token

logger = get_logger(__name__)


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, user_repo: UserRepository, team_repo: TeamRepository) -> None:
        """Initialize auth service."""
        self.user_repo = user_repo
        self.team_repo = team_repo
    
    async def authenticate_user(self, email: str, password: str) -> User:
        """Authenticate user with email/username and password."""
        # Try finding by email first
        user = await self.user_repo.get_by_email(email)
        
        # If not found, try finding by username
        if not user:
            user = await self.user_repo.get_by_username(email)
        
        if not user:
            logger.warning(f"Authentication failed: User not found for login identifier {email}")
            raise AuthenticationError("Incorrect email or password")
        
        if not security.verify_password(password, user.password_hash):
            logger.warning(f"Authentication failed: Invalid password for user {user.id}")
            raise AuthenticationError("Incorrect email or password")
        
        logger.info(f"User {user.id} authenticated successfully")
        return user
    
    async def register_user(self, user_data: UserCreate) -> User:
        """Register a new user."""
        # Validate password strength
        if len(user_data.password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        
        # Hash password
        hashed_password = security.get_password_hash(user_data.password)
        
        # Default username if missing (use email prefix)
        username = user_data.username
        if not username:
            username = user_data.email.split('@')[0]
            # Add uniqueness check or random suffix if needed, but for now simple fallback
            logger.info(f"Generated default username '{username}' for {user_data.email}")
        
        # Handle team creation/retrieval
        team_id = None
        team_name = user_data.team_name or "Default Team"
        
        team = await self.team_repo.get_by_name(team_name)
        if not team:
            team = await self.team_repo.create(name=team_name)
            logger.info(f"Created new team '{team_name}' for user registration")
        
        # Convert ObjectId to string
        team_id = str(team.id)
        
        # Create user
        user = await self.user_repo.create_user(
            email=user_data.email,
            username=username,
            password_hash=hashed_password,
            full_name=user_data.full_name,
            team_id=team_id
        )
        
        logger.info(f"User {user.id} registered successfully")
        return user
    
    def create_access_token(self, user_id: str) -> str:
        """Create access token for user."""
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "access"
        }
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    def create_refresh_token(self, user_id: str) -> str:
        """Create refresh token for user."""
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh"
        }
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    def create_tokens(self, user_id: str) -> Token:
        """Create access and refresh tokens."""
        access_token = self.create_access_token(user_id)
        refresh_token = self.create_refresh_token(user_id)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
    
    async def login(self, email: str, password: str) -> Tuple[User, Token]:
        """Login user and create tokens."""
        user = await self.authenticate_user(email, password)
        tokens = self.create_tokens(str(user.id))
        
        return user, tokens
    
    async def refresh_access_token(self, refresh_token: str) -> str:
        """Verify refresh token and create new access token."""
        try:
            payload = security.decode_token(refresh_token)
            
            if not security.verify_token_type(payload, security.REFRESH_TOKEN_TYPE):
                raise AuthenticationError("Invalid token type")
                
            user_id = payload.get("sub")
            if not user_id:
                raise AuthenticationError("Token subject missing")
                
            return self.create_access_token(user_id)
            
        except JWTError:
            raise AuthenticationError("Invalid or expired refresh token")

    async def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str
    ) -> None:
        """Change user password."""
        user = await self.user_repo.get_or_404(user_id)
        
        # Verify current password
        if not security.verify_password(current_password, user.password_hash):
            raise AuthenticationError("Current password is incorrect")
        
        # Validate new password
        if len(new_password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        
        # Update password
        hashed_password = security.get_password_hash(new_password)
        await self.user_repo.update(user_id, password_hash=hashed_password)
        
        logger.info(f"Password changed for user {user_id}")
