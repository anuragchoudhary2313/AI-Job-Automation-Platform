from fastapi import APIRouter
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter()

class FeatureFlagsResponse(BaseModel):
    ai_resume: bool
    ai_cover_letter: bool
    email_automation: bool
    job_scraping: bool
    auto_apply: bool
    teams: bool
    admin_panel: bool

@router.get("/", response_model=FeatureFlagsResponse)
def get_features():
    """
    Get current state of all feature flags.
    Public endpoint for frontend configuration.
    """
    return {
        "ai_resume": settings.FEATURE_AI_RESUME,
        "ai_cover_letter": settings.FEATURE_AI_COVER_LETTER,
        "email_automation": settings.FEATURE_EMAIL_AUTOMATION,
        "job_scraping": settings.FEATURE_JOB_SCRAPING,
        "auto_apply": settings.FEATURE_AUTO_APPLY,
        "teams": settings.FEATURE_TEAMS,
        "admin_panel": settings.FEATURE_ADMIN_PANEL
    }
