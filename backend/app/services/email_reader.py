import imaplib
import email
import logging
from typing import Dict, Any, Optional

from app.core.config import settings
from app.services.ai_service import ai_service
from app.core.telegram import send_telegram_notification
from app.models.job_application import JobApplication

logger = logging.getLogger(__name__)

class EmailReaderService:
    """Consumes inbound IMAP payloads and updates historical JobApplications dynamically via AI routing."""
    
    def __init__(self):
        # Default mapping using existing SMTP keys assuming standard Google Workplace/Gmail setups
        self.host = "imap.gmail.com"
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        
    def _extract_body(self, msg) -> str:
        """Robust payload string extraction navigating complex MIME trees safely."""
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                # Fetch only text payloads dynamically sidestepping massive attachments
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        body += part.get_payload(decode=True).decode()
                    except:
                        pass
        else:
            try:
                body = msg.get_payload(decode=True).decode()
            except:
                pass
        return body

    async def check_inbox(self) -> Dict[str, Any]:
        """Loops (UNSEEN) targets, classifying intents, updating DB records aggressively."""
        if not self.user or not self.password:
            logger.error("EmailReader: No secure credentials loaded for IMAP processing.")
            return {"status": "error", "message": "Missing credentials", "processed": 0}
            
        try:
            # Native SSL initialization (port 993)
            mail = imaplib.IMAP4_SSL(self.host)
            mail.login(self.user, self.password)
            mail.select("inbox")
            
            # Restrict massive downloads via unread tags solely
            status, messages = mail.search(None, '(UNSEEN)')
            if status != "OK" or not messages[0]:
                mail.logout()
                return {"status": "success", "processed": 0, "message": "No new emails found."}
                
            email_ids = messages[0].split()
            logger.info(f"EmailReader detected {len(email_ids)} new messages.")
            
            processed_count = 0
            
            for eid in email_ids:
                status, msg_data = mail.fetch(eid, '(RFC822)')
                if status != "OK": continue
                
                # Dynamic binary parsing via built-in packages
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                sender = msg.get("From", "")
                subject = msg.get("Subject", "")
                body = self._extract_body(msg)
                
                # Skip barren traces
                if not body and not subject:
                    continue
                    
                full_text = f"Subject: {subject}\nSender: {sender}\nBody: {body[:2000]}"
                
                # Target execution -> AI Classifier logic
                result = await ai_service.classify_recruiter_email(full_text)
                classification = result["classification"]
                company_hint = result["company_name"]
                
                # Memory Target Query: Correlate classification back into MongoDB
                if company_hint:
                    # Dynamic flexible query regex wrapping company names structurally
                    matched_app = await JobApplication.find_one(
                        # simplistic substring query match
                        {"company": {"$regex": company_hint, "$options": "i"}}
                    )
                    
                    if matched_app:
                        matched_app.status = "replied"
                        matched_app.reply_received = True
                        matched_app.decision = classification
                        await matched_app.save()
                        logger.info(f"EmailReader updated memory for {matched_app.company} -> {classification.upper()}")
                
                # Telegram execution alert hook
                if classification in ["interview", "rejected"] and settings.TELEGRAM_ENABLED:
                    alert = f"Recruiter Update! [{classification.upper()}]\nCompany: {company_hint or sender}\nSubject: {subject}"
                    await send_telegram_notification(alert)
                    
                processed_count += 1
                
            mail.logout()
            return {"status": "success", "processed": processed_count}
            
        except Exception as e:
            logger.error(f"EmailReader critical execution failure parsing IMAP logic: {e}", exc_info=True)
            return {"status": "error", "message": str(e), "processed": 0}

email_reader_service = EmailReaderService()
