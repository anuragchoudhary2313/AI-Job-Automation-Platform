import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.enabled = settings.TELEGRAM_ENABLED
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"

    async def send_alert(self, message: str) -> bool:
        """
        Sends a message to the configured Telegram chat.
        Supports HTML formatting.
        """
        if not self.enabled:
            return False

        if not self.bot_token or not self.chat_id or self.bot_token == "CHANGE_ME":
            logger.warning("Telegram credentials not configured.")
            return False

        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "HTML"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10.0)
                
                if response.status_code != 200:
                    logger.error(f"Failed to send Telegram alert: {response.text}")
                    print(f"DEBUG ERROR: Status {response.status_code} - {response.text}")
                    return False
                
                return True
        except Exception as e:
            logger.error(f"Error sending Telegram alert: {e}")
            return False

# Global instance
telegram_service = TelegramService()
