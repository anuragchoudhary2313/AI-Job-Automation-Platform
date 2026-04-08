from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import logging
import os
import shutil
import uuid

from app.email.sender import email_sender
from app.notifications.telegram import telegram_service
from app.core.features import features
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


def _validate_email_config() -> Optional[str]:
    if not settings.EMAIL_ENABLED:
        return "Email automation is disabled on the server."
    if not settings.SMTP_HOST:
        return "SMTP host is not configured. Set SMTP_HOST in deployment environment variables."
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return "SMTP credentials are not configured. Set SMTP_USER and SMTP_PASSWORD in deployment environment variables."
    return None

# Pydantic Schemas
class HREmailRequest(BaseModel):
    recipient_email: EmailStr
    company_name: str
    job_role: str
    candidate_name: str
    skills: str
    portfolio_link: str

class FollowUpEmailRequest(BaseModel):
    recipient_email: EmailStr
    company_name: str
    job_role: str
    candidate_name: str
    skills: str

@router.post("/send/hr")
async def send_hr_email(
    recipient_email: EmailStr = Form(...),
    company_name: str = Form(...),
    job_role: str = Form(...),
    candidate_name: str = Form(...),
    skills: str = Form(...),
    portfolio_link: str = Form(...),
    resume: UploadFile = File(...)
):
    """
    Sends an initial application email to HR with resume attachment.
    """
    features.require("email_automation")

    config_error = _validate_email_config()
    if config_error:
        raise HTTPException(status_code=503, detail=config_error)
    
    # 1. Save uploaded resume temporarily
    temp_filename = f"temp_resume_{uuid.uuid4()}.pdf"
    file_location = os.path.join("uploads", temp_filename)
    os.makedirs("uploads", exist_ok=True)
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(resume.file, buffer)
            
        # 2. Render Template
        context = {
            "company_name": company_name,
            "job_role": job_role,
            "candidate_name": candidate_name,
            "skills": skills,
            "portfolio_link": portfolio_link
        }
        html_content = email_sender.render_template("hr_initial_email.html", context)
        
        # 3. Send email immediately so API reflects actual delivery success/failure.
        success = await email_sender.send_email(
            to_email=recipient_email,
            subject=f"Application for {job_role} - {candidate_name}",
            html_body=html_content,
            attachments=[file_location],
        )

        if not success:
            raise HTTPException(
                status_code=502,
                detail="Email delivery failed. Please verify SMTP host, credentials, and provider security settings.",
            )

        alert_msg = f"📧 <b>Email Sent to HR</b>\n\n<b>Role:</b> {job_role}\n<b>Company:</b> {company_name}\n<b>To:</b> {recipient_email}"
        try:
            await telegram_service.send_alert(alert_msg)
        except Exception as alert_exc:
            logger.warning("Telegram alert failed after successful HR email send: %s", alert_exc)

        return {"message": f"Email sent successfully to {recipient_email}."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_hr_email: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Unexpected error while sending email. Please check server logs for details.",
        )
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)
            logger.info(f"Cleaned up temporary file: {file_location}")

@router.post("/send/follow-up")
async def send_follow_up_email(
    request: FollowUpEmailRequest,
    background_tasks: BackgroundTasks
):
    """
    Sends a follow-up email (no attachment).
    """
    features.require("email_automation")
    context = request.dict()
    try:
        html_content = email_sender.render_template("follow_up_email.html", context)
        
        async def send_followup_task():
            success = await email_sender.send_email(
                to_email=request.recipient_email,
                subject=f"Following up: Application for {request.job_role} - {request.candidate_name}",
                html_body=html_content
            )
            if success:
                alert_msg = f"🔁 <b>Follow-up Email Sent</b>\n\n<b>Role:</b> {request.job_role}\n<b>Company:</b> {request.company_name}"
                await telegram_service.send_alert(alert_msg)

        background_tasks.add_task(send_followup_task)
        return {"message": "Follow-up email queued."}
    except Exception as e:
        logger.error(f"Error in send_follow_up_email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test")
async def test_email_sending():
    """
    Sends a test email to the configured user.
    """
    config_error = _validate_email_config()
    if config_error:
        raise HTTPException(status_code=503, detail=config_error)
        
    html_content = "<p>Email setup successful.</p>"

    success = await email_sender.send_email(
        to_email=email_sender.user,
        subject="Email Automation Test – AI Job Automation Platform",
        html_body=html_content
    )

    if not success:
        raise HTTPException(
            status_code=502,
            detail="Test email failed to send. Check SMTP settings and provider security requirements.",
        )

    return {"message": f"Test email sent to {email_sender.user}"}
