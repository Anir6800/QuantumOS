import time
from typing import Any, Dict

ALL_EVENTS = {
    "session:started": {"session_id": str, "timestamp": str},
    "session:launched": {"session_id": str, "agent_count": int},
    "session:complete": {"session_id": str, "winner_agent_id": str},
    "agent:started": {"agent_id": str, "model": str, "provider": str},
    "agent:provider-request": {"agent_id": str, "provider": str, "model": str, "retry": bool},
    "agent:log": {"agent_id": str, "level": str, "message": str, "timestamp": str},
    "agent:thinking": {"agent_id": str, "content": str},
    "agent:answer": {"agent_id": str, "provider": str, "model": str, "success": bool, "reason": str},
    "agent:complete": {"agent_id": str, "output": str, "duration_ms": int},
    "agent:failed": {"agent_id": str, "error": str},
    "memory:sync": {"session_id": str, "task_description": str, "created_at": float, "entries": list},
    "memory:snapshot": {"session_id": str, "task_description": str, "created_at": float, "entries": list},
    "benchmark:running": {"session_id": str, "agents_evaluated": int},
    "benchmark:score": {"agent_id": str, "score": float, "metrics": dict},
    "benchmark:winner": {"agent_id": str, "score": float, "summary": str}
}

def create_event(type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "event": type,
        "data": payload,
        "ts": int(time.time() * 1000)
    }
