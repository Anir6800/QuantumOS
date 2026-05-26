import asyncio
from typing import Dict

from core.agent_memory import AgentMemoryContext


class MemoryService:
    _instance = None

    def __init__(self):
        self._contexts: Dict[str, AgentMemoryContext] = {}
        self._lock = asyncio.Lock()

    async def create_context(self, session_id: str, task: str) -> AgentMemoryContext:
        async with self._lock:
            context = AgentMemoryContext(session_id=session_id, task_description=task)
            self._contexts[session_id] = context
            return context

    async def get_context(self, session_id: str) -> AgentMemoryContext | None:
        async with self._lock:
            return self._contexts.get(session_id)

    async def destroy_context(self, session_id: str):
        async with self._lock:
            self._contexts.pop(session_id, None)

    @classmethod
    def get_instance(cls) -> "MemoryService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
