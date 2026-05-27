'use client'

import * as React from 'react'
import { Search, Download, PauseCircle, PlayCircle } from 'lucide-react'
import type { LogLevel } from '@/hooks/useSessionLogs'

type AgentOption = { id: string; label?: string }

type LogFilterBarProps = {
  sessionId: string | null
  sessionOptions: string[]
  levelFilter: LogLevel | 'all'
  setLevelFilter: (level: LogLevel | 'all') => void
  agentFilter: string | 'all'
  setAgentFilter: (agent: string | 'all') => void
  searchValue: string
  setSearchValue: (value: string) => void
  levelCounts: Record<'all' | LogLevel, number>
  total: number
  agents: AgentOption[]
  isPaused: boolean
  onTogglePause: () => void
  onExportJson: () => void
}

const LEVELS: Array<{ key: 'all' | LogLevel; label: string; badge: string; active: string }> = [
  { key: 'all', label: 'ALL', badge: 'bg-slate-700 text-slate-100', active: 'bg-slate-700/70' },
  { key: 'debug', label: 'DEBUG', badge: 'bg-gray-700 text-gray-200', active: 'bg-gray-700/70' },
  { key: 'info', label: 'INFO', badge: 'bg-blue-500/20 text-blue-300', active: 'bg-blue-500/20' },
  { key: 'warn', label: 'WARN', badge: 'bg-amber-500/20 text-amber-300', active: 'bg-amber-500/20' },
  { key: 'error', label: 'ERROR', badge: 'bg-red-500/20 text-red-300', active: 'bg-red-500/20' },
]

export function LogFilterBar({
  levelFilter,
  sessionId,
  sessionOptions,
  setLevelFilter,
  agentFilter,
  setAgentFilter,
  searchValue,
  setSearchValue,
  levelCounts,
  total,
  agents,
  isPaused,
  onTogglePause,
  onExportJson,
}: LogFilterBarProps) {
  const [localSearch, setLocalSearch] = React.useState(searchValue)

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setSearchValue(localSearch), 200)
    return () => window.clearTimeout(timeout)
  }, [localSearch, setSearchValue])

  React.useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sessionId ?? ''}
          disabled
          className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-slate-200 outline-none"
        >
          <option value="">No active session</option>
          {sessionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {LEVELS.map((level) => {
          const active = levelFilter === level.key
          const count = levelCounts[level.key]
          return (
            <button
              key={level.key}
              onClick={() => setLevelFilter(level.key)}
              className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                active ? level.active : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>{level.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${level.badge}`}>{count}</span>
            </button>
          )
        })}

        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-slate-200 outline-none"
        >
          <option value="all">All Agents</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.label ?? agent.id}
            </option>
          ))}
        </select>

        <label className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-56 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs text-slate-400">
          {total.toLocaleString()} entries
        </div>
        <button
          onClick={onExportJson}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </button>
        <button
          onClick={onTogglePause}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
        >
          {isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  )
}
