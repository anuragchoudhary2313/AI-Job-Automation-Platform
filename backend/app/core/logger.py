import logging
import sys
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.db.models import Log
from app.services.socket_manager import manager
import asyncio
from typing import Optional

# Configure basic logging to file/stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("ai_job_automation")

async def log_to_db(team_id: int, message: str, level: str = "INFO"):
    """
    Async log message to DB and Broadcast via WebSocket.
    """
    # 1. Log to standard logger
    if level == "ERROR":
        logger.error(f"[Team {team_id}] {message}")
    else:
        logger.info(f"[Team {team_id}] {message}")

    # 2. Persist to DB
    try:
        async with AsyncSessionLocal() as session:
            log_entry = Log(team_id=team_id, message=message, level=level)
            session.add(log_entry)
            await session.commit()
    except Exception as e:
        logger.error(f"Failed to write log to DB: {e}")

    # 3. Broadcast to WebSockets
    await manager.broadcast({
        "event": "log",
        "team_id": team_id,
        "level": level,
        "message": message
    })

def log_sync(team_id: int, message: str, level: str = "INFO"):
    """
    Synchronous wrapper for async logging (fire and forget task).
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(log_to_db(team_id, message, level))
        else:
            # Fallback for scripts/scheduler if no loop running (rare in FastAPI context)
            asyncio.run(log_to_db(team_id, message, level))
    except Exception:
        # Fallback if no loop access
        pass
