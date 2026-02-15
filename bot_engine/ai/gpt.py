import os
import openai
from typing import List

# openai.api_key = os.getenv("OPENAI_API_KEY")

def gpt_rewrite_bullets(bullets: List[str]) -> List[str]:
    """
    Rewrites resume bullet points to be more impactful using GPT.
    """
    rewritten_bullets = []
    for bullet in bullets:
        # Placeholder for actual API call
        # response = openai.Completion.create(...)
        rewritten_bullets.append(f"Optimized: {bullet} (Measurable Impact Added)")
    return rewritten_bullets

def generate_cover_letter_gpt(resume_text: str, job_description: str) -> str:
    """
    Generates a personalized cover letter based on resume and job description.
    """
    # Placeholder
    return f"""
    Dear Hiring Manager,
    
    I am writing to express my interest in the position...
    Based on my experience: {resume_text[:50]}...
    I believe I am a great fit for: {job_description[:50]}...
    
    Sincerely,
    [Your Name]
    """
