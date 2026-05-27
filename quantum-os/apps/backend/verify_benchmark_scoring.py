import asyncio

from core.connection_manager import ConnectionManager
from evaluation.benchmark_runner import BenchmarkRunner
from evaluation.scorer import AgentScorer
from evaluation.test_runner import CodeTestRunner
from evaluation.winner_selector import WinnerSelector
from models.plan import AgentResult


class DummyBroadcaster(ConnectionManager):
    def __init__(self):
        super().__init__()
        self.events = []

    async def broadcast_to_session(self, session_id: str, event_type: str, payload: dict):
        self.events.append((event_type, payload))


async def main():
    scorer = AgentScorer()
    selector = WinnerSelector()
    runner = CodeTestRunner()

    bad_code = "def broken(:\n    pass\n"
    good_code = "def ok(a, b):\n    return a + b\n"
    report_bad = runner.analyze(bad_code, "python")
    report_good = runner.analyze(good_code, "python")

    bad_result = AgentResult(success=False, error="syntax error", data={"agent_id": "bad"})
    good_result_1 = AgentResult(success=True, data={"agent_id": "winner"})
    good_result_2 = AgentResult(success=True, data={"agent_id": "runner_up"})

    bad_score = scorer.score_agent(bad_result, report_bad, agent_id="bad", duration_ms=500, fastest_duration_ms=100, slowest_duration_ms=500)
    score_1 = scorer.score_agent(good_result_1, report_good, agent_id="winner", duration_ms=100, fastest_duration_ms=100, slowest_duration_ms=500)
    score_2 = scorer.score_agent(good_result_2, report_good, agent_id="runner_up", duration_ms=300, fastest_duration_ms=100, slowest_duration_ms=500)

    ranking = selector.select_winner([bad_score, score_2, score_1])

    broadcaster = DummyBroadcaster()
    benchmark_runner = BenchmarkRunner(broadcaster)
    await benchmark_runner.run(
        "session-1",
        [bad_result, good_result_1, good_result_2],
        [report_bad, report_good, report_good],
        [500, 100, 300],
    )

    winner_events = [event for event in broadcaster.events if event[0] == "benchmark:winner"]

    print("syntax_disqualified=", bad_score.disqualified)
    print("syntax_total_score=", bad_score.total_score)
    print("winner_id=", ranking.winner_id)
    print("ranking_order=", [score.agent_id for score in ranking.full_ranking])
    print("winner_event_payload=", winner_events[0][1] if winner_events else {})

    assert bad_score.disqualified is True
    assert bad_score.total_score == 0
    assert ranking.winner_id == "winner"
    assert [score.agent_id for score in ranking.full_ranking] == ["winner", "runner_up"]
    assert winner_events and winner_events[0][1]["agent_id"] == "winner"


if __name__ == "__main__":
    asyncio.run(main())
