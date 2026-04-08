import base64
import logging
import os
from typing import List, Optional

import httpx
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)

# Jinja2 Environment setup
template_dir = os.path.join(os.path.dirname(__file__), "templates")
env = Environment(
    loader=FileSystemLoader(template_dir),
    autoescape=select_autoescape(["html", "xml"]),
)


class EmailSender:
    def __init__(self):
        self.enabled = settings.EMAIL_ENABLED
        self.api_key = settings.RESEND_API_KEY
        self.base_url = settings.RESEND_BASE_URL.rstrip("/")
        self.from_email = settings.RESEND_FROM_EMAIL or settings.EMAILS_FROM_EMAIL
        self.user = self.from_email

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        attachments: Optional[List[str]] = None,
    ) -> bool:
        """Send an email using the Resend HTTP API."""
        if not self.enabled:
            logger.warning("Email sending is disabled in configuration.")
            return False

        if settings.EMAIL_DEV_MODE:
            logger.info(
                "[EMAIL_DEV_MODE] Simulated email to %s with subject %s",
                to_email,
                subject,
            )
            return True

        if not self.api_key:
            logger.error("Resend API key is not configured.")
            return False

        if not self.from_email:
            logger.error("Resend from email is not configured.")
            return False

        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }

        if attachments:
            payload["attachments"] = []
            for file_path in attachments:
                if not os.path.exists(file_path):
                    logger.warning("Attachment not found: %s", file_path)
                    continue

                try:
                    with open(file_path, "rb") as file_handle:
                        payload["attachments"].append(
                            {
                                "filename": os.path.basename(file_path),
                                "content": base64.b64encode(file_handle.read()).decode("utf-8"),
                            }
                        )
                except Exception as exc:
                    logger.error("Failed to attach file %s: %s", file_path, exc)

            if not payload["attachments"]:
                payload.pop("attachments", None)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(f"{self.base_url}/emails", json=payload, headers=headers)

            if 200 <= response.status_code < 300:
                logger.info("Email sent successfully to %s", to_email)
                return True

            logger.error(
                "Resend email failed to %s: status=%s body=%s",
                to_email,
                response.status_code,
                response.text,
            )
            return False
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", to_email, exc, exc_info=True)
            return False

    def render_template(self, template_name: str, context: dict) -> str:
        """Render a Jinja2 template with the provided context."""
        try:
            template = env.get_template(template_name)
            return template.render(**context)
        except Exception as exc:
            logger.error("Failed to render template %s: %s", template_name, exc)
            raise


# Global instance
email_sender = EmailSender()
