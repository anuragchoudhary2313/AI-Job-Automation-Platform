from app.core.config import settings
from fastapi import HTTPException, status

class FeatureManager:
    """
    Centralized manager for feature flags.
    Enforces feature availability.
    """
    
    @staticmethod
    def is_enabled(feature_name: str) -> bool:
        """
        Check if a feature is enabled.
        Case-insensitive matching against FEATURE_ keys in settings.
        """
        # Normalize name (e.g. "ai_resume" -> "FEATURE_AI_RESUME")
        key = f"FEATURE_{feature_name.upper()}"
        
        if hasattr(settings, key):
            return getattr(settings, key)
            
        # If flag doesn't exist, default to False for safety
        return False

    @staticmethod
    def require(feature_name: str):
        """
        Raise 403 if feature is disabled.
        Used as a dependency or inline check.
        """
        if not FeatureManager.is_enabled(feature_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature_name}' is currently disabled."
            )

features = FeatureManager()
