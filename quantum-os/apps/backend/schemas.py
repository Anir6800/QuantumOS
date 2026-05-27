from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List, Optional
from datetime import datetime
from enum import Enum

class SessionStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class SessionCreate(BaseModel):
    task_description: str
    models: List[str] = Field(default_factory=list)
    num_agents: int = 3
    provider: str = "groq"
    
    @model_validator(mode='after')
    def validate_task(self):
        if not self.task_description.strip():
            raise ValueError("task_description cannot be empty")
        if self.num_agents < 2:
            raise ValueError("num_agents must be at least 2")
        if not self.models:
            raise ValueError("at least one model must be selected")
        return self

class SessionStatusUpdate(BaseModel):
    status: SessionStatus

class SessionResponse(BaseModel):
    id: str
    task_description: str
    status: SessionStatus
    created_at: datetime
    models: List[str] = Field(default_factory=list)
    num_agents: int = 3
    provider: str = "groq"
    
    model_config = ConfigDict(from_attributes=True)

class AgentResponse(BaseModel):
    id: str
    session_id: str
    status: str
