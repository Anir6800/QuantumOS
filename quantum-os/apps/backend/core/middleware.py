import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from core.log_store import LogEntry, SessionLogStore
from core.logger import get_logger
from services.ws_broadcaster import get_broadcaster


logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()

        response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000
        session_id = request.path_params.get("session_id") if request.path_params else None

        logger.log_request(request.method, request.url.path, response.status_code, duration_ms)

        entry = LogEntry(
            level="info",
            ts=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            session_id=session_id,
            logger=__name__,
            message="http_request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        await SessionLogStore.get_instance().append(entry)

        if session_id:
            broadcaster = get_broadcaster()
            await broadcaster.broadcast_to_session(session_id, "system:log", entry.model_dump())

        response.headers["X-Request-ID"] = request_id
        return response
