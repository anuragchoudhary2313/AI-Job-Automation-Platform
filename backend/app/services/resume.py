"""
Resume generation service with retry logic and fault tolerance.
"""
import logging
from typing import Dict, Any, Optional
import asyncio
from openai import OpenAI, OpenAIError

from app.core.config import settings
from app.core.retry import async_retry_with_backoff, timeout, CircuitBreaker

logger = logging.getLogger(__name__)

# Circuit breaker for OpenAI API
openai_circuit_breaker = CircuitBreaker(
    failure_threshold=3,
    recovery_timeout=180,  # 3 minutes
    expected_exception=OpenAIError
)


class ResumeService:
    """Resume generation service with retry logic."""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    @async_retry_with_backoff(
        max_retries=3,
        initial_delay=2.0,
        max_delay=30.0,
        exceptions=(OpenAIError, TimeoutError, ConnectionError)
    )
    @timeout(120)  # 2 minute timeout
    async def generate_resume(
        self,
        job_description: str,
        user_profile: Dict[str, Any],
        template: str = "professional"
    ) -> str:
        """
        Generate customized resume using AI.
        
        Args:
            job_description: Job description to tailor resume for
            user_profile: User's profile data (skills, experience, etc.)
            template: Resume template to use
            
        Returns:
            Generated resume content
            
        Raises:
            OpenAIError: If generation fails after retries
            TimeoutError: If generation takes too long
        """
        try:
            logger.info(f"Generating resume for job: {job_description[:50]}...")
            
            # Use circuit breaker
            resume_content = await asyncio.to_thread(
                openai_circuit_breaker.call,
                self._generate_resume_internal,
                job_description,
                user_profile,
                template
            )
            
            logger.info("Resume generated successfully")
            return resume_content
            
        except Exception as e:
            logger.error(f"Failed to generate resume: {e}", exc_info=True)
            raise
    
    def _generate_resume_internal(
        self,
        job_description: str,
        user_profile: Dict[str, Any],
        template: str
    ) -> str:
        """Internal resume generation logic."""
        prompt = self._build_prompt(job_description, user_profile, template)
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional resume writer. Create tailored, ATS-friendly resumes."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
    
    def _build_prompt(
        self,
        job_description: str,
        user_profile: Dict[str, Any],
        template: str
    ) -> str:
        """Build prompt for resume generation."""
        return f"""
Create a professional resume tailored for this job:

JOB DESCRIPTION:
{job_description}

CANDIDATE PROFILE:
Name: {user_profile.get('name', 'N/A')}
Email: {user_profile.get('email', 'N/A')}
Skills: {', '.join(user_profile.get('skills', []))}
Experience: {user_profile.get('experience', 'N/A')}
Education: {user_profile.get('education', 'N/A')}

TEMPLATE: {template}

Generate a complete, professional resume that:
1. Highlights relevant skills and experience
2. Uses keywords from the job description
3. Is ATS-friendly
4. Follows the {template} template format
5. Is concise and impactful

Return only the resume content, no additional commentary.
"""
    
    @async_retry_with_backoff(
        max_retries=2,
        initial_delay=1.0,
        exceptions=(OpenAIError,)
    )
    @timeout(60)
    async def generate_cover_letter(
        self,
        job_description: str,
        user_profile: Dict[str, Any],
        company_name: str
    ) -> str:
        """
        Generate customized cover letter.
        
        Args:
            job_description: Job description
            user_profile: User's profile data
            company_name: Company name
            
        Returns:
            Generated cover letter content
        """
        try:
            logger.info(f"Generating cover letter for {company_name}")
            
            prompt = f"""
Write a professional cover letter for this job at {company_name}:

JOB DESCRIPTION:
{job_description}

CANDIDATE:
{user_profile.get('name', 'N/A')}

Make it personalized, enthusiastic, and professional.
"""
            
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a professional cover letter writer."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=1000
            )
            
            logger.info("Cover letter generated successfully")
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Failed to generate cover letter: {e}", exc_info=True)
            raise


# Singleton instance
resume_service = ResumeService()
