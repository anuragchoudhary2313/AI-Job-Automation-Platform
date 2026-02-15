import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List

def send_hr_email_with_attachments(
    to_email: str,
    subject: str,
    body: str,
    attachment_paths: List[str] = None
):
    """
    Sends an email with optional attachments to HR.
    """
    sender_email = "bot@example.com" # Configurable via env vars
    sender_password = "password"
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    if attachment_paths:
        for path in attachment_paths:
            try:
                with open(path, "rb") as f:
                    part = MIMEApplication(f.read(), Name=path)
                part['Content-Disposition'] = f'attachment; filename="{path}"'
                msg.attach(part)
            except Exception as e:
                print(f"Could not attach file {path}: {e}")
                
    # Mock sending
    print(f"Sending email to {to_email} with subject: {subject}")
    # with smtplib.SMTP('smtp.gmail.com', 587) as server:
    #     server.starttls()
    #     server.login(sender_email, sender_password)
    #     server.send_message(msg)

def followup_email_after_days(email_id: str, days: int):
    """
    Schedules a follow-up email.
    """
    print(f"Scheduled follow-up for {email_id} in {days} days.")
