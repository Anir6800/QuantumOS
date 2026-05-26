import json
import logging
from datetime import datetime, timezone
from typing import Any


def _safe_json_value(value: Any) -> Any:
    try:
        json.dumps(value)
        return value
    except TypeError:
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc).isoformat()
        return str(value)


class StructuredLogger:
    def __init__(self, name: str, session_id: str = None, agent_id: str = None):
        self.name = name
        self.session_id = session_id
        self.agent_id = agent_id
        self._logger = logging.getLogger(name)

    def _format(self, level: str, message: str, **extra) -> dict:
        serializable_extra = {k: _safe_json_value(v) for k, v in extra.items()}
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "logger": self.name,
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "message": message,
            **serializable_extra,
        }

    def _emit(self, level: str, message: str, **kwargs):
        payload = self._format(level, message, **kwargs)
        msg = json.dumps(payload, ensure_ascii=True)

        try:
            from core.log_store import LogEntry, SessionLogStore

            entry = LogEntry(
                ts=payload["ts"],
                level=payload["level"],
                session_id=payload.get("session_id"),
                agent_id=payload.get("agent_id"),
                logger=payload["logger"],
                message=payload["message"],
                extra={k: v for k, v in payload.items() if k not in {"ts", "level", "session_id", "agent_id", "logger", "message"}},
            )
            SessionLogStore.get_instance().append_nowait(entry)
        except Exception:
            # Store failures should not block logging.
            pass

        numeric = getattr(logging, level.upper(), logging.INFO)
        logging.getLogger().log(numeric, msg)
        self._logger.log(numeric, msg)

    def info(self, message: str, **kwargs):
        self._emit("info", message, **kwargs)

    def warn(self, message: str, **kwargs):
        self._emit("warn", message, **kwargs)

    def error(self, message: str, **kwargs):
        self._emit("error", message, **kwargs)

    def debug(self, message: str, **kwargs):
        self._emit("debug", message, **kwargs)

    def log_api_call(self, provider: str, model: str, tokens_in: int, tokens_out: int, latency_ms: float):
        self.info(
            "api_call",
            provider=provider,
            model=model,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            latency_ms=latency_ms,
        )

    def log_request(self, method: str, path: str, status: int, duration_ms: float):
        self.info(
            "http_request",
            method=method,
            path=path,
            status=status,
            duration_ms=duration_ms,
        )


def get_logger(name: str, session_id: str = None, agent_id: str = None) -> StructuredLogger:
    return StructuredLogger(name=name, session_id=session_id, agent_id=agent_id)
