"""
Team repository for database operations using Beanie (MongoDB).
"""

from typing import Optional

from app.repositories.base import BaseRepository
from app.models.team import Team
from app.core.exceptions import DatabaseError
from app.core.logging import get_logger

logger = get_logger(__name__)


class TeamRepository(BaseRepository[Team]):
    """Repository for Team model operations."""
    
    def __init__(self) -> None:
        """Initialize team repository."""
        super().__init__(Team)
    
    async def get_by_name(self, name: str) -> Optional[Team]:
        """Get team by name."""
        try:
            return await Team.find_one(Team.name == name)
        except Exception as e:
            logger.error(f"Error getting team by name {name}: {str(e)}")
            raise DatabaseError("Failed to get team by name") from e
    
    async def get_with_members(self, team_id: str) -> Optional[Team]:
        """
        Get team with members loaded.
        In MongoDB/Beanie, since we don't have a members list in Team document,
        this just returns the team. Service layer should fetch members if needed.
        """
        try:
            return await self.get_by_id(team_id)
        except Exception as e:
            logger.error(f"Error getting team with members {team_id}: {str(e)}")
            raise DatabaseError("Failed to get team with members") from e
    
    async def get_member_count(self, team_id: str) -> int:
        """Get number of members in a team."""
        try:
            from app.models.user import User
            return await User.find(User.team_id == team_id).count()
        except Exception as e:
            logger.error(f"Error counting team members {team_id}: {str(e)}")
            raise DatabaseError("Failed to count team members") from e
