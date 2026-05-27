from dataclasses import dataclass, field

from core.connection_manager import ConnectionManager
from evaluation.scorer import AgentScorer, AgentScore
from evaluation.test_runner import TestReport
from evaluation.winner_selector import WinnerResult, WinnerSelector
from models.plan import AgentResult


@dataclass
class BenchmarkRunResult:
    scores: list[AgentScore] = field(default_factory=list)
    winner: WinnerResult | None = None


class BenchmarkRunner:
    def __init__(self, broadcaster: ConnectionManager):
        self.broadcaster = broadcaster
        self.scorer = AgentScorer()
        self.selector = WinnerSelector()

    async def run(
        self,
        session_id: str,
        results: list[AgentResult],
        reports: list[TestReport],
        durations_ms: list[int],
    ) -> BenchmarkRunResult:
        fastest = min(durations_ms) if durations_ms else None
        slowest = max(durations_ms) if durations_ms else None

        scores = [
            self.scorer.score_agent(
                result=result,
                test_report=report,
                agent_id=result.data.get("agent_id") if isinstance(result.data, dict) else None,
                duration_ms=duration_ms,
                fastest_duration_ms=fastest,
                slowest_duration_ms=slowest,
            )
            for result, report, duration_ms in zip(results, reports, durations_ms)
        ]

        winner = self.selector.select_winner(scores)
        if winner.winner_id is not None:
            await self.broadcaster.broadcast_to_session(
                session_id,
                "benchmark:winner",
                {
                    "agent_id": winner.winner_id,
                    "score": winner.winner_score,
                    "summary": winner.selection_summary,
                },
            )

        return BenchmarkRunResult(scores=scores, winner=winner)
