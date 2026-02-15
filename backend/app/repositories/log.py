"""
Log repository for database operations using Beanie (MongoDB).
"""
from typing import List, Optional
from app.repositories.base import BaseRepository
from app.models.log import AgentLog, Log
from app.core.exceptions import DatabaseError
from app.core.logging import get_logger

logger = get_logger(__name__)

class AgentLogRepository(BaseRepository[AgentLog]):
    """Repository for AgentLog model operations."""
    
    def __init__(self) -> None:
        """Initialize agent log repository."""
        super().__init__(AgentLog)
    
    async def get_by_user(self, user_id: str) -> List[AgentLog]:
        """Get agent logs for a specific user."""
        try:
            return await AgentLog.find(AgentLog.user_id == user_id).sort("-created_at").to_list()
        except Exception as e:
            logger.error(f"Error getting agent logs for user {user_id}: {str(e)}")
            raise DatabaseError("Failed to get agent logs") from e

class LogRepository(BaseRepository[Log]):
    """Repository for Log model operations."""
    
    def __init__(self) -> None:
        """Initialize general log repository."""
        super().__init__(Log)
    
    async def get_by_user(self, user_id: str) -> List[Log]:
        """Get logs for a specific user."""
        try:
            return await Log.find(Log.user_id == user_id).sort("-created_at").to_list()
        except Exception as e:
            logger.error(f"Error getting logs for user {user_id}: {str(e)}")
            raise DatabaseError("Failed to get logs") from e
