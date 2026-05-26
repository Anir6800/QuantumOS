import asyncio
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.heartbeat_tasks: Dict[WebSocket, asyncio.Task] = {}

    async def connect(self, ws: WebSocket, session_id: str):
        await ws.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(ws)
        
        # Start heartbeat
        task = asyncio.create_task(self._heartbeat(ws, session_id))
        self.heartbeat_tasks[ws] = task
        logger.info(f"Client connected to session {session_id}. Total: {len(self.active_connections[session_id])}")

    def disconnect(self, ws: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if ws in self.active_connections[session_id]:
                self.active_connections[session_id].remove(ws)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        
        if ws in self.heartbeat_tasks:
            self.heartbeat_tasks[ws].cancel()
            del self.heartbeat_tasks[ws]
        logger.info(f"Client disconnected from session {session_id}")

    async def broadcast_to_session(self, session_id: str, event_type: str, payload: dict):
        if session_id not in self.active_connections:
            return
        
        from core.ws_events import create_event
        message = create_event(event_type, payload)
        
        disconnected = []
        for ws in self.active_connections[session_id]:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
                
        for ws in disconnected:
            self.disconnect(ws, session_id)

    async def broadcast_all(self, event_type: str, payload: dict):
        from core.ws_events import create_event
        message = create_event(event_type, payload)
        
        for session_id, connections in list(self.active_connections.items()):
            disconnected = []
            for ws in connections:
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.append(ws)
                    
            for ws in disconnected:
                self.disconnect(ws, session_id)

    def get_session_connection_count(self, session_id: str) -> int:
        return len(self.active_connections.get(session_id, []))

    async def _heartbeat(self, ws: WebSocket, session_id: str):
        try:
            while True:
                await asyncio.sleep(30)
                try:
                    await ws.send_json({"type": "ping", "ts": int(asyncio.get_event_loop().time() * 1000)})
                except Exception:
                    self.disconnect(ws, session_id)
                    break
        except asyncio.CancelledError:
            pass
