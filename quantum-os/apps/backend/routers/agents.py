from fastapi import APIRouter, status
from typing import List, Optional
from schemas import AgentResponse
from core.exceptions import AgentNotFoundException

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])

# Mock agent store for now
_mock_agents = {}

@router.get("", response_model=List[AgentResponse], status_code=status.HTTP_200_OK)
async def list_agents(session_id: Optional[str] = None):
    agents = list(_mock_agents.values())
    if session_id:
        agents = [a for a in agents if a.session_id == session_id]
    return agents

@router.get("/{agent_id}", response_model=AgentResponse, status_code=status.HTTP_200_OK)
async def get_agent(agent_id: str):
    agent = _mock_agents.get(agent_id)
    if not agent:
        raise AgentNotFoundException(f"Agent {agent_id} not found")
    return agent

@router.post("/{agent_id}/stop", status_code=status.HTTP_200_OK)
async def stop_agent(agent_id: str):
    agent = _mock_agents.get(agent_id)
    if not agent:
        raise AgentNotFoundException(f"Agent {agent_id} not found")
    
    agent.status = "STOPPED"
    return {"message": f"Agent {agent_id} stopped gracefully"}
