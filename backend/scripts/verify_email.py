import asyncio
import sys
import os

import logging
# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Configure logging to see errors from sender
logging.basicConfig(level=logging.INFO)

from app.email.sender import email_sender

async def test_email():
    print("Testing Email Configuration...")
    print(f"Host: {email_sender.host}:{email_sender.port}")
    print(f"User: {email_sender.user}")
    print(f"SSL: {email_sender.use_ssl}")
    
    if not email_sender.password or email_sender.password == "CHANGE_ME":
        print("❌ Error: Password not configured in .env")
        return

    print("Sending email...")
    try:
        success = await email_sender.send_email(
            to_email=email_sender.user, # Send to self
            subject="Direct Verification Test",
            html_body="<h1>It Works!</h1><p>This is a direct test from verify_email.py</p>"
        )
        
        if success:
            print("✅ Email sent successfully!")
        else:
            print("❌ Failed to send email. Check logs (likely auth or connection error).")
    except Exception as e:
        print(f"❌ Exception occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_email())
