import asyncio
import uuid
from typing import Dict, List
from datetime import datetime, timezone
from schemas import SessionCreate, SessionResponse, SessionStatus, SessionStatusUpdate
from core.exceptions import SessionNotFoundException
from core.logger import get_logger
from agents.orchestrator import SwarmOrchestrator
from evaluation.benchmark_runner import BenchmarkRunner
from evaluation.test_runner import CodeTestRunner
from services.ws_broadcaster import get_broadcaster

logger = get_logger(__name__)


class SessionService:
    def __init__(self):
        self._store: Dict[str, SessionResponse] = {}
        self._lock = asyncio.Lock()

    async def create_session(self, session_data: SessionCreate) -> SessionResponse:
        async with self._lock:
            session_id = str(uuid.uuid4())
            session = SessionResponse(
                id=session_id,
                task_description=session_data.task_description,
                status=SessionStatus.PENDING,
                created_at=datetime.now(timezone.utc)
                ,models=session_data.models,
                num_agents=session_data.num_agents,
                provider=session_data.provider,
            )
            self._store[session_id] = session
            get_logger(__name__, session_id=session_id).info("session_created", status=session.status.value)
            return session

    async def start_session(self, session_id: str) -> SessionResponse:
        session = await self.get_session(session_id)
        if session.status != SessionStatus.PENDING:
            return session
        asyncio.create_task(self._run_session_workflow(session_id))
        return session

    async def get_session(self, session_id: str) -> SessionResponse:
        async with self._lock:
            session = self._store.get(session_id)
            if not session:
                raise SessionNotFoundException(f"Session {session_id} not found", session_id=session_id)
            return session

    async def update_status(self, session_id: str, update_data: SessionStatusUpdate) -> SessionResponse:
        async with self._lock:
            session = self._store.get(session_id)
            if not session:
                raise SessionNotFoundException(f"Session {session_id} not found", session_id=session_id)

            valid_transitions = {
                SessionStatus.PENDING: {SessionStatus.RUNNING, SessionStatus.CANCELLED, SessionStatus.FAILED},
                SessionStatus.RUNNING: {SessionStatus.COMPLETE, SessionStatus.FAILED, SessionStatus.CANCELLED},
                SessionStatus.COMPLETE: set(),
                SessionStatus.FAILED: set(),
                SessionStatus.CANCELLED: set(),
            }

            if update_data.status not in valid_transitions[session.status]:
                raise ValueError(f"Invalid state transition from {session.status} to {update_data.status}")

            old_status = session.status
            updated_session = session.model_copy(update={'status': update_data.status})
            self._store[session_id] = updated_session
            get_logger(__name__, session_id=session_id).info(
                "session_status_changed",
                from_status=old_status.value,
                to_status=update_data.status.value,
            )
            return updated_session

    async def list_sessions(self) -> List[SessionResponse]:
        async with self._lock:
            return list(self._store.values())

    async def _run_session_workflow(self, session_id: str):
        broadcaster = get_broadcaster()
        logger = get_logger(__name__, session_id=session_id)

        try:
            session = await self.get_session(session_id)
            await self.update_status(session_id, SessionStatusUpdate(status=SessionStatus.RUNNING))

            await broadcaster.broadcast_to_session(
                session_id,
                "session:started",
                {"session_id": session_id, "timestamp": datetime.now(timezone.utc).isoformat()},
            )

            orchestrator = SwarmOrchestrator(session_id=session_id, broadcaster=broadcaster)
            swarm_result = await orchestrator.run_session(session, session.task_description)

            benchmark_payload = await self._run_benchmark(session_id, swarm_result.results)
            await self._store_result_for_frontend(session_id, benchmark_payload)

            await self.update_status(session_id, SessionStatusUpdate(status=SessionStatus.COMPLETE))
            logger.info("session_completed", session_id=session_id, agents_launched=swarm_result.agents_launched)
        except Exception as error:
            logger.error("session_workflow_failed", error=str(error))
            try:
                await self.update_status(session_id, SessionStatusUpdate(status=SessionStatus.FAILED))
            except Exception:
                pass

    async def _run_benchmark(self, session_id: str, results):
        test_runner = CodeTestRunner()
        benchmark_runner = BenchmarkRunner(get_broadcaster())
        benchmark_results = []
        reports = []
        durations = []

        for result in results:
            output = ""
            if isinstance(result.data, dict):
                output = str(result.data.get("output") or "")
                duration = int(result.data.get("duration_ms") or 0)
            else:
                duration = 0

            benchmark_results.append(result)
            durations.append(duration)

            language = "python" if "def " in output or "import " in output else "typescript"
            # Defer potentially CPU-bound analysis to a thread to avoid blocking the event loop
            reports.append((output or "pass", language))

        # Run analyses concurrently off the event loop
        if reports:
            analysis_tasks = [asyncio.to_thread(test_runner.analyze, p[0], p[1]) for p in reports]
            reports = await asyncio.gather(*analysis_tasks)

        if benchmark_results:
            benchmark_run = await benchmark_runner.run(session_id, benchmark_results, reports, durations)
            return {
                "session_id": session_id,
                "results": [
                    {
                        "agent_id": score.agent_id,
                        "agent_name": score.agent_id,
                        "model": "unknown",
                        "total_score": score.total_score,
                        "breakdown": {
                            "syntax_score": score.syntax_score,
                            "completeness_score": score.completeness_score,
                            "security_score": score.security_score,
                            "complexity_score": score.complexity_score,
                            "speed_score": score.speed_score,
                        },
                        "output": next(
                            (r.data.get("output") for r in benchmark_results if isinstance(r.data, dict) and r.data.get("agent_id") == score.agent_id),
                            next((r.data.get("output") for r in benchmark_results if isinstance(r.data, dict) and r.data.get("output")), ""),
                        ),
                        "selection_summary": benchmark_run.winner.selection_summary if benchmark_run.winner else "",
                    }
                    for score in benchmark_run.scores
                ],
            }
        return {"session_id": session_id, "results": []}

    async def _store_result_for_frontend(self, session_id: str, payload):
        try:
            broadcaster = get_broadcaster()
            await broadcaster.broadcast_to_session(session_id, "session:results", payload)
        except Exception:
            pass


session_service = SessionService()
