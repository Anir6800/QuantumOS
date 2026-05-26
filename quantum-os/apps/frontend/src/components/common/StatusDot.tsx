'use client'

import React from 'react'

export type StatusDotProps = {
  status: 'idle' | 'running' | 'complete' | 'failed' | 'winner'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const colorMap = {
  idle: 'bg-gray-500',
  running: 'bg-cyan-500',
  complete: 'bg-green-500',
  failed: 'bg-red-500',
  winner: 'bg-amber-500'
}

const sizeMap = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
}

const textMap = {
  idle: 'text-gray-500',
  running: 'text-cyan-500',
  complete: 'text-green-500',
  failed: 'text-red-500',
  winner: 'text-amber-500'
}

export function StatusDot({ status, size = 'md', showLabel = false }: StatusDotProps) {
  return (
    <div className="flex items-center gap-2" aria-label={`Status: ${status}`}>
      <style>{`
        @keyframes custom-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
        }
        .animate-custom-pulse {
          animation: custom-pulse 2s infinite;
        }
      `}</style>
      <div className="relative flex items-center justify-center">
        <span className={`rounded-full ${colorMap[status]} ${sizeMap[size]} ${status === 'running' ? 'animate-custom-pulse' : ''}`} />
      </div>
      {showLabel && <span className={`text-sm font-medium capitalize ${textMap[status]}`}>{status}</span>}
    </div>
  )
}
