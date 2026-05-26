import asyncio
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Deque, Dict

from pydantic import BaseModel, Field


class LogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ts: str
    level: str
    session_id: str | None = None
    agent_id: str | None = None
    logger: str
    message: str
    extra: dict = Field(default_factory=dict)


class SessionLogStore:
    _instance = None

    def __init__(self):
        self._store: Dict[str, Deque[LogEntry]] = defaultdict(lambda: deque(maxlen=1000))
        self._global: Deque[LogEntry] = deque(maxlen=500)
        self._lock = asyncio.Lock()

    async def append(self, entry: LogEntry):
        async with self._lock:
            self._append_unsafe(entry)

    def append_nowait(self, entry: LogEntry):
        self._append_unsafe(entry)

    def _append_unsafe(self, entry: LogEntry):
        self._global.append(entry)
        if entry.session_id:
            self._store[entry.session_id].append(entry)

    def _matches(self, entry: LogEntry, level: str | None, since: float | None) -> bool:
        if level and entry.level.lower() != level.lower():
            return False
        if since is not None:
            try:
                ts = datetime.fromisoformat(entry.ts.replace("Z", "+00:00")).timestamp()
            except ValueError:
                return False
            if ts < since:
                return False
        return True

    def get_by_session(self, session_id: str, level: str = None, since: float = None, limit: int = 100) -> list[LogEntry]:
        entries = list(self._store.get(session_id, deque()))
        filtered = [e for e in entries if self._matches(e, level=level, since=since)]
        return filtered[-max(limit, 1) :]

    def get_global(self, limit: int = 100) -> list[LogEntry]:
        return list(self._global)[-max(limit, 1) :]

    @classmethod
    def get_instance(cls) -> "SessionLogStore":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
