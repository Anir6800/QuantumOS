import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.logger import get_logger
from services.ws_broadcaster import get_broadcaster

router = APIRouter(prefix="/api/v1/ws", tags=["websocket"])
manager = get_broadcaster()


@router.websocket("/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    ws_logger = get_logger(__name__, session_id=session_id)
    await manager.connect(websocket, session_id)
    ws_logger.info("ws_connected")
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type", "unknown")
                ws_logger.info("ws_message_received", message_type=msg_type)

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong", "ts": message.get("ts", 0)})
                elif msg_type not in {"start_session", "stop_session", "get_status", "pong"}:
                    ws_logger.warn("ws_unknown_message_type", message_type=msg_type)
            except json.JSONDecodeError:
                ws_logger.error("ws_invalid_json")
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        ws_logger.info("ws_disconnected")
