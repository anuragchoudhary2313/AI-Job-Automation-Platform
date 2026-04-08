"""
Email service with retry logic and fault tolerance.
"""
import asyncio
import html as html_lib
import logging
from typing import List, Optional

from app.core.config import settings
from app.core.retry import retry_with_backoff, CircuitBreaker
from app.email.sender import email_sender

logger = logging.getLogger(__name__)

# Circuit breaker for email service
email_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=300,
    expected_exception=Exception,
)


def _normalize_body(body: str, html: bool) -> str:
    if html:
        return body
    escaped = html_lib.escape(body).replace("\n", "<br>")
    return f"<pre>{escaped}</pre>"


class EmailService:
    """Email service backed by the Resend HTTP API."""

    def __init__(self):
        self.from_email = settings.RESEND_FROM_EMAIL or settings.EMAILS_FROM_EMAIL

    @retry_with_backoff(
        max_retries=3,
        initial_delay=2.0,
        max_delay=30.0,
        exceptions=(ConnectionError, TimeoutError),
    )
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachments: Optional[List[str]] = None,
        html: bool = False,
    ) -> bool:
        """Send email through the Resend-backed sender."""
        try:
            logger.info("Sending email to %s: %s", to_email, subject)
            message_body = _normalize_body(body, html)
            return email_circuit_breaker.call(
                self._send_email_internal,
                to_email,
                subject,
                message_body,
                attachments,
            )
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", to_email, exc, exc_info=True)
            raise

    def _send_email_internal(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        attachments: Optional[List[str]],
    ) -> bool:
        """Internal email sending logic using the shared email sender."""
        try:
            # Reuse the shared async sender from a blocking context safely.
            return asyncio.run(
                email_sender.send_email(
                    to_email=to_email,
                    subject=subject,
                    html_body=html_body,
                    attachments=attachments,
                )
            )
        except RuntimeError:
            # Fallback for environments with a running loop.
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(
                    email_sender.send_email(
                        to_email=to_email,
                        subject=subject,
                        html_body=html_body,
                        attachments=attachments,
                    )
                )
            finally:
                loop.close()

    async def send_email_async(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachments: Optional[List[str]] = None,
        html: bool = False,
    ) -> bool:
        """Async wrapper for send_email."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            self.send_email,
            to_email,
            subject,
            body,
            attachments,
            html,
        )

    async def send_hr_email(
        self,
        recipient_email: str,
        company_name: str,
        job_role: str,
        candidate_name: str,
        skills: str,
        portfolio_link: str,
        resume_filename: Optional[str] = None,
    ) -> bool:
        """Send campaign HR email using template rendering and optional resume attachment."""
        if settings.EMAIL_DEV_MODE:
            logger.info(
                "[EMAIL_DEV_MODE] Simulated campaign HR email to %s for %s at %s",
                recipient_email,
                job_role,
                company_name,
            )
            return True

        context = {
            "company_name": company_name,
            "job_role": job_role,
            "candidate_name": candidate_name,
            "skills": skills,
            "portfolio_link": portfolio_link,
        }
        html_content = email_sender.render_template("hr_initial_email.html", context)

        attachments: List[str] = []
        if resume_filename:
            resume_path = f"uploads/{resume_filename}"
            attachments.append(resume_path)

        return await email_sender.send_email(
            to_email=recipient_email,
            subject=f"Application for {job_role} - {candidate_name}",
            html_body=html_content,
            attachments=attachments or None,
        )


# Singleton instance
email_service = EmailService()
