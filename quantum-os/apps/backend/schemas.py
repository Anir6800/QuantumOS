from pydantic import BaseModel, ConfigDict, model_validator
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
    
    @model_validator(mode='after')
    def validate_task(self):
        if not self.task_description.strip():
            raise ValueError("task_description cannot be empty")
        return self

class SessionStatusUpdate(BaseModel):
    status: SessionStatus

class SessionResponse(BaseModel):
    id: str
    task_description: str
    status: SessionStatus
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AgentResponse(BaseModel):
    id: str
    session_id: str
    status: str
