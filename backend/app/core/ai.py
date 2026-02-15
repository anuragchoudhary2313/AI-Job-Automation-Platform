"""
Centralized AI Client for Groq (via OpenAI SDK).
Permissions:
- Never expose API keys to frontend.
- Use validated model outputs.
"""
from openai import OpenAI, AsyncOpenAI
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIClient:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or settings.OPENAI_API_KEY
        self.base_url = "https://api.groq.com/openai/v1"
        self.client = None
        self.async_client = None

        if self.api_key:
            try:
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
                self.async_client = AsyncOpenAI(
                     api_key=self.api_key,
                     base_url=self.base_url
                )
                logger.info("AI Client (Groq) initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize AI Client: {e}")
        else:
            logger.warning("GROQ_API_KEY not found. AI features will stay disabled or mock.")

    def get_client(self):
        return self.client

    def get_async_client(self):
        return self.async_client

# Global instance
ai_client = AIClient()
