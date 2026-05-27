'use client'

import * as React from 'react'
import { wsClient } from '@/lib/ws-client'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogEntry = {
  id: string
  ts: string
  level: LogLevel
  session_id?: string | null
  agent_id?: string | null
  logger?: string
  message: string
  extra?: Record<string, unknown>
}

export type UseSessionLogsOptions = {
  sessionId: string | null
  levelFilter: LogLevel | 'all'
  agentFilter: string | 'all'
  searchQuery: string
}

const MAX_HISTORY = 500
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function normalizeLevel(level: unknown): LogLevel {
  const value = String(level ?? 'info').toLowerCase()
  if (value === 'debug' || value === 'warn' || value === 'error') return value
  return 'info'
}

function toLogEntry(item: unknown): LogEntry | null {
  if (!item || typeof item !== 'object') return null
  const record = item as Record<string, unknown>
  const message = String(record.message ?? '')
  if (!message) return null
  return {
    id: String(record.id ?? `${record.ts ?? Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    ts: String(record.ts ?? new Date().toISOString()),
    level: normalizeLevel(record.level),
    session_id: (record.session_id as string | null | undefined) ?? null,
    agent_id: (record.agent_id as string | null | undefined) ?? null,
    logger: (record.logger as string | undefined) ?? undefined,
    message,
    extra: (record.extra as Record<string, unknown> | undefined) ?? undefined,
  }
}

export function useSessionLogs({ sessionId, levelFilter, agentFilter, searchQuery }: UseSessionLogsOptions) {
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    let active = true

    const loadHistory = async () => {
      if (!sessionId) {
        setLogs([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/logs/${sessionId}?limit=${MAX_HISTORY}`)
        if (!response.ok) throw new Error(`Failed to fetch logs for session ${sessionId}`)
        const data = (await response.json()) as unknown[]
        if (active) {
          setLogs(data.map(toLogEntry).filter(Boolean) as LogEntry[])
        }
      } catch {
        if (active) setLogs([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadHistory()

    const appendEventLog = (message: string, agentId?: string | null, level: LogLevel = 'info') => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: new Date().toISOString(),
        level,
        agent_id: agentId ?? null,
        message,
      }
      setLogs((current) => [...current, entry].slice(-MAX_HISTORY))
    }

    const onSystemLog = (payload: unknown) => {
      const entry = toLogEntry(payload)
      if (!entry) return
      setLogs((current) => {
        if (current.some((item) => item.id === entry.id)) return current
        return [...current, entry].slice(-MAX_HISTORY)
      })
    }

    const onAgentThinking = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return
      const event = payload as Record<string, unknown>
      const agentId = typeof event.agent_id === 'string' ? event.agent_id : undefined
      const content = typeof event.content === 'string' ? event.content : ''
      if (!content) return
      appendEventLog(`AI writing: ${content}`, agentId, 'debug')
    }

    const onAgentStarted = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return
      const event = payload as Record<string, unknown>
      const agentId = typeof event.agent_id === 'string' ? event.agent_id : undefined
      const model = typeof event.model === 'string' ? event.model : 'unknown'
      const provider = typeof event.provider === 'string' ? event.provider : 'unknown'
      appendEventLog(`Agent started with model ${model} on provider ${provider}`, agentId)
    }

    const onAgentStatus = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return
      const event = payload as Record<string, unknown>
      const agentId = typeof event.agent_id === 'string' ? event.agent_id : undefined
      const status = typeof event.status === 'string' ? event.status : 'unknown'
      appendEventLog(`Agent status update: ${status}`, agentId)
    }

    const onAgentComplete = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return
      const event = payload as Record<string, unknown>
      const agentId = typeof event.agent_id === 'string' ? event.agent_id : undefined
      const duration = typeof event.duration_ms === 'number' ? event.duration_ms : undefined
      appendEventLog(
        `AI complete${duration ? ` in ${duration}ms` : ''}`,
        agentId,
      )
    }

    const onAgentFailed = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return
      const event = payload as Record<string, unknown>
      const agentId = typeof event.agent_id === 'string' ? event.agent_id : undefined
      const error = typeof event.error === 'string' ? event.error : 'Unknown error'
      appendEventLog(`AI failed: ${error}`, agentId, 'error')
    }

    const socket = wsClient as unknown as {
      on?: (event: string, handler: (payload: unknown) => void) => void
      off?: (event: string, handler: (payload: unknown) => void) => void
    }

    socket.on?.('system:log', onSystemLog)
    socket.on?.('agent:thinking', onAgentThinking)
    socket.on?.('agent:started', onAgentStarted)
    socket.on?.('agent:status', onAgentStatus)
    socket.on?.('agent:complete', onAgentComplete)
    socket.on?.('agent:failed', onAgentFailed)

    return () => {
      active = false
      socket.off?.('system:log', onSystemLog)
      socket.off?.('agent:thinking', onAgentThinking)
      socket.off?.('agent:started', onAgentStarted)
      socket.off?.('agent:status', onAgentStatus)
      socket.off?.('agent:complete', onAgentComplete)
      socket.off?.('agent:failed', onAgentFailed)
    }
  }, [sessionId])

  const filtered = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return logs
      .filter((entry) => levelFilter === 'all' || entry.level === levelFilter)
      .filter((entry) => agentFilter === 'all' || entry.agent_id === agentFilter)
      .filter((entry) => !query || entry.message.toLowerCase().includes(query) || entry.logger?.toLowerCase().includes(query))
  }, [logs, levelFilter, agentFilter, searchQuery])

  return { logs: filtered, total: logs.length, isLoading }
}
