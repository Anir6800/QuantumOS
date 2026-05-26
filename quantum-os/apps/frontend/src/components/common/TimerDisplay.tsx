'use client'

import React, { useState, useEffect } from 'react'

export type TimerDisplayProps = { startTime: Date | null; running: boolean }

export function TimerDisplay({ startTime, running }: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState<number>(0)

  useEffect(() => {
    if (!startTime) {
      setElapsed(0)
      return
    }

    if (!running) {
      setElapsed(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
      return
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
    }, 1000)

    // Initial update
    setElapsed(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))

    return () => clearInterval(interval)
  }, [startTime, running])

  if (!startTime) {
    return <span className="font-mono text-sm text-gray-400 dark:text-gray-600" aria-label="Timer not started">—</span>
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <span className="font-mono text-sm" aria-label={`Elapsed time: ${formatted}`}>
      {formatted}
    </span>
  )
}
