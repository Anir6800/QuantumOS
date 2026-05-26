import uuid
from abc import ABC, abstractmethod
from enum import Enum
from typing import TYPE_CHECKING

from core.connection_manager import ConnectionManager
from core.logger import get_logger
from models.plan import AgentResult

if TYPE_CHECKING:
    from core.agent_memory import AgentMemoryContext
    from models.plan import AgentStrategy


class AgentStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


class BaseAgent(ABC):
    def __init__(
        self,
        name: str,
        model: str,
        provider: str,
        session_id: str,
        broadcaster: ConnectionManager,
    ):
        self.agent_id = str(uuid.uuid4())
        self.name = name
        self.model = model
        self.provider = provider
        self.status = AgentStatus.PENDING
        self.session_id = session_id
        self.broadcaster = broadcaster
        self.memory_context: "AgentMemoryContext | None" = None
        self._logger = get_logger(__name__, session_id=session_id, agent_id=self.agent_id)

    async def log(self, level: str, message: str):
        payload = {
            "agent_id": self.agent_id,
            "name": self.name,
            "level": level.lower(),
            "message": message,
        }
        await self.broadcaster.broadcast_to_session(self.session_id, "agent:log", payload)
        if level.lower() == "error":
            self._logger.error(message, event="agent:log", name=self.name)
        elif level.lower() == "warn":
            self._logger.warn(message, event="agent:log", name=self.name)
        elif level.lower() == "debug":
            self._logger.debug(message, event="agent:log", name=self.name)
        else:
            self._logger.info(message, event="agent:log", name=self.name)

    async def update_status(self, status: AgentStatus):
        self.status = status
        payload = {
            "agent_id": self.agent_id,
            "name": self.name,
            "status": status.value,
            "model": self.model,
            "provider": self.provider,
        }
        await self.broadcaster.broadcast_to_session(self.session_id, "agent:status", payload)
        self._logger.info("agent_status_updated", status=status.value, name=self.name)

    async def _register_memory(self, strategy: "AgentStrategy"):
        if self.memory_context:
            await self.memory_context.register_agent(
                agent_id=self.agent_id,
                name=self.name,
                strategy=strategy,
                model=self.model,
                provider=self.provider,
            )

    async def _inject_sibling_context(self, base_prompt: str, strategy_summary: str, specialty: str) -> str:
        if not self.memory_context:
            return base_prompt
        sibling_context = await self.memory_context.get_sibling_context(self.agent_id)
        if not sibling_context:
            return base_prompt
        return (
            f"{base_prompt}\n\n---\n"
            f"IMPORTANT CONTEXT: Other agents are simultaneously solving this same task.\n"
            f"Their approaches (to avoid duplication):\n"
            f"{sibling_context}\n"
            f"Your implementation MUST be meaningfully different from these approaches.\n"
            f"Focus on your assigned specialty: {specialty}\n"
            f"---"
        )

    async def _record_progress(self, partial_output: str):
        if self.memory_context:
            await self.memory_context.update_progress(self.agent_id, partial_output)

    async def _record_complete(self, final_output: str):
        if self.memory_context:
            await self.memory_context.mark_complete(self.agent_id, final_output)

    async def _record_failed(self, error: str):
        if self.memory_context:
            await self.memory_context.mark_failed(self.agent_id, error)

    @abstractmethod
    async def execute(self, task: dict) -> AgentResult:
        pass
