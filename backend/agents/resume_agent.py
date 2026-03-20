import logging
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

class ResumeAgent:
    """Generates a tailored resume for a given job."""
    
    async def generate(self, job_description: str) -> str:
        logger.info("ResumeAgent crafting tailored resume...")
        return await ai_service.generate_resume_content(job_description)
