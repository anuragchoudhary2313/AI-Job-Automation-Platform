from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import jwt, JWTError
from app.core import security
from app.core.config import settings
from app.core.logging import get_logger
from app.services.socket_manager import manager

router = APIRouter()
logger = get_logger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.debug("WS: Endpoint hit")
    try:
        token = websocket.query_params.get("token")

        if not token:
            logger.warning("WS: Missing token, rejecting connection")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
            )
            logger.debug(f"WS: Token decoded for sub: {payload.get('sub')}")
        except JWTError as e:
            logger.warning(f"WS: Token validation failed: {e}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_id = payload.get("sub")

        if user_id is None:
            logger.warning("WS: No user_id in token payload")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await websocket.accept()
        manager.connect_user(user_id, websocket)
        logger.info(f"WS: User {user_id} connected")

        try:
            while True:
                data = await websocket.receive_text()
                # Route message only to the sending user's connections
                await manager.send_to_user(
                    user_id, {"event": "message", "sender": user_id, "text": data}
                )
        except WebSocketDisconnect:
            logger.info(f"WS: User {user_id} disconnected")
            manager.disconnect_user(user_id, websocket)
        except Exception as e:
            logger.error(f"WS: Loop error for user {user_id}: {e}")
            manager.disconnect_user(user_id, websocket)

    except Exception as e:
        logger.error(f"WS: Critical error: {e}", exc_info=True)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
