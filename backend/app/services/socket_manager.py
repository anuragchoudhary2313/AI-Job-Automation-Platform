from fastapi import WebSocket
from typing import List, Dict
from app.core.logging import get_logger

logger = get_logger(__name__)


class SocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # Map user_id -> list of websockets for tenant-scoped sends
        self.user_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def connect_user(self, user_id: str, websocket: WebSocket):
        """Register a websocket for a specific user."""
        self.active_connections.append(websocket)
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    def disconnect_user(self, user_id: str, websocket: WebSocket):
        """Remove a websocket for a specific user."""
        self.disconnect(websocket)
        if user_id in self.user_connections:
            try:
                self.user_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections for a specific user."""
        connections = list(self.user_connections.get(user_id, []))
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect_user(user_id, connection)

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = SocketManager()
