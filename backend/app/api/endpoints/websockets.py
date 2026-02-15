from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from app.services.socket_manager import manager

router = APIRouter()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo logic or command handling
            # For now just keep connection alive
            await manager.broadcast({"event": "message", "sender": client_id, "text": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast({"event": "disconnect", "client": client_id})
