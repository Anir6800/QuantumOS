'use client'

import * as React from 'react'
import { BenchmarkChart, type BenchmarkAgentResult } from '@/components/dashboard/BenchmarkChart'
import { ResultsViewer, type ResultCandidate } from '@/components/dashboard/ResultsViewer'
import { useSessionStore } from '@/store/session-store'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toBenchmarkResults(results: unknown[]): BenchmarkAgentResult[] {
  return results
    .map((result, index) => {
      if (!isObject(result)) return null
      const output = isObject(result.output) ? result.output : undefined
      const agentName = (result.agent_name as string | undefined) ?? (output?.agent_name as string | undefined)
      const model = (result.model as string | undefined) ?? (output?.model as string | undefined)
      const totalScoreRaw = result.total_score ?? output?.total_score ?? output?.score ?? output?.winner_score ?? index
      const total_score = Number(totalScoreRaw ?? 0)
      const breakdown = isObject(output?.breakdown)
        ? output.breakdown
        : isObject(output?.metrics)
          ? output.metrics
          : undefined

      return {
        agent_id: String(result.agentId ?? result.agent_id ?? output?.agent_id ?? `agent-${index}`),
        agent_name: agentName,
        model,
        total_score,
        breakdown: isObject(breakdown)
          ? {
              syntax_score: Number(breakdown.syntax_score ?? breakdown.syntax ?? 0),
              completeness_score: Number(breakdown.completeness_score ?? breakdown.completeness ?? 0),
              security_score: Number(breakdown.security_score ?? breakdown.security ?? 0),
              complexity_score: Number(breakdown.complexity_score ?? breakdown.complexity ?? 0),
              speed_score: Number(breakdown.speed_score ?? breakdown.speed ?? 0),
            }
          : undefined,
      }
    })
    .filter(Boolean) as BenchmarkAgentResult[]
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-8 w-72 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-white/10" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-xl bg-white/5" />
            <div className="h-16 animate-pulse rounded-xl bg-white/5" />
            <div className="h-16 animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-72 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const results = useSessionStore((state) => state.results)
  const benchmarkResults = React.useMemo(() => toBenchmarkResults(results as unknown[]), [results])
  const viewerResults = results as ResultCandidate[]

  if (!benchmarkResults.length) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Benchmark Results</h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Review the ranked agents, compare outputs, and inspect the winning solution.
        </p>
      </div>

      <BenchmarkChart results={benchmarkResults} />
      <ResultsViewer results={viewerResults} />
    </div>
  )
}
