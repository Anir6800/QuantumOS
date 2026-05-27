import asyncio
import time
from typing import Dict

from pydantic import BaseModel, Field

from agents.base_agent import AgentStatus
from models.plan import AgentStrategy


class AgentMemoryEntry(BaseModel):
    agent_id: str
    name: str
    strategy_name: str
    strategy_summary: str
    model: str
    provider: str
    status: AgentStatus
    started_at: float
    completed_at: float | None = None
    partial_output_preview: str | None = None
    final_output: str | None = None


class AgentMemoryContext:
    def __init__(self, session_id: str, task_description: str):
        self.session_id = session_id
        self.task_description = task_description
        self._entries: Dict[str, AgentMemoryEntry] = {}
        self._lock = asyncio.Lock()
        self.created_at = time.time()

    async def register_agent(self, agent_id: str, name: str, strategy: AgentStrategy, model: str, provider: str):
        async with self._lock:
            self._entries[agent_id] = AgentMemoryEntry(
                agent_id=agent_id,
                name=name,
                strategy_name=strategy.name,
                strategy_summary=strategy.approach.strip(),
                model=model,
                provider=provider,
                status=AgentStatus.RUNNING,
                started_at=time.time(),
            )

    async def get_sibling_context(self, requesting_agent_id: str) -> str:
        async with self._lock:
            siblings = [
                f"- {entry.name}: using {entry.strategy_summary}"
                for agent_id, entry in self._entries.items()
                if agent_id != requesting_agent_id
            ]
        if not siblings:
            return ""
        return "Other agents working on this task:\n" + "\n".join(siblings)

    async def update_progress(self, agent_id: str, partial_output: str):
        async with self._lock:
            entry = self._entries.get(agent_id)
            if not entry:
                return
            entry.partial_output_preview = partial_output[:200]
            self._entries[agent_id] = entry

    async def mark_complete(self, agent_id: str, final_output: str):
        async with self._lock:
            entry = self._entries.get(agent_id)
            if not entry:
                return
            entry.status = AgentStatus.COMPLETE
            entry.completed_at = time.time()
            entry.partial_output_preview = final_output[:200]
            entry.final_output = final_output
            self._entries[agent_id] = entry

    async def mark_failed(self, agent_id: str, error: str):
        async with self._lock:
            entry = self._entries.get(agent_id)
            if not entry:
                return
            entry.status = AgentStatus.FAILED
            entry.completed_at = time.time()
            entry.partial_output_preview = error[:200]
            self._entries[agent_id] = entry

    def get_snapshot(self) -> dict:
        return {
            "session_id": self.session_id,
            "task_description": self.task_description,
            "created_at": self.created_at,
            "entries": [entry.model_dump(mode="json") for entry in self._entries.values()],
        }

    def get_brief_snapshot(self) -> dict:
        """Return a compact snapshot intended for frequent websocket syncs.

        This excludes large final outputs and keeps only partial previews and status metadata.
        """
        return {
            "session_id": self.session_id,
            "task_description": self.task_description,
            "created_at": self.created_at,
            "entries": [
                {
                    "agent_id": entry.agent_id,
                    "name": entry.name,
                    "status": entry.status,
                    "partial_output_preview": entry.partial_output_preview,
                    "started_at": entry.started_at,
                    "completed_at": entry.completed_at,
                }
                for entry in self._entries.values()
            ],
        }
