'use client'

import React from 'react'
import { RefreshCw } from 'lucide-react'

export type ConnectionBadgeProps = {
  status: 'connected' | 'connecting' | 'disconnected'
  onReconnect?: () => void
}

const statusConfig = {
  connected: {
    color: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-900/50',
    label: 'Connected'
  },
  connecting: {
    color: 'bg-amber-500 animate-pulse',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900/50',
    label: 'Connecting...'
  },
  disconnected: {
    color: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
    label: 'Disconnected'
  }
}

export function ConnectionBadge({ status, onReconnect }: ConnectionBadgeProps) {
  const config = statusConfig[status]

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium ${config.bg} ${config.border} ${config.text}`} aria-label={`Connection status: ${status}`}>
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      <span>{config.label}</span>
      
      {status === 'disconnected' && onReconnect && (
        <button 
          onClick={onReconnect}
          className="ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
          aria-label="Reconnect"
        >
          <RefreshCw size={12} />
        </button>
      )}
    </div>
  )
}
