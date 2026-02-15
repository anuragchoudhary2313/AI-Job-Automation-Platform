"""
Email service with retry logic and fault tolerance.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
import asyncio

from app.core.config import settings
from app.core.retry import retry_with_backoff, CircuitBreaker

logger = logging.getLogger(__name__)

# Circuit breaker for email service
email_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=300,  # 5 minutes
    expected_exception=smtplib.SMTPException
)


class EmailService:
    """Email service with retry logic and fault tolerance."""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    
    @retry_with_backoff(
        max_retries=3,
        initial_delay=2.0,
        max_delay=30.0,
        exceptions=(smtplib.SMTPException, ConnectionError, TimeoutError)
    )
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachments: Optional[List[str]] = None,
        html: bool = False
    ) -> bool:
        """
        Send email with retry logic.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body (plain text or HTML)
            attachments: List of file paths to attach
            html: Whether body is HTML
            
        Returns:
            True if email sent successfully
            
        Raises:
            smtplib.SMTPException: If email fails after retries
        """
        try:
            logger.info(f"Sending email to {to_email}: {subject}")
            
            # Use circuit breaker
            return email_circuit_breaker.call(
                self._send_email_internal,
                to_email,
                subject,
                body,
                attachments,
                html
            )
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}", exc_info=True)
            raise
    
    def _send_email_internal(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachments: Optional[List[str]],
        html: bool
    ) -> bool:
        """Internal email sending logic."""
        # Create message
        msg = MIMEMultipart()
        msg['From'] = self.from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach body
        mime_type = 'html' if html else 'plain'
        msg.attach(MIMEText(body, mime_type))
        
        # Attach files
        if attachments:
            for file_path in attachments:
                try:
                    with open(file_path, 'rb') as f:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename={file_path.split("/")[-1]}'
                        )
                        msg.attach(part)
                except Exception as e:
                    logger.error(f"Failed to attach file {file_path}: {e}")
        
        # Send email
        with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    
    async def send_email_async(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachments: Optional[List[str]] = None,
        html: bool = False
    ) -> bool:
        """
        Async wrapper for send_email.
        Runs email sending in thread pool to avoid blocking.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.send_email,
            to_email,
            subject,
            body,
            attachments,
            html
        )


# Singleton instance
email_service = EmailService()
