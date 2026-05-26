import asyncio
import time

from agents.base_agent import AgentStatus, BaseAgent
from core.connection_manager import ConnectionManager
from models.plan import AgentResult
from services.provider_registry import provider_registry


SYSTEM_PROMPT = """You are an expert distributed systems engineer.
Priority: horizontal scalability, stateless design, async patterns, connection pooling.
Prefer: queue-based processing, idempotent operations, circuit breakers.
Write complete, runnable code. No placeholders. Production quality."""


class ScalabilityAgent(BaseAgent):
    def __init__(
        self,
        session_id: str,
        broadcaster: ConnectionManager,
        model: str = "llama-3.3-70b-versatile",
        provider: str = "groq",
    ):
        super().__init__(
            name="scalability-agent",
            model=model,
            provider=provider,
            session_id=session_id,
            broadcaster=broadcaster,
        )
        self._provider = provider_registry.get_provider(provider)

    async def _stream_codegen(self, task_description: str, strategy_context: str, system_prompt: str, strong_retry: bool = False) -> str:
        retry_instruction = "Return only complete runnable code in fenced blocks." if strong_retry else ""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Task: {task_description}\nStrategy Context: {strategy_context}\n{retry_instruction}".strip()},
        ]
        chunks: list[str] = []
        token_budget = 0

        async def _run_stream():
            nonlocal token_budget
            async for chunk in self._provider.stream(messages=messages, model=self.model):
                chunks.append(chunk)
                token_budget += len(chunk.split())
                if token_budget >= 500:
                    await self._record_progress("".join(chunks))
                    token_budget = 0
                await self.broadcaster.broadcast_to_session(
                    self.session_id,
                    "agent:thinking",
                    {"agent_id": self.agent_id, "content": chunk},
                )

        await asyncio.wait_for(_run_stream(), timeout=90)
        return "".join(chunks).strip()

    def _is_code_like(self, text: str) -> bool:
        bad = ["sorry", "cannot", "can\'t", "unable"]
        if not text or any(x in text.lower() for x in bad):
            return False
        return "```" in text or "def " in text or "class " in text or "function " in text or "import " in text

    async def execute(self, task: dict) -> AgentResult:
        started_at = time.time()
        task_description = task.get("task_description", "")
        strategy_context = task.get("strategy_context", "")
        from models.plan import AgentStrategy
        strategy = task.get("strategy") or AgentStrategy(**strategy_context)
        await self._register_memory(strategy)

        await self.update_status(AgentStatus.RUNNING)
        await self.broadcaster.broadcast_to_session(
            self.session_id,
            "agent:started",
            {"agent_id": self.agent_id, "name": self.name, "model": self.model, "provider": self.provider},
        )

        system_prompt = await self._inject_sibling_context(
            SYSTEM_PROMPT,
            strategy_summary=strategy.approach,
            specialty="horizontal scalability and resilience",
        )

        output = await self._stream_codegen(task_description, strategy_context, system_prompt, strong_retry=False)
        if not self._is_code_like(output):
            output = await self._stream_codegen(task_description, strategy_context, system_prompt, strong_retry=True)

        if not self._is_code_like(output):
            await self.update_status(AgentStatus.FAILED)
            await self._record_failed("Model did not return valid code output")
            return AgentResult(success=False, error="Model did not return valid code output")

        duration_ms = int((time.time() - started_at) * 1000)
        await self.broadcaster.broadcast_to_session(
            self.session_id,
            "agent:complete",
            {"agent_id": self.agent_id, "output": output, "duration_ms": duration_ms},
        )
        await self.update_status(AgentStatus.COMPLETE)
        await self._record_progress(output)
        await self._record_complete(output)
        return AgentResult(success=True, data={"output": output, "duration_ms": duration_ms})
