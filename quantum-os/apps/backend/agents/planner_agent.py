import asyncio
import json
import math
from typing import Any

from agents.base_agent import AgentStatus, BaseAgent
from core.connection_manager import ConnectionManager
from models.plan import AgentResult, AgentStrategy, PlannerResult, TaskPlan
from services.provider_registry import provider_registry


PLANNER_SYSTEM_PROMPT = """You are an expert software architect analyzing a coding task.
Your job: decompose the task into 3-4 distinct implementation strategies.
Each strategy must specify: approach, key algorithms, code structure,
performance tradeoffs, and the best AI model to implement it.
Output ONLY valid JSON matching the AgentStrategy schema.
Strategies must be meaningfully different (not just style variations)."""


class PlannerAgent(BaseAgent):
    def __init__(self, session_id: str, broadcaster: ConnectionManager):
        super().__init__(
            name="planner",
            model="llama-3.3-70b-versatile",
            provider="groq",
            session_id=session_id,
            broadcaster=broadcaster,
        )
        self._provider = provider_registry.get_provider("groq")

    async def analyze_task(self, raw_task: str) -> TaskPlan:
        lowered = raw_task.lower()
        language = "python" if "python" in lowered else "typescript" if "typescript" in lowered or "next.js" in lowered else "mixed"
        components = ["api", "models", "services", "tests"]
        complexity = "high" if len(raw_task) > 220 else "medium" if len(raw_task) > 100 else "low"
        estimated_loc = max(80, min(1200, len(raw_task) * 3))
        return TaskPlan(
            task_description=raw_task,
            complexity=complexity,
            language=language,
            estimated_loc=estimated_loc,
            key_components=components,
        )

    async def generate_strategies(self, plan: TaskPlan) -> list[AgentStrategy]:
        system_prompt = await self._inject_sibling_context(
            PLANNER_SYSTEM_PROMPT,
            strategy_summary=strategy.approach,
            specialty="planning and decomposition",
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "task_description": plan.task_description,
                        "complexity": plan.complexity,
                        "language": plan.language,
                        "estimated_loc": plan.estimated_loc,
                        "key_components": plan.key_components,
                        "required_count": "3-4",
                    }
                ),
            },
        ]

        raw = await asyncio.wait_for(self._provider.complete(messages=messages, model=self.model), timeout=30)

        try:
            parsed: Any = json.loads(raw)
            if isinstance(parsed, dict):
                parsed = [parsed]
            strategies = [AgentStrategy(**item) for item in parsed]
            if len(strategies) < 3:
                raise ValueError("Not enough strategies")
            return strategies[:4]
        except Exception:
            return self._default_strategies(plan)

    def _default_strategies(self, plan: TaskPlan) -> list[AgentStrategy]:
        return [
            AgentStrategy(
                strategy_id="strat-a",
                name="Layered Monolith",
                approach="Implement clear router-service-model layering with synchronous orchestration first.",
                model_recommendation="llama-3.3-70b-versatile",
                provider_recommendation="groq",
                constraints=["Fast delivery", "Moderate scalability"],
                success_criteria=["Feature complete", "Deterministic API behavior"],
            ),
            AgentStrategy(
                strategy_id="strat-b",
                name="Event-Driven Pipeline",
                approach="Use queue-like internal events to decouple planning, execution, and reporting components.",
                model_recommendation="deepseek/deepseek-coder",
                provider_recommendation="openrouter",
                constraints=["Higher complexity", "More observability needed"],
                success_criteria=["Loose coupling", "Resilient stage retries"],
            ),
            AgentStrategy(
                strategy_id="strat-c",
                name="Parallel Specialist Agents",
                approach="Split the task into independent workstreams executed by specialized agents in parallel.",
                model_recommendation="llama-3.3-70b-versatile",
                provider_recommendation="groq",
                constraints=["Coordination overhead", "Requires conflict resolution"],
                success_criteria=["Reduced total cycle time", "High quality merge output"],
            ),
        ]

    async def execute(self, task: dict) -> AgentResult:
        raw_task = task.get("task_description") or task.get("task") or ""
        strategy = task.get("strategy")
        if strategy is None:
            strategy = AgentStrategy(
                strategy_id="planner",
                name="Planning",
                approach="Decompose the task into distinct implementation strategies.",
                model_recommendation=self.model,
                provider_recommendation=self.provider,
            )
        await self._register_memory(strategy)
        await self.update_status(AgentStatus.RUNNING)
        await self.log("info", "Planner started analysis")

        await self.broadcaster.broadcast_to_session(self.session_id, "planner:analyzing", {
            "agent_id": self.agent_id,
            "task_description": raw_task,
        })

        plan = await self.analyze_task(raw_task)
        strategies = await self.generate_strategies(plan)

        await self.broadcaster.broadcast_to_session(self.session_id, "planner:strategies_ready", {
            "agent_id": self.agent_id,
            "strategies": [s.model_dump() for s in strategies],
        })

        result = PlannerResult(
            plan=plan,
            strategies=strategies,
            recommended_num_agents=max(3, min(4, math.ceil(len(strategies)))),
        )

        await self.update_status(AgentStatus.COMPLETE)
        await self.log("info", "Planner completed")
        await self._record_complete(str(result.model_dump()))
        return AgentResult(success=True, data=result.model_dump())
