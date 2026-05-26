'use client'

import React from 'react'
import { motion } from 'framer-motion'

export type ScoreBarProps = {
  label: string
  score: number
  maxScore?: number
  color?: string
  animated?: boolean
}

export function ScoreBar({ label, score, maxScore = 100, color = 'bg-cyan-500', animated = true }: ScoreBarProps) {
  const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100)

  return (
    <div className="w-full flex flex-col gap-1.5" aria-label={`${label} Score: ${score} out of ${maxScore}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-mono text-gray-900 dark:text-gray-100">{score}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${color}`}
          />
        ) : (
          <div 
            className={`h-full rounded-full ${color}`} 
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  )
}
