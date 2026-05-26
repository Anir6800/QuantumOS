import asyncio
import contextlib
import time

from agents.orchestrator import SwarmOrchestrator
from core.agent_memory import AgentMemoryContext
from models.plan import AgentStrategy


class DummyBroadcaster:
    def __init__(self):
        self.events = []

    async def broadcast_to_session(self, session_id: str, event_type: str, payload: dict):
        self.events.append((time.time(), event_type, payload))


class FakeAgent:
    def __init__(self, agent_id: str, output: str, delay: float, should_fail: bool, broadcaster: DummyBroadcaster):
        self.agent_id = agent_id
        self.output = output
        self.delay = delay
        self.should_fail = should_fail
        self.broadcaster = broadcaster
        self.memory_context = None
        self.name = f"agent-{agent_id}"
        self.model = "test-model"
        self.provider = "test-provider"

    async def execute(self, task: dict):
        strategy = task["strategy"]
        if self.memory_context:
            await self.memory_context.register_agent(self.agent_id, self.name, strategy, self.model, self.provider)
        await asyncio.sleep(self.delay)
        if self.should_fail:
            raise RuntimeError(f"boom:{self.agent_id}")
        if self.memory_context:
            await self.memory_context.update_progress(self.agent_id, self.output[:50])
            await self.memory_context.mark_complete(self.agent_id, self.output)
        return type("R", (), {"success": True, "data": {"output": self.output}})()


async def check_register_race():
    context = AgentMemoryContext(session_id="race", task_description="race test")
    strategy = AgentStrategy(
        strategy_id="s",
        name="Shared",
        approach="shared",
        model_recommendation="m",
        provider_recommendation="p",
    )

    async def register(i: int):
        await context.register_agent(f"a{i}", f"agent-{i}", strategy, "m", "p")

    await asyncio.gather(*(register(i) for i in range(5)))
    snapshot = context.get_snapshot()
    assert len(snapshot["entries"]) == 5
    return snapshot


async def check_sync_events():
    broadcaster = DummyBroadcaster()
    orchestrator = SwarmOrchestrator(session_id="sync-session", broadcaster=broadcaster)
    context = AgentMemoryContext(session_id="sync-session", task_description="sync test")
    stop = asyncio.Event()
    task = asyncio.create_task(orchestrator._sync_memory_loop(context, stop))
    try:
        await asyncio.sleep(11.5)
    finally:
        stop.set()
        task.cancel()
        with contextlib.suppress(Exception):
            await task
    sync_events = [e for e in broadcaster.events if e[1] == "memory:sync"]
    return sync_events


async def main():
    context = AgentMemoryContext(session_id="s1", task_description="same task")
    strategies = [
        AgentStrategy(strategy_id="1", name="Speed", approach="O(1) lookup focus", model_recommendation="m1", provider_recommendation="groq"),
        AgentStrategy(strategy_id="2", name="Scalability", approach="queue + batching focus", model_recommendation="m2", provider_recommendation="groq"),
        AgentStrategy(strategy_id="3", name="Security", approach="validation + auth focus", model_recommendation="m3", provider_recommendation="openrouter"),
    ]
    for i, strategy in enumerate(strategies, start=1):
        await context.register_agent(f"agent-{i}", f"Agent{i}", strategy, f"model-{i}", "provider")
    assert len(context.get_snapshot()["entries"]) == 3

    sibling = await context.get_sibling_context("agent-1")
    assert "Agent1" not in sibling
    assert "Agent2" in sibling and "Agent3" in sibling

    outputs = [
        "def fast_path():\n    cache = {}\n    return cache",
        "async def scalable_path(queue):\n    await queue.put('job')\n    return 'batched'",
        "def secure_path(token):\n    if not token: raise ValueError()\n    return True",
    ]
    fake_broadcaster = DummyBroadcaster()
    orchestrator = SwarmOrchestrator(session_id="vis", broadcaster=fake_broadcaster)
    agents = [
        FakeAgent("agent-1", outputs[0], 0.3, False, fake_broadcaster),
        FakeAgent("agent-2", outputs[1], 0.4, True, fake_broadcaster),
        FakeAgent("agent-3", outputs[2], 0.2, False, fake_broadcaster),
    ]
    agent_pairs = list(zip(agents, strategies))
    for agent, _ in agent_pairs:
        agent.memory_context = context
    results = await asyncio.gather(*[agent.execute({"strategy": strategy}) for agent, strategy in agent_pairs], return_exceptions=True)
    assert any(isinstance(r, Exception) for r in results)
    assert any(not isinstance(r, Exception) for r in results)

    race_snapshot = await check_register_race()
    sync_events = await check_sync_events()

    print("entries_after_3_launch=", len(context.get_snapshot()["entries"]))
    print("sibling_context=", sibling)
    print("distinct_outputs=", len(set(outputs)) == 3)
    print("race_entries=", len(race_snapshot["entries"]))
    print("memory_sync_event_count=", len(sync_events))
    if sync_events:
        deltas = [sync_events[i][0] - sync_events[i - 1][0] for i in range(1, len(sync_events))]
        print("memory_sync_deltas=", deltas)

    assert len(sync_events) >= 2
    if len(sync_events) >= 2:
        assert 4 <= (sync_events[1][0] - sync_events[0][0]) <= 6.5


if __name__ == "__main__":
    asyncio.run(main())
