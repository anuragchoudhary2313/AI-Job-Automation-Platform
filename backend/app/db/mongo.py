"""
MongoDB connection and init using Beanie.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.core.logging import get_logger

from app.models.user import User
from app.models.team import Team
from app.models.resume import Resume
from app.models.job import Job
from app.models.match import Match
from app.models.automation import AutomationRun
from app.models.log import AgentLog

logger = get_logger(__name__)

async def init_db():
    """Initialize MongoDB connection and Beanie ODM."""
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        database = client[settings.MONGODB_DB_NAME]
        
        document_models = [
            User, 
            Team, 
            Resume, 
            Job, 
            Match, 
            AutomationRun, 
            AgentLog
        ]
        
        await init_beanie(database=database, document_models=document_models)
        logger.info(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise e
