import logging
import json
from typing import Optional, Any
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.ai import ai_client
from app.core.config import settings
from app.models.log import AgentLog
import time

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = ai_client.get_client()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((json.JSONDecodeError, Exception)),
        reraise=True
    )
    async def _generate_json(self, prompt: str, model: str) -> dict:
        """
        Helper to generate and validate JSON response.
        Retries on JSON errors or API failures.
        """
        response_text = await self.generate_text(prompt, model=model, json_mode=True)
        # Validate and parse JSON
        return json.loads(response_text)

    async def generate_text(self, prompt: str, model: str = None, json_mode: bool = False) -> str:
        """
        Generates text using Groq (via OpenAI SDK) asynchronously.
        """
        client = ai_client.get_async_client()
        if not client:
            return self._mock_response(prompt)
            
        try:
            # use fast model by default if not specified
            model_to_use = model or settings.AI_MODEL_FAST
            
            kwargs = {
                "model": model_to_use,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            }
            
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            
            start_time = time.time()
            response = await client.chat.completions.create(**kwargs)
            duration = (time.time() - start_time) * 1000
            
            content = response.choices[0].message.content or ""
            
            # Log to AgentLog
            try:
                await AgentLog(
                    agent_name="AIService",
                    input={"prompt": prompt, "model": model_to_use, "json_mode": json_mode},
                    output={"content": content},
                    execution_time_ms=duration,
                    # user_id should be passed if available, but for now we log globally
                ).insert()
            except Exception as log_err:
                logger.error(f"Failed to log AI call: {log_err}")
                
            return content
        except Exception as e:
            logger.error(f"AI API error: {e}")
            return self._mock_response(prompt)

    async def generate_structured_resume(self, job_description: str) -> dict:
        prompt = f"""
        You are an AI job automation assistant. Your goal is to rewrite and optimize resume content to match the provided job description.
        
        Job Description:
        {job_description[:2000]}...
        
        Output valid JSON with the following structure:
        {{
            "summary": "Professional summary optimized for the job",
            "skills": ["List", "of", "relevant", "skills"],
            "experience": [
                {{
                    "title": "Job Title",
                    "content": ["Optimized bullet point 1", "Optimized bullet point 2"]
                }}
            ],
            "education": [
                {{
                     "title": "Degree / University",
                     "content": ["Details"]
                }}
            ]
        }}
        """
        return await self._generate_json(prompt, model=settings.AI_MODEL_FAST)

    async def generate_resume_content(self, job_description: str) -> str:
        prompt = f"""
        You are an AI job automation assistant. Your goal is to rewrite and optimize resume bullet points to match the provided job description.
        Output only the optimized resume content.
        
        Job Description:
        {job_description[:2000]}...
        """
        return await self.generate_text(prompt, model=settings.AI_MODEL_FAST)

    async def generate_resume_bullets(self, bullet: str, job_description: str) -> str:
        prompt = f"""
        Rewrite the following resume bullet point to make it more impactful and relevant to the job description.
        
        Job Description:
        {job_description[:500]}...
        
        Original Bullet:
        {bullet}
        
        Optimized Bullet:
        """
        return await self.generate_text(prompt)

    async def generate_structured_cover_letter(self, resume_summary: str, job_description: str, company_name: str) -> dict:
        prompt = f"""
        Write a professional cover letter for {company_name}.
        
        Job Description:
        {job_description[:1000]}...
        
        Resume Summary:
        {resume_summary}
        
        Output valid JSON with the following structure:
        {{
            "recipient": "Hiring Manager",
            "company": "{company_name}",
            "content": "The body of the cover letter...",
            "tone": "professional"
        }}
        """
        return await self._generate_json(prompt, model=settings.AI_MODEL_SMART)

    async def generate_cover_letter(self, resume_summary: str, job_description: str, company_name: str) -> str:
        prompt = f"""
        Write a professional cover letter for {company_name}.
        
        Job Description:
        {job_description[:1000]}...
        
        Resume Summary:
        {resume_summary}
        
        Cover Letter:
        """
        return await self.generate_text(prompt, model=settings.AI_MODEL_SMART)

    async def personalize_email(self, template: str, company_name: str, role: str) -> str:
        prompt = f"""
        Personalize the following email template for {company_name} hiring a {role}.
        Keep it professional and concise.
        
        Template:
        {template}
        
        Personalized Email:
        """
        return await self.generate_text(prompt)

    async def parse_resume(self, resume_text: str) -> dict:
        """
        Parse raw resume text into structured JSON.
        """
        prompt = f"""
        You are an expert HR data parser. Extract structured information from the following resume text.
        
        Resume Text:
        {resume_text[:4000]}
        
        Output valid JSON with the following structure:
        {{
            "personal_info": {{
                "name": "Full Name",
                "email": "email@example.com",
                "phone": "Phone Number",
                "links": ["LinkedIn", "GitHub", "Portfolio"]
            }},
            "summary": "Professional summary",
            "skills": ["Skill 1", "Skill 2"],
            "experience": [
                {{
                    "company": "Company Name",
                    "title": "Job Title",
                    "period": "Start - End",
                    "responsibilities": ["Bullet 1", "Bullet 2"]
                }}
            ],
            "education": [
                {{
                    "institution": "University Name",
                    "degree": "Degree Earned",
                    "year": "Year"
                }}
            ]
        }}
        """
        return await self._generate_json(prompt, model=settings.AI_MODEL_FAST)

    def _mock_response(self, prompt: str) -> str:
        """Fallback mock response."""
        logger.warning("Returning mock AI response.")
        return f"[MOCK AI RESPONSE] Processed: {prompt[:50]}..."

# Global instance
ai_service = AIService()
