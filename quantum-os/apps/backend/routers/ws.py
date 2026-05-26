import logging
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.connection_manager import ConnectionManager
from services.ws_broadcaster import get_broadcaster

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ws", tags=["websocket"])
manager = get_broadcaster()

@router.websocket("/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type", "unknown")
                payload = message.get("payload", {})
                logger.info(f"WS Received [{session_id}]: {msg_type}")
                
                if msg_type == "start_session":
                    # Handle start session
                    pass
                elif msg_type == "stop_session":
                    # Handle stop session
                    pass
                elif msg_type == "get_status":
                    # Handle get status
                    pass
                elif msg_type == "pong":
                    # Handle heartbeat pong
                    pass
                else:
                    logger.warning(f"Unknown WS message type: {msg_type}")
            except json.JSONDecodeError:
                logger.error("Invalid WS JSON received")
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
