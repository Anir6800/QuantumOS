'use client'

import * as React from 'react'
import { LogConsole } from '@/components/dashboard/LogConsole'
import { LogFilterBar } from '@/components/dashboard/LogFilterBar'
import { useAgentStore } from '@/store/agent-store'
import { useSessionStore } from '@/store/session-store'
import { type LogLevel, type LogEntry, useSessionLogs } from '@/hooks/useSessionLogs'

export function exportLogs(logs: LogEntry[], format: 'txt' | 'json', sessionId: string | null) {
  const date = new Date().toISOString().slice(0, 10)
  const safeSession = sessionId ?? 'no-session'
  const filename = `quantum-os-logs-${safeSession}-${date}.${format}`
  const content =
    format === 'json'
      ? JSON.stringify(logs, null, 2)
      : logs
          .map((log) => `[${log.ts}] [${log.level.toUpperCase()}] [${log.agent_id ?? 'system'}] ${log.message}`)
          .join('\n') + '\n'
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function LogsClient() {
  const sessionId = useSessionStore((state) => state.sessionId)
  const agents = useAgentStore((state) => state.agents)
  const [levelFilter, setLevelFilter] = React.useState<LogLevel | 'all'>('all')
  const [agentFilter, setAgentFilter] = React.useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isPaused, setIsPaused] = React.useState(false)

  const { logs, total } = useSessionLogs({ sessionId, levelFilter, agentFilter, searchQuery })

  const levelCounts = React.useMemo(() => {
    return logs.reduce(
      (acc, entry) => {
        acc.all += 1
        acc[entry.level] += 1
        return acc
      },
      { all: 0, debug: 0, info: 0, warn: 0, error: 0 } as Record<'all' | LogLevel, number>
    )
  }, [logs])

  const agentOptions = React.useMemo(() => {
    const unique = new Map<string, string | undefined>()
    agents.forEach((agent) => unique.set(agent.id, agent.name))
    logs.forEach((log) => {
      if (log.agent_id) unique.set(log.agent_id, unique.get(log.agent_id))
    })
    return Array.from(unique.entries()).map(([id, label]) => ({ id, label }))
  }, [agents, logs])

  const handleExportJson = React.useCallback(() => {
    exportLogs(logs, 'json', sessionId)
  }, [logs, sessionId])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <LogFilterBar
        sessionId={sessionId}
        sessionOptions={sessionId ? [sessionId] : []}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        agentFilter={agentFilter}
        setAgentFilter={setAgentFilter}
        searchValue={searchQuery}
        setSearchValue={setSearchQuery}
        levelCounts={levelCounts}
        total={total}
        agents={agentOptions}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onExportJson={handleExportJson}
      />

      <LogConsole
        logs={logs}
        searchQuery={searchQuery}
        isPaused={isPaused}
        onResume={() => setIsPaused(false)}
      />
    </div>
  )
}
