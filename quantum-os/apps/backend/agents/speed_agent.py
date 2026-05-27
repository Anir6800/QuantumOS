import asyncio
import time

from agents.base_agent import AgentStatus, BaseAgent
from core.connection_manager import ConnectionManager
from models.plan import AgentResult
from services.provider_registry import provider_registry


SYSTEM_PROMPT = """You are an expert in high-performance code optimization.
Priority: minimal time complexity, efficient algorithms, reduced latency.
Prefer: O(1) lookups, batch operations, lazy evaluation, caching.
Write complete, runnable code. No placeholders. Production quality."""


class SpeedAgent(BaseAgent):
    def __init__(
        self,
        session_id: str,
        broadcaster: ConnectionManager,
        model: str = "deepseek/deepseek-coder",
        provider: str = "openrouter",
    ):
        super().__init__(
            name="speed-agent",
            model=model,
            provider=provider,
            session_id=session_id,
            broadcaster=broadcaster,
        )
        self._provider = provider_registry.get_provider(provider)
        self._last_provider_name: str | None = None
        self._last_model: str | None = None

    async def _stream_codegen(self, task_description: str, strategy_context: str, system_prompt: str, strong_retry: bool = False) -> str:
        retry_instruction = "Return only complete runnable code in fenced blocks." if strong_retry else ""
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"Task: {task_description}\nStrategy Context: {strategy_context}\n{retry_instruction}".strip(),
            },
        ]
        chunks: list[str] = []

        async def _run_stream_and_broadcast():
            # Resolve best provider+model dynamically for coding-heavy tasks
            model, provider = provider_registry.route_for_role("coding", preferred_models=[self.model])
            self._last_provider_name = provider.provider_name
            self._last_model = model
            await self.broadcaster.broadcast_to_session(
                self.session_id,
                "agent:provider-request",
                {"agent_id": self.agent_id, "provider": provider.provider_name, "model": model, "retry": strong_retry},
            )
            async for chunk in provider.stream(messages=messages, model=model, max_tokens=300):
                # broadcast incremental thinking chunk to frontend
                if chunk:
                    chunks.append(chunk)
                    try:
                        await self.broadcaster.broadcast_to_session(
                            self.session_id,
                            "agent:thinking",
                            {"agent_id": self.agent_id, "content": chunk},
                        )
                    except Exception:
                        # best-effort: do not fail the stream if broadcast fails
                        pass
                    # update memory progress occasionally
                    try:
                        await self._record_progress("".join(chunks)[-1000:])
                    except Exception:
                        pass

        try:
            await asyncio.wait_for(_run_stream_and_broadcast(), timeout=50)
            return "".join(chunks).strip()
        except Exception:
            return self._fallback_code(task_description)

    def _fallback_code(self, task_description: str) -> str:
        safe_task = task_description.replace('"', '\\"')
        return f'''def optimized_solution(input_data):
    """Fallback implementation generated when the provider fails."""
    result = {{
        "task": "{safe_task}",
        "status": "fallback",
        "items": list(input_data) if input_data is not None else []
    }}
    return result
'''

    def _is_code_like(self, text: str) -> bool:
        bad = ["sorry", "cannot", "can\'t", "unable"]
        if not text or any(x in text.lower() for x in bad):
            return False
        return "```" in text or "def " in text or "class " in text or "function " in text or "import " in text

    def _is_valid_model_output(self, text: str) -> bool:
        return self._is_code_like(text) and "fallback implementation generated when the provider fails" not in text.lower()

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
            specialty="speed and latency optimization",
        )

        output = await self._stream_codegen(task_description, strategy_context, system_prompt, strong_retry=False)
        if not self._is_valid_model_output(output):
            output = await self._stream_codegen(task_description, strategy_context, system_prompt, strong_retry=True)

        provider_name = self._last_provider_name or self.provider
        model_name = self._last_model or self.model

        if not self._is_valid_model_output(output):
            await self.broadcaster.broadcast_to_session(
                self.session_id,
                "agent:answer",
                {
                    "agent_id": self.agent_id,
                    "provider": provider_name,
                    "model": model_name,
                    "success": False,
                    "reason": "Provider did not return valid code output",
                },
            )
            await self.broadcaster.broadcast_to_session(
                self.session_id,
                "agent:failed",
                {"agent_id": self.agent_id, "error": "Provider did not return valid code output"},
            )
            await self.update_status(AgentStatus.FAILED)
            await self._record_failed("Model did not return valid code output")
            return AgentResult(success=False, error="Model did not return valid code output")

        duration_ms = int((time.time() - started_at) * 1000)
        await self.broadcaster.broadcast_to_session(
            self.session_id,
            "agent:answer",
            {
                "agent_id": self.agent_id,
                "provider": provider_name,
                "model": model_name,
                "success": True,
                "reason": "AI returned a valid answer",
            },
        )
        await self.broadcaster.broadcast_to_session(
            self.session_id,
            "agent:complete",
            {"agent_id": self.agent_id, "output": output, "duration_ms": duration_ms},
        )
        await self.update_status(AgentStatus.COMPLETE)
        await self._record_progress(output)
        await self._record_complete(output)
        return AgentResult(
            success=True,
            data={
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "model": self.model,
                "output": output,
                "duration_ms": duration_ms,
            },
        )
