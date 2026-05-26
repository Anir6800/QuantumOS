import asyncio
import time
from dataclasses import dataclass

from agents.orchestrator import SwarmOrchestrator
from agents.planner_agent import PlannerAgent
from core.connection_manager import ConnectionManager
from models.plan import AgentResult, AgentStrategy
from schemas import SessionResponse, SessionStatus


@dataclass
class DummyEvent:
    type: str
    payload: dict
    ts: int


class DummyBroadcaster:
    def __init__(self):
        self.events: list[DummyEvent] = []

    async def broadcast_to_session(self, session_id: str, event_type: str, payload: dict):
        self.events.append(DummyEvent(type=event_type, payload=payload, ts=int(time.time() * 1000)))


class FakeAgent:
    def __init__(self, agent_id: str, delay: float, should_fail: bool, broadcaster: DummyBroadcaster, session_id: str):
        self.agent_id = agent_id
        self.delay = delay
        self.should_fail = should_fail
        self.broadcaster = broadcaster
        self.session_id = session_id
        self.started_at = None

    async def execute(self, task: dict) -> AgentResult:
        self.started_at = time.time()
        await self.broadcaster.broadcast_to_session(
            self.session_id,
            "agent:started",
            {"agent_id": self.agent_id, "model": "test", "provider": "test"},
        )
        await asyncio.sleep(self.delay)
        if self.should_fail:
            raise RuntimeError(f"boom:{self.agent_id}")
        output = f"output:{self.agent_id}"
        await self.broadcaster.broadcast_to_session(
            self.session_id,
            "agent:complete",
            {"agent_id": self.agent_id, "output": output, "duration_ms": int(self.delay * 1000)},
        )
        return AgentResult(success=True, data={"output": output, "duration_ms": int(self.delay * 1000)})


async def main():
    broadcaster = DummyBroadcaster()
    orchestrator = SwarmOrchestrator(session_id="session-1", broadcaster=broadcaster)
    session = SessionResponse(
        id="session-1",
        task_description="verify swarm execution",
        status=SessionStatus.RUNNING,
        created_at=__import__("datetime").datetime.now(__import__("datetime").timezone.utc),
    )

    strategies = [
        AgentStrategy(
            strategy_id="a",
            name="Speed",
            approach="fast path",
            model_recommendation="m1",
            provider_recommendation="groq",
        ),
        AgentStrategy(
            strategy_id="b",
            name="Scalability",
            approach="parallelization",
            model_recommendation="m2",
            provider_recommendation="groq",
        ),
        AgentStrategy(
            strategy_id="c",
            name="Security",
            approach="hardening",
            model_recommendation="m3",
            provider_recommendation="openrouter",
        ),
    ]

    planner_result = AgentResult(
        success=True,
        data={
            "strategies": [s.model_dump() for s in strategies],
        },
    )

    planner_execute_original = PlannerAgent.execute

    async def planner_execute_stub(self, task: dict):
        return planner_result

    PlannerAgent.execute = planner_execute_stub

    fake_agents = {
        "a": FakeAgent("a", delay=0.5, should_fail=False, broadcaster=broadcaster, session_id="session-1"),
        "b": FakeAgent("b", delay=0.7, should_fail=True, broadcaster=broadcaster, session_id="session-1"),
        "c": FakeAgent("c", delay=0.6, should_fail=False, broadcaster=broadcaster, session_id="session-1"),
    }

    async def create_agent_stub(strategy: AgentStrategy):
        return fake_agents[strategy.strategy_id]

    orchestrator._create_agent_from_strategy = create_agent_stub  # type: ignore[method-assign]

    try:
        result = await orchestrator.run_session(session, "verify parallelism")
    finally:
        PlannerAgent.execute = planner_execute_original

    starts = [agent.started_at for agent in fake_agents.values()]
    max_delta = max(starts) - min(starts)
    launched = [e for e in broadcaster.events if e.type == "session:launched"]
    complete = [e for e in broadcaster.events if e.type == "session:complete"]

    print(f"agents_launched={result.agents_launched}")
    print(f"agents_succeeded={result.agents_succeeded}")
    print(f"agents_failed={result.agents_failed}")
    print(f"results={len(result.results)}")
    print(f"non_empty_outputs={all(bool(r.data.get('output')) for r in result.results if r.success)}")
    print(f"parallel_start_delta_s={max_delta:.3f}")
    print(f"session_launched_events={len(launched)}")
    print(f"session_complete_events={len(complete)}")
    print(f"complete_payload={complete[0].payload if complete else {}}")

    assert result.agents_launched == 3
    assert result.agents_succeeded == 2
    assert result.agents_failed == 1
    assert len(result.results) == 3
    assert all(bool(r.data.get("output")) for r in result.results if r.success)
    assert max_delta < 1.0
    assert launched and launched[0].payload["agent_count"] == 3
    assert complete and complete[0].payload["agents_succeeded"] == 2


if __name__ == "__main__":
    asyncio.run(main())
