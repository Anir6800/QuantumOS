import asyncio
import uuid
from typing import Dict, List
from datetime import datetime, timezone
from schemas import SessionCreate, SessionResponse, SessionStatus, SessionStatusUpdate
from core.exceptions import SessionNotFoundException

class SessionService:
    def __init__(self):
        self._store: Dict[str, SessionResponse] = {}
        self._lock = asyncio.Lock()

    async def create_session(self, session_data: SessionCreate) -> SessionResponse:
        async with self._lock:
            session_id = str(uuid.uuid4())
            session = SessionResponse(
                id=session_id,
                task_description=session_data.task_description,
                status=SessionStatus.PENDING,
                created_at=datetime.now(timezone.utc)
            )
            self._store[session_id] = session
            return session

    async def get_session(self, session_id: str) -> SessionResponse:
        async with self._lock:
            session = self._store.get(session_id)
            if not session:
                raise SessionNotFoundException(f"Session {session_id} not found", session_id=session_id)
            return session

    async def update_status(self, session_id: str, update_data: SessionStatusUpdate) -> SessionResponse:
        async with self._lock:
            session = self._store.get(session_id)
            if not session:
                raise SessionNotFoundException(f"Session {session_id} not found", session_id=session_id)
            
            # Simple state machine validation could go here
            updated_session = session.model_copy(update={'status': update_data.status})
            self._store[session_id] = updated_session
            return updated_session

    async def list_sessions(self) -> List[SessionResponse]:
        async with self._lock:
            return list(self._store.values())

session_service = SessionService()
