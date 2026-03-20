import logging
from typing import List
from app.models.job_application import JobApplication

logger = logging.getLogger(__name__)

class MemoryService:
    """
    Orchestrates analytical queries against historical application data.
    Provides decision engines with ML-style heuristic feedback loops.
    """
    
    async def get_successful_patterns(self, user_id: str) -> List[str]:
        """
        Extracts successfully applied job titles or distinct keywords
        to augment future decision scoring loops.
        """
        # Fetch applications where status was 'applied' or a positive reply was logged.
        successful_applications = await JobApplication.find(
            JobApplication.user_id == user_id,
            {"$or": [{"status": "applied"}, {"reply_received": True}]}
        ).to_list()
        
        if not successful_applications:
            return []
            
        successful_roles = [app.role.lower() for app in successful_applications]
        logger.info(f"MemoryService retrieved {len(successful_roles)} successful patterns.")
        
        return successful_roles

memory_service = MemoryService()
