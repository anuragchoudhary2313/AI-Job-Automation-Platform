import asyncio
from dotenv import load_dotenv
import os
import traceback

async def main():
    load_dotenv()
    try:
        from app.services.email import email_service
        print("Sending test email...")
        await email_service.send_email_async(
            to_email="dynamicbaba6@gmail.com",
            subject="Test Email",
            body="This is a test from the backend.",
            html=False
        )
        print("Success")
    except Exception as e:
        print("Error caught!")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
