import asyncio
import sys
import os
import logging

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO)

from app.notifications.telegram import telegram_service

async def test_telegram():
    print("Testing Telegram Configuration...")
    print(f"Bot Token Configured: {'Yes' if telegram_service.bot_token and telegram_service.bot_token != 'CHANGE_ME' else 'No'}")
    print(f"Chat ID Configured: {'Yes' if telegram_service.chat_id and telegram_service.chat_id != 'CHANGE_ME' else 'No'}")
    
    if not telegram_service.bot_token or telegram_service.bot_token == "CHANGE_ME":
        print("❌ Error: Telegram Bot Token not configured in .env")
        return

    print("Sending test alert...")
    try:
        success = await telegram_service.send_alert("✅ <b>Direct Verification Test</b>\nSystem is online! 🚀")
        
        if success:
            print("✅ Telegram alert sent successfully!")
        else:
            print("❌ Failed to send Telegram alert. Check logs.")
    except Exception as e:
        print(f"❌ Exception occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_telegram())
