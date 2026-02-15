import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.models import Settings # Assuming we can access Settings via endpoints or direct DB later, for now just using pass-in values or fetching
from bot_engine.ai.gpt import generate_cover_letter_gpt

# Mock Database for daily limits (In production, replace with proper DB calls)
DAILY_SENT_COUNT = 0
LAST_RESET_TIME = datetime.now()

class EmailService:
    def __init__(self, smtp_user: str, smtp_password: str, daily_limit: int = 50):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.user = smtp_user
        self.password = smtp_password
        self.daily_limit = daily_limit

    def _check_daily_limit(self) -> bool:
        global DAILY_SENT_COUNT, LAST_RESET_TIME
        if datetime.now() - LAST_RESET_TIME > timedelta(hours=24):
            DAILY_SENT_COUNT = 0
            LAST_RESET_TIME = datetime.now()
        
        return DAILY_SENT_COUNT < self.daily_limit

    def _generate_html_body(self, intro: str, body_content: str, signature: str) -> str:
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                    <p>{intro}</p>
                    <p>{body_content}</p>
                    <br>
                    <p>Best regards,</p>
                    <p><strong>{signature}</strong></p>
                </div>
            </body>
        </html>
        """

    def send_application_email(
        self,
        to_email: str,
        job_details: dict,
        user_details: dict,
        resume_path: str,
        cover_letter_path: Optional[str] = None
    ):
        if not self._check_daily_limit():
            print("Daily email limit reached. Skipping...")
            return False

        # Generate AI personalized Intro
        # We reuse the cover letter generator or create a specific intro generator
        # For this example, we'll assume the intro is part of the cover letter generation or simple dynamic text
        personalized_intro = f"Dear Hiring Team at {job_details.get('company', 'the company')},"
        ai_intro_text = generate_cover_letter_gpt(f"Experience: {user_details.get('experience')}", f"Job: {job_details.get('title')} at {job_details.get('company')}")
        # Extract just the opening or use the whole short blurb
        short_intro = ai_intro_text.split('\n')[0] if ai_intro_text else personalized_intro # simplified for mock

        subject = f"Application for {job_details.get('title')} - {user_details.get('name')}"
        body_html = self._generate_html_body(
            intro=short_intro,
            body_content=f"Please find attached my resume and cover letter for the {job_details.get('title')} position. I am very interested in this opportunity.",
            signature=user_details.get('name')
        )

        try:
            msg = MIMEMultipart()
            msg['From'] = self.user
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body_html, 'html'))

            # Attach Resume
            if resume_path:
                with open(resume_path, "rb") as f:
                    part = MIMEApplication(f.read(), Name="Resume.pdf")
                part['Content-Disposition'] = 'attachment; filename="Resume.pdf"'
                msg.attach(part)

            # Attach Cover Letter
            if cover_letter_path:
                with open(cover_letter_path, "rb") as f:
                    part = MIMEApplication(f.read(), Name="CoverLetter.pdf")
                part['Content-Disposition'] = 'attachment; filename="Cover_Letter.pdf"'
                msg.attach(part)

            # Sending Logic (Commented out for safety in demo/dev env without real creds)
            # with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            #     server.starttls()
            #     server.login(self.user, self.password)
            #     server.send_message(msg)
            
            # Increment Counter
            global DAILY_SENT_COUNT
            DAILY_SENT_COUNT += 1
            print(f"Email sent to {to_email}. Daily Count: {DAILY_SENT_COUNT}/{self.daily_limit}")
            return True

        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    def schedule_follow_up(self, to_email: str, job_id: str, days: int = 3):
        print(f"Follow-up email scheduled for {to_email} (Job {job_id}) in {days} days.")
        # In a real app, this would add a DB record 'email_queue' with distinct types
