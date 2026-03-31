from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class FeatureFlagsResponse(BaseModel):
    ai_resume: bool
    ai_cover_letter: bool
    email_automation: bool
    job_scraping: bool
    auto_apply: bool
    admin_panel: bool

@router.get("/", response_model=FeatureFlagsResponse)
def get_features():
    """
    Get current state of all feature flags.
    Public endpoint for frontend configuration.
    """
    from app.core.features import features
    return {
        "ai_resume": features.is_enabled("ai_resume"),
        "ai_cover_letter": features.is_enabled("ai_cover_letter"),
        "email_automation": features.is_enabled("email_automation"),
        "job_scraping": features.is_enabled("job_scraping"),
        "auto_apply": features.is_enabled("auto_apply"),
        "admin_panel": features.is_enabled("admin_panel")
    }
