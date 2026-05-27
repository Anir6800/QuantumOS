'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'

export type BenchmarkBreakdown = {
  syntax_score?: number
  completeness_score?: number
  security_score?: number
  complexity_score?: number
  speed_score?: number
}

export type BenchmarkAgentResult = {
  agent_id: string
  agent_name?: string
  model?: string
  total_score: number
  breakdown?: BenchmarkBreakdown
}

type BenchmarkChartProps = {
  results: BenchmarkAgentResult[]
}

const RANK_COLORS = ['text-amber-400', 'text-gray-400', 'text-amber-900', 'text-gray-600'] as const

const BREAKDOWN_LABELS: Array<{ key: keyof BenchmarkBreakdown; label: string }> = [
  { key: 'syntax_score', label: 'syntax score' },
  { key: 'completeness_score', label: 'completeness score' },
  { key: 'security_score', label: 'security score' },
  { key: 'complexity_score', label: 'complexity score' },
  { key: 'speed_score', label: 'speed score' },
]

function clampScore(value: number) {
  return Math.min(100, Math.max(0, value))
}

export function BenchmarkChart({ results }: BenchmarkChartProps) {
  const sorted = React.useMemo(
    () => [...results].sort((a, b) => b.total_score - a.total_score),
    [results]
  )

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-muted-foreground">
        No benchmark results available yet.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Benchmark Ranking</h2>
          <p className="mt-1 text-sm text-muted-foreground">Agents sorted by total score, highest first.</p>
        </div>
        <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">0 - 100</span>
      </div>

      <div className="space-y-4">
        {sorted.map((agent, index) => {
          const colorClass = RANK_COLORS[Math.min(index, RANK_COLORS.length - 1)]
          const name = agent.agent_name ?? agent.agent_id
          const breakdown = agent.breakdown ?? {}

          return (
            <div
              key={agent.agent_id}
              className="group rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.05]"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${colorClass}`}>#{index + 1}</span>
                    <h3 className="text-base font-semibold text-foreground">{name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{agent.model ?? 'Unknown model'}</p>
                </div>
                <div className="text-right">
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    className="text-sm font-mono text-foreground"
                  >
                    {clampScore(agent.total_score).toFixed(1)}
                  </motion.div>
                  <div className="text-xs text-muted-foreground">total score</div>
                </div>
              </div>

              <div
                className="group/bar relative"
                title={BREAKDOWN_LABELS
                  .map(({ key, label }) => `${label}: ${Math.round((breakdown[key] ?? 0) as number)}`)
                  .join(' | ')}
              >
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{name}</span>
                  <span>{agent.model ?? 'unknown'}</span>
                </div>
                <Progress value={clampScore(agent.total_score)} className="bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampScore(agent.total_score)}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`}
                  />
                </Progress>
                <div className="pointer-events-none absolute left-0 top-full z-10 mt-3 opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100">
                  <div className="w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-slate-200 shadow-2xl">
                    <div className="mb-2 font-semibold text-white">Breakdown</div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {BREAKDOWN_LABELS.map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <span className="capitalize text-slate-400">{label}</span>
                          <span className="font-mono text-white">{Math.round((breakdown[key] ?? 0) as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
