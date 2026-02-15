"""
User repository for database operations using Beanie (MongoDB).
"""

from typing import Optional, List
from app.repositories.base import BaseRepository
from app.models.user import User
from app.core.exceptions import ConflictError, DatabaseError
from app.core.logging import get_logger

logger = get_logger(__name__)


class UserRepository(BaseRepository[User]):
    """Repository for User model operations."""
    
    def __init__(self) -> None:
        """Initialize user repository."""
        super().__init__(User)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        try:
            return await User.find_one(User.email == email)
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {str(e)}")
            raise DatabaseError("Failed to get user by email") from e
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        try:
            return await User.find_one(User.username == username)
        except Exception as e:
            logger.error(f"Error getting user by username {username}: {str(e)}")
            raise DatabaseError("Failed to get user by username") from e
    
    async def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        user = await self.get_by_email(email)
        return user is not None
    
    async def username_exists(self, username: str) -> bool:
        """Check if username already exists."""
        user = await self.get_by_username(username)
        return user is not None
    
    async def create_user(
        self,
        email: str,
        username: str,
        password_hash: str,
        full_name: Optional[str] = None,
        team_id: Optional[str] = None
    ) -> User:
        """Create a new user with validation."""
        # Check for existing email
        if await self.email_exists(email):
            raise ConflictError(f"Email '{email}' already exists")
        
        # Check for existing username
        if await self.username_exists(username):
            raise ConflictError(f"Username '{username}' already exists")
        
        # Create user
        return await self.create(
            email=email,
            username=username,
            password_hash=password_hash,
            full_name=full_name,
            team_id=team_id
        )
    
    async def get_team_members(self, team_id: str) -> List[User]:
        """Get all users in a team."""
        try:
            return await User.find(User.team_id == team_id).to_list()
        except Exception as e:
            logger.error(f"Error getting team members for team {team_id}: {str(e)}")
            raise DatabaseError("Failed to get team members") from e
