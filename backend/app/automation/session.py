import json
import os
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class SessionManager:
    def __init__(self, session_file: str = "cookies.json"):
        self.session_file = session_file

    def save_cookies(self, cookies: List[Dict]):
        """
        Saves cookies to a local JSON file.
        """
        try:
            with open(self.session_file, "w") as f:
                json.dump(cookies, f)
            logger.info(f"Saved {len(cookies)} cookies to {self.session_file}")
        except Exception as e:
            logger.error(f"Failed to save cookies: {e}")

    def load_cookies(self) -> List[Dict]:
        """
        Loads cookies from a local JSON file.
        """
        if not os.path.exists(self.session_file):
            return []
        
        try:
            with open(self.session_file, "r") as f:
                cookies = json.load(f)
            logger.info(f"Loaded {len(cookies)} cookies from {self.session_file}")
            return cookies
        except Exception as e:
            logger.error(f"Failed to load cookies: {e}")
            return []
