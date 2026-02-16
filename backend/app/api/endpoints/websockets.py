from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from typing import List
from jose import jwt, JWTError
from app.core import security
from app.core.config import settings
from app.services.socket_manager import manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("WS: Endpoint hit")
    try:
        # Get token from query params manually to avoid validation errors causing immediate disconnect
        token = websocket.query_params.get("token")
        
        if not token:
            print("WS Error: Missing token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Validate token
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
            )
            print(f"WS: Token decoded successfully for sub: {payload.get('sub')}")
        except Exception as e:
            print(f"WS Token Validation Error: {e}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_id = payload.get("sub")
        
        if user_id is None:
            print("WS Error: No user_id in token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        # Accept connection explicitly
        await websocket.accept()
        
        # Register with manager
        manager.add_connection(websocket)
        print(f"WS Connected: {user_id}")
        
        try:
            while True:
                data = await websocket.receive_text()
                # Echo logic or command handling
                # For now just keep connection alive
                await manager.broadcast({"event": "message", "sender": user_id, "text": data})
        except WebSocketDisconnect:
            print(f"WS Disconnected: {user_id}")
            manager.disconnect(websocket)
            await manager.broadcast({"event": "disconnect", "client": user_id})
        except Exception as e:
            print(f"WS Loop Error: {e}")
            manager.disconnect(websocket)
            
    except Exception as e:
        print(f"WS Critical Error: {e}")
        # Try to close if still open
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass
