from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.notifications.telegram import telegram_service

router = APIRouter()

@router.get("/test")
async def test_telegram_alert(background_tasks: BackgroundTasks):
    """
    Sends a test notification to Telegram.
    """
    async def send_test():
        message = "✅ <b>Telegram alerts connected</b>\nAI Job Automation Platform is live 🚀"
        await telegram_service.send_alert(message)

    background_tasks.add_task(send_test)
    return {"message": "Telegram test alert queued."}
