from datetime import datetime, timezone

from pydantic import BaseModel, Field


class TaskPlan(BaseModel):
    task_description: str
    complexity: str
    language: str
    estimated_loc: int
    key_components: list[str] = Field(default_factory=list)


class AgentStrategy(BaseModel):
    strategy_id: str
    name: str
    approach: str
    model_recommendation: str
    provider_recommendation: str
    constraints: list[str] = Field(default_factory=list)
    success_criteria: list[str] = Field(default_factory=list)


class PlannerResult(BaseModel):
    plan: TaskPlan
    strategies: list[AgentStrategy]
    recommended_num_agents: int


class AgentResult(BaseModel):
    success: bool = True
    data: dict = Field(default_factory=dict)
    error: str | None = None


class SwarmResult(BaseModel):
    session_id: str
    agents_launched: int
    agents_succeeded: int
    agents_failed: int
    results: list[AgentResult] = Field(default_factory=list)
    total_duration_ms: int
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
