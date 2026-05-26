from fastapi import APIRouter

from core.log_store import LogEntry, SessionLogStore

router = APIRouter(tags=["logs"])


@router.get("/api/v1/logs/{session_id}")
async def get_session_logs(
    session_id: str,
    level: str | None = None,
    since: float | None = None,
    limit: int = 100,
) -> list[LogEntry]:
    store = SessionLogStore.get_instance()
    return store.get_by_session(session_id, level=level, since=since, limit=limit)


@router.get("/api/v1/logs")
async def get_global_logs(limit: int = 100) -> list[LogEntry]:
    store = SessionLogStore.get_instance()
    return store.get_global(limit=limit)
