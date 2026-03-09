"""
Bot runner endpoint - triggers bot automation on demand.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from typing import Any

from app.api import deps
from app.models.user import User
from app.services.socket_manager import manager
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Track running bot tasks per user to prevent double-starts
_running_bots: dict = {}


async def _run_bot_with_logging(user_id: str, user_email: str):
    """Run bot automation and stream log events via user-scoped WebSocket."""
    try:
        _running_bots[user_id] = True

        await manager.send_to_user(
            user_id,
            {
                "event": "log",
                "level": "info",
                "message": f"Bot started for {user_email}",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
            },
        )

        await manager.send_to_user(
            user_id,
            {
                "event": "log",
                "level": "info",
                "message": "Fetching pending jobs...",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
            },
        )

        # Import and run bot service
        from app.services.bot import bot_service

        results = await bot_service.run_job_automation(user_id)

        await manager.send_to_user(
            user_id,
            {
                "event": "log",
                "level": "info",
                "message": (
                    f"Bot completed: {results.get('jobs_applied', 0)}/"
                    f"{results.get('jobs_processed', 0)} jobs applied"
                ),
                "timestamp": datetime.now().strftime("%H:%M:%S"),
            },
        )

        if results.get("errors"):
            for err in results["errors"][:5]:
                await manager.send_to_user(
                    user_id,
                    {
                        "event": "log",
                        "level": "error",
                        "message": (
                            f"Error on job {err.get('job_id', '?')}: "
                            f"{err.get('error', 'Unknown')}"
                        ),
                        "timestamp": datetime.now().strftime("%H:%M:%S"),
                    },
                )

        await manager.send_to_user(
            user_id,
            {
                "event": "bot_status",
                "status": "completed",
                "results": results,
            },
        )

    except Exception as e:
        logger.error(f"Bot automation error for user {user_id}: {e}", exc_info=True)
        await manager.send_to_user(
            user_id,
            {
                "event": "log",
                "level": "error",
                "message": f"Bot error: {str(e)}",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
            },
        )
        await manager.send_to_user(
            user_id,
            {
                "event": "bot_status",
                "status": "error",
                "error": str(e),
            },
        )
    finally:
        _running_bots.pop(user_id, None)


@router.post("/start")
async def start_bot(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Start the bot automation for the current user.
    Runs in background and streams logs via WebSocket.
    """
    user_id = str(current_user.id)

    # Prevent double-starts
    if user_id in _running_bots:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bot is already running for this user",
        )

    logger.info(f"Bot start requested by user {user_id}")

    # Run in background
    background_tasks.add_task(_run_bot_with_logging, user_id, current_user.email)

    return {"message": "Bot started successfully", "status": "running"}


@router.get("/status")
async def get_bot_status(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Check if the bot is currently running.
    """
    user_id = str(current_user.id)
    return {"running": user_id in _running_bots}