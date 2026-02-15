from abc import ABC, abstractmethod
from typing import List, Dict
from playwright.async_api import Page
from app.automation.session import SessionManager
import logging

logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    def __init__(self, page: Page):
        self.page = page
        self.session_manager = SessionManager()

    @abstractmethod
    async def login(self):
        """
        Handles login logic, utilizing saved cookies if available.
        """
        pass

    @abstractmethod
    async def scrape_jobs(self, keyword: str, location: str, limit: int = 10) -> List[Dict]:
        """
        Scrapes job listings based on keyword and location.
        Returns a list of dictionaries with job details.
        """
        pass
    
    async def save_session(self):
        """
        Helper to save current session cookies.
        """
        cookies = await self.page.context.cookies()
        self.session_manager.save_cookies(cookies)
