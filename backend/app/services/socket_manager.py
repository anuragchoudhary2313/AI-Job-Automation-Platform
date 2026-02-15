from fastapi import WebSocket
from typing import List, Dict

class SocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # Could extend to map team_id -> List[WebSocket] for tenant isolation

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle disconnected clients gracefully
                self.disconnect(connection)

manager = SocketManager()
