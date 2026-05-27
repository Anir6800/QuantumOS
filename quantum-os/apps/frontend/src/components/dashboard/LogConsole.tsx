'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import type { LogEntry, LogLevel } from '@/hooks/useSessionLogs'

type LogConsoleProps = {
  logs: LogEntry[]
  searchQuery: string
  isPaused: boolean
  onResume: () => void
}

const LEVEL_STYLES: Record<LogLevel, { text: string; border: string }> = {
  debug: { text: 'text-gray-500', border: 'border-l-gray-600' },
  info: { text: 'text-blue-400', border: 'border-l-blue-500' },
  warn: { text: 'text-amber-400', border: 'border-l-amber-500' },
  error: { text: 'text-red-400', border: 'border-l-red-500' },
}

const LINE_HEIGHT = 20

function formatTime(ts: string) {
  const date = new Date(ts)
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

function highlightMessage(message: string, query: string) {
  const trimmed = query.trim()
  if (!trimmed) return message
  const lower = message.toLowerCase()
  const q = trimmed.toLowerCase()
  const index = lower.indexOf(q)
  if (index === -1) return message
  return (
    <>
      {message.slice(0, index)}
      <mark className="rounded bg-amber-400/25 px-0.5 text-amber-100">{message.slice(index, index + q.length)}</mark>
      {message.slice(index + q.length)}
    </>
  )
}

export function LogConsole({ logs, searchQuery, isPaused, onResume }: LogConsoleProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = React.useState(0)
  const [clientHeight, setClientHeight] = React.useState(0)
  const [pausedByUser, setPausedByUser] = React.useState(false)

  const paused = isPaused || pausedByUser
  const totalCount = logs.length
  const overscan = 12
  const visibleCount = Math.ceil(clientHeight / LINE_HEIGHT) + overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - overscan / 2)
  const endIndex = Math.min(totalCount, startIndex + visibleCount)
  const visibleLogs = logs.slice(startIndex, endIndex)
  const topSpacer = startIndex * LINE_HEIGHT
  const bottomSpacer = Math.max(0, (totalCount - endIndex) * LINE_HEIGHT)

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      setClientHeight(el.clientHeight)
      setScrollTop(el.scrollTop)
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(el)

    return () => resizeObserver.disconnect()
  }, [])

  React.useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [logs, paused])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32
    setPausedByUser(!nearBottom)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-950">
      {paused && (
        <div className="absolute right-4 top-4 z-20">
          <button
            onClick={() => {
              setPausedByUser(false)
              onResume()
              bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
            }}
            className="rounded-full border border-white/10 bg-black/70 px-3 py-2 text-xs font-medium text-foreground shadow-lg shadow-black/30 transition-colors hover:bg-black/80"
          >
            ▼ Jump to latest
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-[1.6] text-slate-200 custom-scrollbar"
      >
        {totalCount === 0 ? (
          <div className="text-slate-500">No logs available.</div>
        ) : (
          <div>
            <div style={{ height: topSpacer }} />
            {visibleLogs.map((entry) => {
              const levelStyle = LEVEL_STYLES[entry.level]
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex h-[20px] items-center gap-2 overflow-hidden border-l-2 ${levelStyle.border} pl-2`}
                >
                  <span className="shrink-0 text-slate-500">[{formatTime(entry.ts)}]</span>
                  <span className={`shrink-0 uppercase ${levelStyle.text}`}>[{entry.level}]</span>
                  {entry.agent_id ? <span className="shrink-0 text-slate-400">[{entry.agent_id}]</span> : <span className="shrink-0 text-slate-600">[system]</span>}
                  <span className="min-w-0 truncate text-slate-200">{highlightMessage(entry.message, searchQuery)}</span>
                </motion.div>
              )
            })}
            <div style={{ height: bottomSpacer }} />
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}
