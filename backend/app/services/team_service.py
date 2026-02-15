"""
Team service for team-related business logic.
"""

from typing import List, Dict, Any

from app.core.exceptions import NotFoundError, ConflictError, AuthorizationError
from app.core.logging import get_logger
from app.repositories.team import TeamRepository
from app.repositories.user import UserRepository
from app.models.team import Team
from app.models.user import User

logger = get_logger(__name__)


class TeamService:
    """Service for team operations."""
    
    def __init__(
        self,
        team_repo: TeamRepository,
        user_repo: UserRepository
    ) -> None:
        """Initialize team service."""
        self.team_repo = team_repo
        self.user_repo = user_repo
    
    async def get_team(self, team_id: str) -> Team:
        """Get team by ID."""
        return await self.team_repo.get_or_404(team_id)
    
    async def get_team_with_members(self, team_id: str) -> Team:
        """Get team with members loaded."""
        team = await self.team_repo.get_with_members(team_id)
        
        if not team:
            raise NotFoundError("Team", team_id)
        
        return team
    
    async def create_team(self, name: str, description: str = None) -> Team:
        """Create a new team."""
        # Check if team name exists
        existing_team = await self.team_repo.get_by_name(name)
        if existing_team:
            raise ConflictError(f"Team name '{name}' already exists")
        
        # Create team
        team = await self.team_repo.create(
            name=name
            # description=description # Team model in step 467 only has name, timestamps. No description.
        )
        
        logger.info(f"Created team {team.id}")
        return team
    
    async def get_team_members(self, team_id: str, user: User) -> List[User]:
        """Get all members of a team."""
        # Check authorization
        if str(user.team_id) != team_id:
            raise AuthorizationError("You don't have access to this team")
        
        members = await self.user_repo.get_team_members(team_id)
        
        logger.info(f"Retrieved {len(members)} members for team {team_id}")
        return members
    
    async def get_team_stats(self, team_id: str, user: User) -> Dict[str, Any]:
        """Get team statistics."""
        # Check authorization
        if str(user.team_id) != team_id:
            raise AuthorizationError("You don't have access to this team")
        
        # Get member count
        member_count = await self.team_repo.get_member_count(team_id)
        
        stats = {
            "team_id": team_id,
            "member_count": member_count
        }
        
        logger.info(f"Retrieved stats for team {team_id}")
        return stats
