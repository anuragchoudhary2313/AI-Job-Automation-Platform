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
    dev_mode_enabled = settings.EMAIL_DEV_MODE and not settings.is_production
    if not settings.EMAIL_ENABLED:
        return "Email automation is disabled on the server."
    if dev_mode_enabled:
        return None
    if not settings.RESEND_API_KEY:
        return "Resend API key is not configured. Set RESEND_API_KEY in deployment environment variables."
    if not (settings.RESEND_FROM_EMAIL or settings.EMAILS_FROM_EMAIL):
        return "Sender email is not configured. Set RESEND_FROM_EMAIL in deployment environment variables."
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
    dev_mode_enabled = settings.EMAIL_DEV_MODE and not settings.is_production

    config_error = _validate_email_config()
    if config_error:
        raise HTTPException(status_code=503, detail=config_error)

    if dev_mode_enabled:
        logger.info(
            "[EMAIL_DEV_MODE] Simulated HR email send to %s for %s at %s",
            recipient_email,
            job_role,
            company_name,
        )
        return {"message": f"[DEV MODE] Simulated email sent to {recipient_email}."}
    
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
        
        # 3. Send email immediately so API reflects provider acceptance/failure.
        send_result = await email_sender.send_email_detailed(
            to_email=recipient_email,
            subject=f"Application for {job_role} - {candidate_name}",
            html_body=html_content,
            attachments=[file_location],
        )

        if not send_result.get("success"):
            provider_error = str(send_result.get("error", "provider_rejected"))[:600]
            raise HTTPException(
                status_code=502,
                detail=(
                    "Email provider rejected the request. "
                    f"Details: {provider_error}"
                ),
            )

        message_id = send_result.get("message_id")
        provider_response = send_result.get("provider_response")

        alert_msg = f"📧 <b>Email Sent to HR</b>\n\n<b>Role:</b> {job_role}\n<b>Company:</b> {company_name}\n<b>To:</b> {recipient_email}"
        try:
            await telegram_service.send_alert(alert_msg)
        except Exception as alert_exc:
            logger.warning("Telegram alert failed after successful HR email send: %s", alert_exc)

        if not message_id:
            return {
                "message": (
                    "Email request accepted by provider, but tracking id was not returned. "
                    "Check Resend dashboard activity/logs for final delivery status."
                ),
                "message_id": None,
                "provider_response": provider_response,
            }

        return {
            "message": (
                f"Email accepted by provider for {recipient_email}. "
                f"message_id={message_id}"
            ),
            "message_id": message_id,
            "provider_response": provider_response,
        }

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

    dev_mode_enabled = settings.EMAIL_DEV_MODE and not settings.is_production

    if dev_mode_enabled:
        logger.info("[EMAIL_DEV_MODE] Simulated test email send")
        return {"message": "[DEV MODE] Test email simulated successfully."}
        
    html_content = "<p>Email setup successful.</p>"

    send_result = await email_sender.send_email_detailed(
        to_email=email_sender.user,
        subject="Email Automation Test – AI Job Automation Platform",
        html_body=html_content
    )

    if not send_result.get("success"):
        provider_error = str(send_result.get("error", "provider_rejected"))[:600]
        raise HTTPException(
            status_code=502,
            detail=f"Test email failed at provider. Details: {provider_error}",
        )

    message_id = send_result.get("message_id")
    provider_response = send_result.get("provider_response")
    if not message_id:
        return {
            "message": "Test email accepted by provider, but tracking id is unavailable. Check Resend dashboard logs.",
            "message_id": None,
            "provider_response": provider_response,
        }
    return {
        "message": f"Test email accepted by provider. message_id={message_id}",
        "message_id": message_id,
        "provider_response": provider_response,
    }
