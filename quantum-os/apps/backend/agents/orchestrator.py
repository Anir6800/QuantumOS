import asyncio
import time
from typing import Optional

from agents.base_agent import BaseAgent
from agents.planner_agent import PlannerAgent
from agents.scalability_agent import ScalabilityAgent
from agents.security_agent import SecurityAgent
from agents.speed_agent import SpeedAgent
from core.connection_manager import ConnectionManager
from core.logger import get_logger
from models.plan import AgentResult, AgentStrategy, SwarmResult
from schemas import SessionResponse
from services.memory_service import MemoryService
from services.provider_registry import ProviderRegistry, provider_registry


class SwarmOrchestrator:
    def __init__(
        self,
        session_id: str,
        broadcaster: ConnectionManager,
        provider_registry: ProviderRegistry = provider_registry,
        max_concurrent_agents: int = 5,
    ):
        self.session_id = session_id
        self.broadcaster = broadcaster
        self.provider_registry = provider_registry
        self.max_concurrent_agents = max_concurrent_agents
        self._logger = get_logger(__name__, session_id=session_id)

    async def run_session(self, session: SessionResponse, task: str) -> SwarmResult:
        started_at = time.time()
        if session.id != self.session_id:
            self._logger.warn(
                "session_id_mismatch",
                session_id=session.id,
                orchestrator_session_id=self.session_id,
            )

        memory_service = MemoryService.get_instance()
        memory_context = await memory_service.create_context(self.session_id, task)
        sync_stop = asyncio.Event()
        sync_task = asyncio.create_task(self._sync_memory_loop(memory_context, sync_stop))

        try:
            planner = PlannerAgent(session_id=self.session_id, broadcaster=self.broadcaster)
            planner.memory_context = memory_context
            plan_result = await planner.execute({"task_description": task})
            if not plan_result.success:
                await self._handle_agent_failure(planner.agent_id, Exception(plan_result.error or "Planner failed"))
                return SwarmResult(
                    session_id=self.session_id,
                    agents_launched=1,
                    agents_succeeded=0,
                    agents_failed=1,
                    results=[plan_result],
                    total_duration_ms=int((time.time() - started_at) * 1000),
                )

            planner_payload = plan_result.data or {}
            strategies = [AgentStrategy(**strategy) for strategy in planner_payload.get("strategies", [])]

            agent_pairs: list[tuple[BaseAgent, AgentStrategy]] = []
            selected_models = session.models or [
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant",
                "mixtral-8x7b-32768",
            ]
            target_count = min(self.max_concurrent_agents, session.num_agents or 3, len(strategies), len(selected_models))
            for index, strategy in enumerate(strategies[:target_count]):
                model = selected_models[index % len(selected_models)]
                agent = await self._create_agent_from_strategy(strategy, model=model)
                if agent:
                    agent.memory_context = memory_context
                    agent_pairs.append((agent, strategy))

            await self.broadcaster.broadcast_to_session(
                self.session_id,
                "session:launched",
                {"session_id": self.session_id, "agent_count": len(agent_pairs)},
            )

            async def _execute_agent(agent: BaseAgent, strategy: AgentStrategy) -> AgentResult:
                task_payload = {
                    "task_description": task,
                    "strategy_context": strategy.model_dump(),
                    "strategy": strategy,
                }
                try:
                    return await asyncio.wait_for(agent.execute(task_payload), timeout=35)
                except Exception as error:
                    await self._handle_agent_failure(agent.agent_id, error)
                    return AgentResult(success=False, error=str(error))

            results = await asyncio.gather(
                *[_execute_agent(agent, strategy) for agent, strategy in agent_pairs],
                return_exceptions=True,
            )

            normalized_results: list[AgentResult] = []
            agents_succeeded = 0
            agents_failed = 0

            for item in results:
                if isinstance(item, Exception):
                    agents_failed += 1
                    self._logger.error("agent_execution_exception", error=str(item))
                    continue

                normalized_results.append(item)
                if item.success:
                    agents_succeeded += 1
                else:
                    agents_failed += 1

            await self.broadcaster.broadcast_to_session(
                self.session_id,
                "session:complete",
                {
                    "session_id": self.session_id,
                    "agents_succeeded": agents_succeeded,
                    "agents_failed": agents_failed,
                },
            )

            snapshot = memory_context.get_snapshot()
            await self.broadcaster.broadcast_to_session(
                self.session_id,
                "memory:snapshot",
                snapshot,
            )

            return SwarmResult(
                session_id=self.session_id,
                agents_launched=len(agent_pairs),
                agents_succeeded=agents_succeeded,
                agents_failed=agents_failed,
                results=normalized_results,
                total_duration_ms=int((time.time() - started_at) * 1000),
            )
        finally:
            sync_stop.set()
            sync_task.cancel()
            asyncio.create_task(self._cleanup_context_later(self.session_id))

    async def _create_agent_from_strategy(self, strategy: AgentStrategy, model: str) -> Optional[BaseAgent]:
        strategy_type = (strategy.name + " " + strategy.approach).lower()
        provider = self.provider_registry.get_model_provider(model)

        if "security" in strategy_type or "secure" in strategy_type:
            return SecurityAgent(session_id=self.session_id, broadcaster=self.broadcaster, model=model, provider=provider.provider_name)
        if "scalab" in strategy_type or "scale" in strategy_type:
            return ScalabilityAgent(session_id=self.session_id, broadcaster=self.broadcaster, model=model, provider=provider.provider_name)
        if "speed" in strategy_type or "perf" in strategy_type or "latency" in strategy_type:
            return SpeedAgent(session_id=self.session_id, broadcaster=self.broadcaster, model=model, provider=provider.provider_name)

        return SpeedAgent(session_id=self.session_id, broadcaster=self.broadcaster, model=model, provider=provider.provider_name)

    async def _handle_agent_failure(self, agent_id: str, error: Exception):
        self._logger.error("agent_failed", agent_id=agent_id, error=str(error))
        await self.broadcaster.broadcast_to_session(
            self.session_id,
            "agent:failed",
            {"agent_id": agent_id, "error": str(error)},
        )

    async def _cleanup_context_later(self, session_id: str):
        await asyncio.sleep(3600)
        await MemoryService.get_instance().destroy_context(session_id)

    async def _sync_memory_loop(self, memory_context, stop_event: asyncio.Event):
        try:
            last_fingerprint = None
            while not stop_event.is_set():
                # Broadcast a compact snapshot frequently to avoid sending large payloads repeatedly
                try:
                    brief = memory_context.get_brief_snapshot()
                except Exception:
                    brief = memory_context.get_snapshot()

                # Simple change detection to avoid repeating identical payloads
                try:
                    import json

                    fingerprint = json.dumps(brief, sort_keys=True)
                except Exception:
                    fingerprint = str(brief)

                if fingerprint != last_fingerprint:
                    await self.broadcaster.broadcast_to_session(
                        self.session_id,
                        "memory:sync",
                        brief,
                    )
                    last_fingerprint = fingerprint
                try:
                    await asyncio.wait_for(stop_event.wait(), timeout=5)
                except asyncio.TimeoutError:
                    continue
        except asyncio.CancelledError:
            pass
