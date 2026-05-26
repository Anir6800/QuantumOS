from core.connection_manager import ConnectionManager

_manager = ConnectionManager()

def get_broadcaster() -> ConnectionManager:
    return _manager

class WsBroadcasterService:
    @staticmethod
    async def broadcast_to_session(session_id: str, event_type: str, payload: dict):
        await _manager.broadcast_to_session(session_id, event_type, payload)

    @staticmethod
    async def broadcast_all(event_type: str, payload: dict):
        await _manager.broadcast_all(event_type, payload)

ws_broadcaster = WsBroadcasterService()
