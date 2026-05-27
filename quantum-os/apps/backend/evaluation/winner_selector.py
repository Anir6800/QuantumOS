from dataclasses import dataclass, field

from evaluation.scorer import AgentScore


@dataclass
class WinnerResult:
    winner_id: str | None
    winner_score: float | None
    runner_up_id: str | None
    full_ranking: list[AgentScore] = field(default_factory=list)
    selection_summary: str = ""


class WinnerSelector:
    def select_winner(self, scores: list[AgentScore]) -> WinnerResult:
        eligible = [score for score in scores if not score.disqualified]
        ranked = sorted(eligible, key=lambda score: score.total_score, reverse=True)

        winner = ranked[0] if ranked else None
        runner_up = ranked[1] if len(ranked) > 1 else None

        if winner:
            runner_text = f" Runner-up: {runner_up.agent_id}." if runner_up else ""
            summary = (
                f"{winner.agent_id} was selected because it achieved the highest balanced score across syntax, "
                f"completeness, security, complexity, and speed.{runner_text}"
            )
        else:
            summary = "No eligible agent produced a valid score."

        return WinnerResult(
            winner_id=winner.agent_id if winner else None,
            winner_score=winner.total_score if winner else None,
            runner_up_id=runner_up.agent_id if runner_up else None,
            full_ranking=ranked,
            selection_summary=summary,
        )
