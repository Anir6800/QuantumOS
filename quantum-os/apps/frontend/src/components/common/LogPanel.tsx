'use client'

import React, { useRef, useEffect } from 'react'

export type LogEntry = {
  id: string
  ts: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
}

export type LogPanelProps = {
  logs: LogEntry[]
  maxHeight?: string
  className?: string
}

const levelColors = {
  info: 'text-gray-600 dark:text-gray-400',
  warn: 'text-amber-600 dark:text-amber-500',
  error: 'text-red-600 dark:text-red-500',
  debug: 'text-gray-400 dark:text-gray-600'
}

const LogRow = React.memo(function LogRow({ log }: { log: LogEntry }) {
  return (
    <div className={`mb-1 ${levelColors[log.level]}`}>
      <span className="opacity-50 mr-2">[{new Date(log.ts).toLocaleTimeString()}]</span>
      <span className="uppercase opacity-70 mr-2 w-12 inline-block">[{log.level}]</span>
      <span>{log.message}</span>
    </div>
  )
})

export function LogPanel({ logs, maxHeight = '400px', className = '' }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Virtualize: only render last 200 entries to prevent DOM bloat
  const displayLogs = logs.slice(-200)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayLogs.length])

  return (
    <div 
      className={`rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 font-mono text-sm overflow-hidden flex flex-col ${className}`}
      aria-label="Application Logs"
    >
      <div 
        ref={scrollRef} 
        className="overflow-y-auto p-4 flex-1"
        style={{ maxHeight }}
      >
        {displayLogs.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-600 italic">Waiting for logs...</div>
        ) : (
          displayLogs.map(log => (
            <LogRow key={log.id} log={log} />
          ))
        )}
      </div>
    </div>
  )
}
