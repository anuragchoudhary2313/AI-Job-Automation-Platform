from typing import TypedDict, List, Optional, Dict, Any
from langgraph.graph import StateGraph, END
import logging
import json
import time
from app.services.ai_service import ai_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class JobMatchState(TypedDict):
    job_description: str
    resume_text: str
    job_analysis: Optional[Dict[str, Any]]
    resume_analysis: Optional[Dict[str, Any]]
    match_result: Optional[Dict[str, Any]]
    recommendations: Optional[List[str]]
    error: Optional[str]

async def analyze_job_node(state: JobMatchState) -> Dict[str, Any]:
    """Extract key requirements and skills from the job description."""
    prompt = f"""
    Analyze this job description and extract:
    1. Key technical skills required.
    2. Soft skills and cultural fit.
    3. Minimum experience levels.
    4. Top 3 primary responsibilities.
    
    Job Description:
    {state['job_description'][:2000]}
    
    Output JSON:
    {{
        "tech_skills": [],
        "soft_skills": [],
        "experience_years": 0,
        "responsibilities": []
    }}
    """
    try:
        analysis = await ai_service._generate_json(prompt, model=settings.AI_MODEL_FAST)
        return {"job_analysis": analysis}
    except Exception as e:
        logger.error(f"Job analysis failed: {e}")
        return {"error": "Failed to analyze job description"}

async def analyze_resume_node(state: JobMatchState) -> Dict[str, Any]:
    """Parse resume and extract user skills/experience."""
    prompt = f"""
    Extract key skills and experience highlights from this resume.
    
    Resume:
    {state['resume_text'][:4000]}
    
    Output JSON:
    {{
        "skills": [],
        "experience_summary": ""
    }}
    """
    try:
        analysis = await ai_service._generate_json(prompt, model=settings.AI_MODEL_FAST)
        return {"resume_analysis": analysis}
    except Exception as e:
        logger.error(f"Resume analysis failed: {e}")
        return {"error": "Failed to analyze resume"}

async def calculate_match_node(state: JobMatchState) -> Dict[str, Any]:
    """Perform semantic matching and scoring."""
    if state.get("error"):
        return {}
        
    prompt = f"""
    Compare the following Job Analysis and Resume Analysis. 
    Calculate a match score (0-100) and identify specific skill gaps.
    
    Job Analysis: {json.dumps(state['job_analysis'])}
    Resume Analysis: {json.dumps(state['resume_analysis'])}
    
    Output JSON:
    {{
        "score": 85,
        "matching_skills": [],
        "missing_skills": [],
        "fit_summary": ""
    }}
    """
    try:
        match_result = await ai_service._generate_json(prompt, model=settings.AI_MODEL_FAST)
        return {"match_result": match_result}
    except Exception as e:
        logger.error(f"Match calculation failed: {e}")
        return {"error": "Failed to calculate match"}

async def generate_advice_node(state: JobMatchState) -> Dict[str, Any]:
    """Suggest specific resume edits."""
    if state.get("error"):
        return {}
        
    prompt = f"""
    Based on the Skill Gaps below, suggest 3 specific bullet point optimizations for the user's resume.
    
    Missing Skills: {state['match_result'].get('missing_skills', [])}
    Fit Summary: {state['match_result'].get('fit_summary', '')}
    
    Output a list of 3 concise strings.
    """
    try:
        # We can use simple text generation for this or structured
        advice_text = await ai_service.generate_text(prompt)
        # Parse into list (or just return as is if formatted)
        recommendations = [s.strip() for s in advice_text.split('\n') if s.strip()][:3]
        return {"recommendations": recommendations}
    except Exception as e:
        logger.error(f"Advice generation failed: {e}")
        return {"error": "Failed to generate recommendations"}

# Define the Graph
workflow = StateGraph(JobMatchState)

workflow.add_node("analyze_job", analyze_job_node)
workflow.add_node("analyze_resume", analyze_resume_node)
workflow.add_node("calculate_match", calculate_match_node)
workflow.add_node("generate_advice", generate_advice_node)

workflow.set_entry_point("analyze_job")
workflow.add_edge("analyze_job", "analyze_resume")
workflow.add_edge("analyze_resume", "calculate_match")
workflow.add_edge("calculate_match", "generate_advice")
workflow.add_edge("generate_advice", END)

# Compile
engine = workflow.compile()

class JobMatchingEngine:
    async def match(self, job_description: str, resume_text: str) -> Dict[str, Any]:
        """Execute the full matching workflow with tracing."""
        initial_state = {
            "job_description": job_description,
            "resume_text": resume_text,
            "job_analysis": None,
            "resume_analysis": None,
            "match_result": None,
            "recommendations": [],
            "error": None
        }
        
        start_time = time.time()
        final_state = await engine.ainvoke(initial_state)
        duration = (time.time() - start_time) * 1000
        
        # Log the full trace to AgentLog
        try:
            from app.models.log import AgentLog
            await AgentLog(
                agent_name="JobMatchingEngine",
                input={"job_len": len(job_description), "resume_len": len(resume_text)},
                output={
                    "score": final_state.get("match_result", {}).get("score"),
                    "recommendations": final_state.get("recommendations"),
                    "trace": {
                        "job_analysis": final_state.get("job_analysis"),
                        "resume_analysis": final_state.get("resume_analysis"),
                        "match_result": final_state.get("match_result"),
                    }
                },
                execution_time_ms=duration
            ).insert()
        except Exception as e:
            logger.error(f"Failed to log engine trace: {e}")
            
        return final_state

matching_engine = JobMatchingEngine()
