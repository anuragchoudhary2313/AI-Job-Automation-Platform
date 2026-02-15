"""
Match service for resume-job matching using AI.
"""
from typing import Optional, Dict, Any
from app.services.ai_service import ai_service
from app.repositories.match import MatchRepository
from app.models.match import Match
from app.models.resume import Resume
from app.models.job import Job
from app.core.logging import get_logger

logger = get_logger(__name__)

class MatchService:
    """Service for matching resumes with jobs."""
    
    def __init__(self, match_repo: MatchRepository):
        self.match_repo = match_repo
        
    async def match_resume_with_job(self, resume: Resume, job: Job) -> Match:
        """
        Match a resume with a job description using AI.
        Returns a Match object with score and reasoning.
        """
        logger.info(f"Matching resume {resume.id} with job {job.id}")
        
        prompt = f"""
        Analyze the match between the following resume and job description.
        
        Resume:
        {resume.content[:2000]}
        
        Job Description:
        {job.description[:2000]}
        
        Output valid JSON with the following structure:
        {{
            "match_score": 0.85,
            "reasoning": "A concise explanation of the match.",
            "confidence_score": 0.95
        }}
        """
        
        try:
            # Use AIService to get structured matching data
            match_data = await ai_service._generate_json(prompt, model="llama3-70b-8192")
            
            # Create match record
            match = await self.match_repo.create(
                user_id=resume.user_id,
                resume_id=resume.id,
                job_id=job.id,
                match_score=match_data.get("match_score", 0.0),
                reasoning=match_data.get("reasoning", "No reasoning provided."),
                # confidence_score is not in the Match model yet, but we can add it or just log it
            )
            
            return match
            
        except Exception as e:
            logger.error(f"Error matching resume {resume.id} with job {job.id}: {e}")
            # Return a default low-score match on failure
            return await self.match_repo.create(
                user_id=resume.user_id,
                resume_id=resume.id,
                job_id=job.id,
                match_score=0.0,
                reasoning=f"Matching failed: {str(e)}"
            )
