import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import List, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape
import os

from app.core.config import settings

logger = logging.getLogger(__name__)

# Jinja2 Environment setup
template_dir = os.path.join(os.path.dirname(__file__), "templates")
env = Environment(
    loader=FileSystemLoader(template_dir),
    autoescape=select_autoescape(['html', 'xml'])
)

class EmailSender:
    def __init__(self):
        self.enabled = settings.EMAIL_ENABLED
        self.host = settings.EMAIL_HOST
        self.port = settings.EMAIL_PORT
        self.use_ssl = settings.EMAIL_USE_SSL
        self.user = settings.EMAIL_USER
        self.password = settings.EMAIL_PASSWORD
        self.from_name = settings.EMAIL_FROM_NAME
        
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_body: str, 
        attachments: Optional[List[str]] = None
    ) -> bool:
        """
        Sends an email asynchronously using aiosmtplib.
        """
        if not self.enabled:
            logger.warning("Email sending is disabled in configuration.")
            return False

        if not self.user or not self.password:
            logger.error("Email credentials are not configured.")
            return False

        message = MIMEMultipart()
        message["From"] = f"{self.from_name} <{self.user}>"
        message["To"] = to_email
        message["Subject"] = subject

        # Attach HTML body
        message.attach(MIMEText(html_body, "html"))

        # Process attachments
        if attachments:
            for file_path in attachments:
                if os.path.exists(file_path):
                    try:
                        with open(file_path, "rb") as f:
                            file_data = f.read()
                            file_name = os.path.basename(file_path)
                            part = MIMEApplication(file_data, Name=file_name)
                            part['Content-Disposition'] = f'attachment; filename="{file_name}"'
                            message.attach(part)
                    except Exception as e:
                        logger.error(f"Failed to attach file {file_path}: {e}")
                else:
                    logger.warning(f"Attachment not found: {file_path}")

        try:
            if self.use_ssl:
                # Implicit SSL (usually port 465)
                await aiosmtplib.send(
                    message,
                    hostname=self.host,
                    port=self.port,
                    use_tls=True,
                    username=self.user,
                    password=self.password,
                )
            else:
                # STARTTLS (usually port 587)
                await aiosmtplib.send(
                    message,
                    hostname=self.host,
                    port=self.port,
                    start_tls=True,
                    username=self.user,
                    password=self.password,
                )
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    def render_template(self, template_name: str, context: dict) -> str:
        """
        Renders a Jinja2 template with the provided context.
        """
        try:
            template = env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            logger.error(f"Failed to render template {template_name}: {e}")
            raise e

# Global instance
email_sender = EmailSender()
