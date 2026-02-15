"""
Application configuration with security settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings with environment variables."""
    
    # API Settings
    PROJECT_NAME: str = "AI Job Automation Platform"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # Security Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]
    
    # Production CORS (override in .env)
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Database - MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "job_automation"

    # Feature Flags
    JOB_SCRAPING_ENABLED: bool = True
    FEATURE_AI_RESUME: bool = True
    FEATURE_AI_COVER_LETTER: bool = True
    FEATURE_EMAIL_AUTOMATION: bool = True
    FEATURE_JOB_SCRAPING: bool = True
    FEATURE_AUTO_APPLY: bool = True
    FEATURE_TEAMS: bool = True
    FEATURE_ADMIN_PANEL: bool = True
    
    MAX_CONNECTIONS_COUNT: int = 10
    MIN_CONNECTIONS_COUNT: int = 10
    
    # API Keys
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # AI Settings
    AI_MODEL_FAST: str = "llama3-70b-8192"
    AI_MODEL_SMART: str = "llama3-70b-8192"
    
    # Telegram Settings
    TELEGRAM_ENABLED: bool = False
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None

    EMAIL_ENABLED: bool = True
    
    # Email Settings
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    
    # Legacy Email Aliases (for sender.py)
    @property
    def EMAIL_HOST(self): return self.SMTP_HOST
    @property
    def EMAIL_PORT(self): return self.SMTP_PORT
    @property
    def EMAIL_USER(self): return self.SMTP_USER
    @property
    def EMAIL_PASSWORD(self): return self.SMTP_PASSWORD
    @property
    def EMAIL_FROM_NAME(self): return self.PROJECT_NAME
    EMAIL_USE_SSL: bool = True
    
    # Scheduler
    SCHEDULER_TIMEZONE: str = "UTC"
    SCHEDULER_ENABLED: bool = True

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_CALLS: int = 100
    RATE_LIMIT_PERIOD: int = 60
    
    # CSRF
    ENABLE_CSRF_PROTECTION: bool = False
    CSRF_SECRET_KEY: Optional[str] = None
    
    ENVIRONMENT: str = "development"

    
    @property
    def is_production(self) -> bool:
        return not self.DEBUG

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
