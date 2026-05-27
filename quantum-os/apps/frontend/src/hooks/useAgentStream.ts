'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAgentStore, type AgentState } from '@/store/agent-store'
import { useSessionStore } from '@/store/session-store'
import { api } from '@/lib/api-client'
import { wsClient } from '@/lib/ws-client'

type StreamSessionStatus = 'idle' | 'connected' | 'running' | 'completed' | 'error'

type AgentStartedPayload = {
  agent_id: string
  name: string
  model: string
  provider?: string
}

type AgentThinkingPayload = {
  agent_id: string
  content: string
}

type AgentStatusPayload = {
  agent_id: string
  name: string
  status: string
  model: string
  provider?: string
}

type AgentCompletePayload = {
  agent_id: string
  output: string
  duration_ms: number
}

type AgentFailedPayload = {
  agent_id: string
  error: string
}

type BenchmarkWinnerPayload = {
  agent_id: string
  score?: number
  summary?: string
}

type SessionResultsPayload = {
  session_id: string
  results: unknown[]
}

const EVENT_NAMES = {
  started: 'agent:started',
  status: 'agent:status',
  thinking: 'agent:thinking',
  complete: 'agent:complete',
  failed: 'agent:failed',
  winner: 'benchmark:winner',
  results: 'session:results',
} as const

type WSLikeClient = {
  on?: (event: string, handler: (payload: unknown) => void) => void
  off?: (event: string, handler: (payload: unknown) => void) => void
}

function buildWsUrl(sessionId: string) {
  const base = process.env.NEXT_PUBLIC_API_WS_BASE_URL || 'ws://localhost:8000'
  if (typeof window === 'undefined') return `${base}/api/v1/ws/${sessionId}`
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = process.env.NEXT_PUBLIC_WS_HOST || 'localhost:8000'
  const normalizedHost = host.replace(/^https?:\/\//, '')
  return `${protocol}//${normalizedHost}/api/v1/ws/${sessionId}`
}

export function useAgentStream() {
  const { agents, addAgent, updateAgent, appendAgentLog, incrementTokenCount, clearAgents, setSession } = useAgentStore()
  const { sessionId, status: sessionStoreStatus } = useSessionStore()
  const [isConnected, setIsConnected] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<StreamSessionStatus>('idle')

  const activeSessionId = sessionId

  useEffect(() => {
    if (!activeSessionId) return

    setSession(activeSessionId)
    clearAgents()
    setSessionStatus('connected')

    const url = buildWsUrl(activeSessionId)
    wsClient.connect(url)

    const onStarted = (payload: AgentStartedPayload) => {
      const existing = useAgentStore.getState().agents.find(agent => agent.id === payload.agent_id)
      const base: AgentState = {
        id: payload.agent_id,
        name: payload.name,
        status: 'running',
        model: payload.model,
        provider: payload.provider,
        output: null,
        startTime: new Date(),
        endTime: null,
        logs: [],
        tokenCount: 0,
      }
      if (existing) {
        updateAgent(payload.agent_id, {
          ...base,
          startTime: existing.startTime ?? base.startTime,
        })
      } else {
        addAgent(base)
      }
      setSessionStatus('running')
      setIsConnected(true)
    }

    const onThinking = ({ agent_id, content }: AgentThinkingPayload) => {
      const existing = useAgentStore.getState().agents.find((agent) => agent.id === agent_id)
      if (!existing) {
        addAgent({
          id: agent_id,
          name: agent_id,
          status: 'running',
          model: 'unknown',
          provider: 'unknown',
          output: null,
          startTime: new Date(),
          endTime: null,
          logs: [],
          tokenCount: 0,
        })
      }
      const message = `AI writing: ${content}`
      appendAgentLog(agent_id, message)
      incrementTokenCount(agent_id, Math.max(1, content.trim().split(/\s+/).filter(Boolean).length))
    }

    const onStatusUpdate = ({ agent_id, name, status, model, provider }: AgentStatusPayload) => {
      const existing = useAgentStore.getState().agents.find((agent) => agent.id === agent_id)
      const parsedStatus = status.toLowerCase() as AgentState['status']
      if (existing) {
        updateAgent(agent_id, {
          status: parsedStatus,
          name,
          model,
          provider,
          startTime: existing.startTime ?? new Date(),
        })
      } else {
        addAgent({
          id: agent_id,
          name,
          status: parsedStatus,
          model,
          provider,
          output: null,
          startTime: new Date(),
          endTime: null,
          logs: [],
          tokenCount: 0,
        })
      }
    }

    const onComplete = ({ agent_id, output }: AgentCompletePayload) => {
      const existing = useAgentStore.getState().agents.find((agent) => agent.id === agent_id)
      if (existing) {
        updateAgent(agent_id, {
          status: 'complete',
          output,
          endTime: new Date(),
        })
      } else {
        addAgent({
          id: agent_id,
          name: agent_id,
          status: 'complete',
          model: 'unknown',
          provider: 'unknown',
          output,
          startTime: null,
          endTime: new Date(),
          logs: [],
          tokenCount: 0,
        })
      }
      appendAgentLog(agent_id, output)
    }

    const onFailed = ({ agent_id, error }: AgentFailedPayload) => {
      const existing = useAgentStore.getState().agents.find((agent) => agent.id === agent_id)
      if (existing) {
        updateAgent(agent_id, {
          status: 'failed',
          output: error,
          endTime: new Date(),
        })
      } else {
        addAgent({
          id: agent_id,
          name: agent_id,
          status: 'failed',
          model: 'unknown',
          provider: 'unknown',
          output: error,
          startTime: null,
          endTime: new Date(),
          logs: [],
          tokenCount: 0,
        })
      }
      appendAgentLog(agent_id, error)
      setSessionStatus('error')
    }

    const onWinner = ({ agent_id, summary }: BenchmarkWinnerPayload) => {
      updateAgent(agent_id, {
        status: 'winner',
      })
      if (summary) {
        appendAgentLog(agent_id, summary)
      }
    }

  const onSessionResults = ({ results }: SessionResultsPayload) => {
      useSessionStore.getState().setResults(results as never[])
      for (const result of results as Array<Record<string, unknown>>) {
        const agentId = typeof result.agent_id === 'string' ? result.agent_id : null
        if (!agentId) continue

        const output = typeof result.output === 'string' ? result.output : ''
        const agentName = typeof result.agent_name === 'string' ? result.agent_name : agentId
        const model = typeof result.model === 'string' ? result.model : 'unknown'
        const isWinner = typeof result.total_score === 'number' ? result.total_score >= 90 : false

        const existing = useAgentStore.getState().agents.find((agent) => agent.id === agentId)
        if (existing) {
          updateAgent(agentId, {
            name: agentName,
            model,
            output: output || existing.output,
            status: isWinner ? 'winner' : existing.status === 'running' ? 'complete' : existing.status,
            endTime: existing.endTime ?? new Date(),
          })
        } else {
          addAgent({
            id: agentId,
            name: agentName,
            status: isWinner ? 'winner' : 'complete',
            model,
            provider: 'groq',
            output,
            startTime: null,
            endTime: new Date(),
            logs: [],
            tokenCount: 0,
          })
        }
      }
    }

    const socket = wsClient as unknown as WSLikeClient
    const startedHandler = (payload: unknown) => onStarted(payload as AgentStartedPayload)
    const thinkingHandler = (payload: unknown) => onThinking(payload as AgentThinkingPayload)
    const statusHandler = (payload: unknown) => onStatusUpdate(payload as AgentStatusPayload)
    const completeHandler = (payload: unknown) => onComplete(payload as AgentCompletePayload)
    const failedHandler = (payload: unknown) => onFailed(payload as AgentFailedPayload)
    const winnerHandler = (payload: unknown) => onWinner(payload as BenchmarkWinnerPayload)

    socket.on?.(EVENT_NAMES.started, startedHandler)
    socket.on?.(EVENT_NAMES.status, statusHandler)
    socket.on?.(EVENT_NAMES.thinking, thinkingHandler)
    socket.on?.(EVENT_NAMES.complete, completeHandler)
    socket.on?.(EVENT_NAMES.failed, failedHandler)
    socket.on?.(EVENT_NAMES.winner, winnerHandler)
    const resultsHandler = (payload: unknown) => onSessionResults(payload as SessionResultsPayload)
    socket.on?.(EVENT_NAMES.results, resultsHandler)

    const hydrateFromHistory = async () => {
      try {
        const logs = await api.get<Array<{ agent_id?: string | null; message: string; ts: string }>>(
          `/api/v1/logs/${activeSessionId}?limit=500`
        )
        const grouped = new Map<string, string[]>()
        for (const entry of logs) {
          if (!entry.agent_id) continue
          const messages = grouped.get(entry.agent_id) ?? []
          messages.push(entry.message)
          grouped.set(entry.agent_id, messages)
        }

        for (const [agentId, messages] of grouped.entries()) {
          const existing = useAgentStore.getState().agents.find((agent) => agent.id === agentId)
          const combined = messages.join('\n')
          if (existing) {
            updateAgent(agentId, {
              output: existing.output ?? combined,
              logs: existing.logs ?? messages.map((message) => ({ ts: Date.now(), message })),
            })
          } else {
            addAgent({
              id: agentId,
              name: agentId,
              status: 'running',
              model: 'unknown',
              provider: 'groq',
              output: combined,
              startTime: null,
              endTime: null,
              logs: messages.map((message) => ({ ts: Date.now(), message })),
              tokenCount: 0,
            })
          }
        }
      } catch {
        // Best-effort hydration only.
      }
    }

    void hydrateFromHistory()

    const poll = setInterval(() => {
      setIsConnected(wsClient.readyState === 1)
      if (wsClient.readyState === 1 && sessionStoreStatus === 'active') {
        setSessionStatus('running')
      } else if (wsClient.readyState !== 1 && sessionStatus === 'running') {
        setSessionStatus('connected')
      }
    }, 1000)

    return () => {
      clearInterval(poll)
      socket.off?.(EVENT_NAMES.started, startedHandler)
      socket.off?.(EVENT_NAMES.thinking, thinkingHandler)
      socket.off?.(EVENT_NAMES.complete, completeHandler)
      socket.off?.(EVENT_NAMES.failed, failedHandler)
      socket.off?.(EVENT_NAMES.winner, winnerHandler)
      socket.off?.(EVENT_NAMES.results, resultsHandler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId])

  useEffect(() => {
    if (sessionStoreStatus === 'completed') {
      setSessionStatus('completed')
    }
  }, [sessionStoreStatus])

  return useMemo(() => ({
    agents,
    agentIds: agents.map(a => a.id),
    isConnected,
    sessionStatus,
  }), [agents, isConnected, sessionStatus])
}
