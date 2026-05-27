from dataclasses import dataclass, field

from evaluation.test_runner import TestReport
from models.plan import AgentResult


WEIGHTS = {
    "syntax": 0.25,
    "completeness": 0.25,
    "security": 0.20,
    "complexity": 0.15,
    "speed_score": 0.15,
}


@dataclass
class AgentScore:
    agent_id: str
    syntax_score: int
    completeness_score: int
    security_score: int
    complexity_score: int
    speed_score: int
    total_score: float
    disqualified: bool
    details: dict = field(default_factory=dict)


class AgentScorer:
    def score_agent(
        self,
        result: AgentResult,
        test_report: TestReport,
        agent_id: str | None = None,
        duration_ms: int = 0,
        fastest_duration_ms: int | None = None,
        slowest_duration_ms: int | None = None,
    ) -> AgentScore:
        agent_id = agent_id or result.data.get("agent_id") or "unknown"

        syntax_score = 100 if test_report.syntax.passed else 0
        disqualified = not test_report.syntax.passed

        if not test_report.completeness.is_complete:
            completeness_score = 60 if test_report.completeness.incomplete_sections and len(test_report.completeness.incomplete_sections) <= 2 else 0
        else:
            completeness_score = 100

        if test_report.security.risk_level == "low":
            security_score = 100
        elif test_report.security.risk_level == "medium":
            security_score = 60
        else:
            security_score = 20

        complexity_value = test_report.complexity.complexity_score
        complexity_score = max(0, min(100, 100 - (complexity_value * 5)))

        if fastest_duration_ms is None or slowest_duration_ms is None or fastest_duration_ms <= 0 or slowest_duration_ms <= 0:
            speed_score = 100
        elif slowest_duration_ms == fastest_duration_ms:
            speed_score = 100
        else:
            normalized = (slowest_duration_ms - duration_ms) / max(1, slowest_duration_ms - fastest_duration_ms)
            speed_score = max(0, min(100, int(round(normalized * 100))))

        if disqualified:
            total_score = 0.0
        else:
            total_score = (
                syntax_score * WEIGHTS["syntax"]
                + completeness_score * WEIGHTS["completeness"]
                + security_score * WEIGHTS["security"]
                + complexity_score * WEIGHTS["complexity"]
                + speed_score * WEIGHTS["speed_score"]
            )

        return AgentScore(
            agent_id=agent_id,
            syntax_score=syntax_score,
            completeness_score=completeness_score,
            security_score=security_score,
            complexity_score=complexity_score,
            speed_score=speed_score,
            total_score=total_score,
            disqualified=disqualified,
            details={
                "duration_ms": duration_ms,
                "fastest_duration_ms": fastest_duration_ms,
                "slowest_duration_ms": slowest_duration_ms,
            },
        )
