- **Latency-based provider routing & fallback**: `ProviderRegistry` now tracks per-provider runtime metrics (EWMA latency, failure counts) and exposes `run_completion_for_role(role, messages, preferred_models, **kwargs)` which selects the best provider/model for a role and records latency. On provider failure it will attempt lower-latency fallback providers. Expected improvement: lower average latency by selecting low-latency providers for roles and resilient fallback behavior on errors.

Usage notes:
- Use `provider_registry.route_for_role(role, preferred_models)` to resolve a `(model, provider)` pair for planning/coding/evaluation/UI roles.
- Use `await provider_registry.run_completion_for_role(role, messages, preferred_models=[...], temperature=0.2)` to run a completion with automatic routing and latency/failure recording.

- **Provider metrics endpoint**: Added `/api/v1/providers/metrics` to surface EWMA latency and failure counts for operators and debugging. File: `apps/backend/routers/providers.py`.

- **Provider metrics persistence & admin controls**: Provider EWMA metrics are now persisted to `apps/backend/services/provider_metrics.json` and updated asynchronously. Admin endpoints added: `POST /api/v1/providers/metrics/reset` and `POST /api/v1/providers/metrics/promote?provider_name=<name>` to reset or promote providers. Expected improvement: stable routing across restarts and quick operator controls to promote healthy providers.

- **Agent routing integration**: `PlannerAgent`, `SpeedAgent`, `ScalabilityAgent`, and `SecurityAgent` now resolve providers/models at runtime using `provider_registry.route_for_role(...)` or `run_completion_for_role(...)`. This makes agent streaming and completions benefit from routing hints, caching, and latency-based fallbacks. File changes: `apps/backend/agents/*.py`.

- **Frontend redesign (minimal)**: Scaffolding added for a clean, minimal UI:
	- New `TopBar` and `Sidebar` components: `apps/frontend/src/components/ui/TopBar.tsx`, `.../Sidebar.tsx`.
	- Root layout previously rendered dashboard chrome globally, causing an unwanted overlay on non-dashboard pages; this was fixed by restoring a clean root layout in `apps/frontend/src/app/layout.tsx`.
	- `AgentCard` and log rendering optimized to reduce re-renders and DOM bloat.
	- CI workflow added: `.github/workflows/frontend-ci.yml` to build and lint the frontend on PRs/commits.

Expected UX improvements: clearer navigation, reduced UI jitter during streaming, faster perceived load due to fewer re-renders. Next: apply full visual polish (spacing, typography, color tokens) and virtualize large lists.
- **Benchmark and test parallelization**: `SessionService._run_benchmark` now runs `CodeTestRunner.analyze` calls via `asyncio.to_thread` and gathers results concurrently to avoid blocking the event loop during heavy analysis. Expected improvement: faster benchmark completion and lower end-to-end session latency under multiple agents.

- **Frontend memoization**: `AgentCard` component has been wrapped with `React.memo` to reduce unnecessary re-renders when store updates unrelated to a specific agent occur. Expected improvement: smoother UI and lower CPU usage when many agents stream logs.

- **Provider caching & request coalescing**: Added an async LRU cache and inflight request coalescing in `apps/backend/services/providers/base.py` and wrapped `complete()` calls in `GroqProvider` and `OpenRouterProvider` with `cached_call(...)`. This prevents duplicate identical completions from being sent to providers and coalesces simultaneous identical requests. Expected improvement: lower API call volume, reduced token usage, faster responses for repeated prompts.

- **Streaming-first agent updates**: `SpeedAgent._stream_codegen` now broadcasts partial chunks via `agent:thinking` during provider streaming, and records progress into memory on the fly. This enables the frontend to render incremental outputs and improves perceived latency. Expected improvement: immediate partial outputs visible in the dashboard, smoother streaming UX.

- **Latency-based provider routing & fallback**: `ProviderRegistry` now tracks per-provider runtime metrics (EWMA latency, failure counts) and exposes `run_completion_for_role(role, messages, preferred_models, **kwargs)` which selects the best provider/model for a role and records latency. On provider failure it will attempt lower-latency fallback providers. Expected improvement: lower average latency by selecting low-latency providers for roles and resilient fallback behavior on errors.

Usage notes:
- Use `provider_registry.route_for_role(role, preferred_models)` to resolve a `(model, provider)` pair for planning/coding/evaluation/UI roles.
- Use `await provider_registry.run_completion_for_role(role, messages, preferred_models=[...], temperature=0.2)` to run a completion with automatic routing and latency/failure recording.
# Project Memory

## Completed Tasks
[2026-05-26] Phase 1 / Step 1.1 — Monorepo scaffolded with pnpm workspaces
[2026-05-26] Phase 1 / Step 1.2 — Initialized Next.js 15 frontend
[2026-05-26] Phase 1 / Step 1.3 — Initialized FastAPI backend
[2026-05-26] Resolved Git push conflict by merging unrelated histories
[2026-05-26] Copied .env.example files to .env in root and backend

## Files Modified
[2026-05-26] CREATED memory.md — canonical template initialized
[2026-05-26] CREATED pnpm-workspace.yaml — workspace configuration
[2026-05-26] CREATED packages/shared/src/types/agent.ts — agent type definitions
[2026-05-26] CREATED apps/backend/requirements.txt — Python dependencies
[2026-05-26] CREATED apps/frontend/src/lib/ws-client.ts
[2026-05-26] CREATED apps/frontend/src/lib/api-client.ts
[2026-05-26] CREATED apps/frontend/src/store/agent-store.ts
[2026-05-26] CREATED apps/frontend/src/store/session-store.ts
[2026-05-26] CREATED .env — Copied from root .env.example
[2026-05-26] CREATED apps/backend/.env — Copied from backend .env.example
[2026-05-26] CREATED src/app/page.tsx — landing page root
[2026-05-26] CREATED src/components/landing/Navbar.tsx
[2026-05-26] CREATED src/components/landing/HeroSection.tsx
[2026-05-26] CREATED src/components/landing/FeaturesSection.tsx
[2026-05-26] CREATED src/components/landing/CTASection.tsx
[2026-05-26] MODIFIED src/app/layout.tsx — added dark theme and custom styling
[2026-05-26] CREATED src/app/dashboard/layout.tsx — dashboard shell layout
[2026-05-26] CREATED src/components/dashboard/Sidebar.tsx — collapsible sidebar
[2026-05-26] CREATED src/components/dashboard/TopBar.tsx — top bar with connection status
[2026-05-26] CREATED src/app/dashboard/page.tsx — dashboard overview page
[2026-05-26] MODIFIED src/lib/ws-client.ts — added readyState getter
[2026-05-26] MODIFIED next.config.ts — disabled Next.js dev indicators
[2026-05-26] CREATED apps/backend/core/exceptions.py — global exception handling
[2026-05-26] CREATED apps/backend/core/middleware.py — request logging middleware
[2026-05-26] CREATED apps/backend/schemas.py — pydantic schemas
[2026-05-26] CREATED apps/backend/services/session_service.py — session state management
[2026-05-26] CREATED apps/backend/routers/sessions.py — sessions router
[2026-05-26] CREATED apps/backend/routers/agents.py — agents router
[2026-05-26] CREATED apps/backend/core/ws_events.py — WS event definitions
[2026-05-26] CREATED apps/backend/core/connection_manager.py — WS connection manager
[2026-05-26] CREATED apps/backend/services/ws_broadcaster.py — WS broadcaster singleton
[2026-05-26] CREATED apps/backend/routers/ws.py — WS router
[2026-05-26] MODIFIED apps/backend/main.py — integrated ws router
[2026-05-26] MODIFIED apps/backend/routers/ws.py — added ping/pong response handling
[2026-05-26] CREATED apps/backend/ws_verify.py — script to test WS connection and broadcast
[2026-05-26] CREATED apps/backend/core/config.py — environment config
[2026-05-26] CREATED apps/backend/services/providers/base.py — Abstract BaseProvider
[2026-05-26] CREATED apps/backend/services/providers/groq.py — GroqProvider implementation
[2026-05-26] CREATED apps/backend/services/providers/openrouter.py — OpenRouterProvider implementation
[2026-05-26] CREATED apps/backend/services/provider_registry.py — ProviderRegistry singleton
[2026-05-26] MODIFIED .env & apps/backend/.env — added Groq and OpenRouter API keys
[2026-05-26] MODIFIED apps/backend/services/providers/base.py — Fixed ProviderAuthenticationError instantiation
[2026-05-26] MODIFIED apps/backend/services/providers/groq.py — Updated deprecated groq model
[2026-05-26] MODIFIED apps/backend/core/exceptions.py — Mapped ProviderAuthenticationError to 401 HTTP response
[2026-05-26] MODIFIED apps/backend/test_providers.py — Updated test models for Groq and OpenRouter
[2026-05-26] CREATED apps/backend/core/agent_memory.py — Cross-agent memory context and entry store
[2026-05-26] CREATED apps/backend/services/memory_service.py — Per-session memory context lifecycle manager
[2026-05-26] CREATED apps/backend/agents/orchestrator.py — SwarmOrchestrator session pipeline with memory sync
[2026-05-26] MODIFIED apps/backend/agents/base_agent.py — Added memory context hooks and prompt helpers
[2026-05-26] MODIFIED apps/backend/agents/planner_agent.py — Added memory registration and sibling-context prompt injection
[2026-05-26] MODIFIED apps/backend/agents/speed_agent.py — Added memory progress tracking and prompt injection
[2026-05-26] MODIFIED apps/backend/agents/scalability_agent.py — Added memory progress tracking and prompt injection
[2026-05-26] MODIFIED apps/backend/agents/security_agent.py — Added memory progress tracking and prompt injection
[2026-05-26] MODIFIED apps/backend/core/ws_events.py — Added session and memory sync event definitions
[2026-05-26] CREATED apps/backend/verify_swarm_orchestrator.py — Deterministic swarm execution verifier
[2026-05-26] CREATED apps/backend/verify_agent_memory_sync.py — Memory sync and race-condition verifier
[2026-05-26] CREATED apps/backend/evaluation/test_runner.py — Static code evaluation runner for syntax, complexity, security, and completeness checks
[2026-05-26] MODIFIED apps/backend/evaluation/test_runner.py — Escalated single high-risk primitives to high severity
[2026-05-26] CREATED apps/backend/evaluation/scorer.py — AgentScorer benchmark scoring utility
[2026-05-26] CREATED apps/backend/evaluation/winner_selector.py — WinnerSelector ranking and winner selection utility
[2026-05-26] CREATED apps/backend/evaluation/benchmark_runner.py — Benchmark runner that emits benchmark:winner events
[2026-05-26] CREATED apps/backend/verify_benchmark_scoring.py — Deterministic benchmark scoring verifier
[2026-05-26] MODIFIED apps/frontend/src/store/agent-store.ts — Expanded agent state for swarm streaming UI
[2026-05-26] MODIFIED apps/frontend/src/lib/ws-client.ts — Added websocket listener removal support
[2026-05-26] CREATED apps/frontend/src/hooks/useAgentStream.ts — WebSocket-to-Zustand agent stream hook
[2026-05-26] CREATED apps/frontend/src/components/dashboard/AgentCard.tsx — Animated specialist agent card UI
[2026-05-26] CREATED apps/frontend/src/components/dashboard/SwarmGrid.tsx — Responsive swarm grid with empty state
[2026-05-26] MODIFIED apps/frontend/src/hooks/useAgentStream.ts — Added benchmark:winner handling for winner card glow
## Architecture Decisions
[2026-05-26] DECISION: pnpm monorepo — RATIONALE: workspace hoisting, fast installs, unified dependency management
[2026-05-26] DECISION: Shared types package — RATIONALE: single source of truth for agent/task/ws types
[2026-05-26] DECISION: Per-session AgentMemoryContext — RATIONALE: share sibling strategy context without global mutable state
[2026-05-26] DECISION: Periodic memory:sync WS event — RATIONALE: keep clients updated during active sessions without waiting for completion
[2026-05-26] DECISION: Static evaluation runner — RATIONALE: provide a lightweight local quality gate without requiring model execution or external services
[2026-05-26] DECISION: High-risk security primitives — RATIONALE: single eval/exec/os.system/shell=True usage should fail hard without needing multiple findings
[2026-05-26] DECISION: Weighted benchmark ranking — RATIONALE: combine correctness, safety, quality, and runtime into a single deterministic winner selection
[2026-05-26] DECISION: Benchmark winner event — RATIONALE: emit a single authoritative WS event after ranking to keep frontend state synchronized
[2026-05-26] DECISION: Swarm visualizations via Zustand stream hook — RATIONALE: keep live agent cards in sync with websocket events and store state

## Dependencies Installed
zustand@latest — apps/frontend — global state management
framer-motion@latest — apps/frontend — UI animations
socket.io-client@latest — apps/frontend — WebSocket communication
lucide-react@latest — apps/frontend — icons

## Next Steps
[x] 1.2 — Initialize Next.js 15 frontend
[x] 1.3 — Initialize FastAPI backend

## Components Added
StatusDot — src/components/common/StatusDot.tsx — agent/session status indicator
ModelBadge — src/components/common/ModelBadge.tsx — AI model + provider badge
TimerDisplay — src/components/common/TimerDisplay.tsx — live elapsed timer
LogPanel — src/components/common/LogPanel.tsx — virtualized log viewer
ScoreBar — src/components/common/ScoreBar.tsx — animated score visualization
EmptyState — src/components/common/EmptyState.tsx — empty state UI pattern
CopyButton — src/components/common/CopyButton.tsx — clipboard copy with feedback
ConnectionBadge — src/components/common/ConnectionBadge.tsx — WebSocket status

## Performance Optimizations (2026-05-27)

- **WebSocket broadcasting concurrency**: Reworked `apps/backend/core/connection_manager.py` to send websocket messages concurrently using `asyncio.gather` and a `_safe_send_json` helper. This reduces per-connection send latency and prevents slow clients from serializing broadcasts. Expected improvement: lower tail latency for websocket events and improved concurrency under many clients.

- **Heartbeat optimization**: Changed heartbeat messages to use lightweight `send_text` pings to avoid JSON serialization overhead for periodic keep-alives.

- **Memory snapshot shrink**: Added `get_brief_snapshot()` in `apps/backend/core/agent_memory.py` to return compact memory snapshots (no full final outputs) for frequent syncs. Periodic memory syncs in `apps/backend/agents/orchestrator.py` now broadcast the brief snapshot instead of the full snapshot. Expected improvement: significantly smaller websocket payloads and reduced serialization CPU and network usage.

These changes are appended incrementally; more optimizations will be recorded as they're implemented.

- **Memory sync deduplication**: `SwarmOrchestrator` now fingerprints brief snapshots and only broadcasts when content changes. Reduces redundant network traffic and CPU on clients when memory state is stable. Expected improvement: fewer websocket messages during idle periods and lower client render pressure.

- **Benchmark and test parallelization**: `SessionService._run_benchmark` now runs `CodeTestRunner.analyze` calls via `asyncio.to_thread` and gathers results concurrently to avoid blocking the event loop during heavy analysis. Expected improvement: faster benchmark completion and lower end-to-end session latency under multiple agents.
