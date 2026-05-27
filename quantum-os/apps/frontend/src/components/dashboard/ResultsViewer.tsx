'use client'

import * as React from 'react'
import { ChevronDown, Copy, Download } from 'lucide-react'

export type ResultCandidate = {
  agent_id: string
  agent_name?: string
  model?: string
  total_score?: number
  selection_summary?: string
  output?: unknown
}

type ResultsViewerProps = {
  results: ResultCandidate[]
}

type HighlightApi = {
  highlightElement: (el: HTMLElement) => void
  highlight: (code: string, options: { language: string }) => { value: string }
}

function formatOutput(output: unknown) {
  if (typeof output === 'string') return output
  if (output && typeof output === 'object') {
    const obj = output as Record<string, unknown>
    return String(obj.code ?? obj.output ?? obj.text ?? JSON.stringify(output, null, 2))
  }
  return String(output ?? '')
}

function inferLanguage(code: string, fallback: 'py' | 'ts' = 'ts') {
  const trimmed = code.trimStart()
  if (/^(from\s+\w+\s+import|import\s+\w+|def\s+\w+|class\s+\w+|if\s+__name__\s*==\s*['"]__main__['"])/m.test(trimmed)) {
    return 'python'
  }
  if (/^\s*<\w+/.test(trimmed)) {
    return 'xml'
  }
  return fallback === 'py' ? 'python' : 'typescript'
}

function pickExtension(language: string) {
  return language === 'python' ? 'py' : 'ts'
}

function pickName(result: ResultCandidate) {
  return result.agent_name ?? result.agent_id
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function ResultsViewer({ results }: ResultsViewerProps) {
  const sorted = React.useMemo(
    () => [...results].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0)),
    [results]
  )
  const winner = sorted[0]
  const winnerCode = formatOutput(winner?.output)
  const language = inferLanguage(winnerCode, winnerCode.includes('def ') ? 'py' : 'ts')
  const [copied, setCopied] = React.useState(false)
  const [highlightApi, setHighlightApi] = React.useState<HighlightApi | null>(null)

  React.useEffect(() => {
    let active = true

    const ensureHighlight = async () => {
      if (typeof window === 'undefined') return
      if ((window as Window & { hljs?: HighlightApi }).hljs) {
        if (active) setHighlightApi((window as Window & { hljs?: HighlightApi }).hljs ?? null)
        return
      }

      const cssId = 'highlightjs-cdn-css'
      const scriptId = 'highlightjs-cdn-script'

      if (!document.getElementById(cssId)) {
        const link = document.createElement('link')
        link.id = cssId
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css'
        document.head.appendChild(link)
      }

      if (!document.getElementById(scriptId)) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.id = scriptId
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js'
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load highlight.js'))
          document.head.appendChild(script)
        })
      }

      if (active) {
        setHighlightApi((window as Window & { hljs?: HighlightApi }).hljs ?? null)
      }
    }

    void ensureHighlight()

    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    if (!highlightApi) return
    const blocks = document.querySelectorAll<HTMLElement>('[data-code-block]')
    blocks.forEach((block) => {
      highlightApi.highlightElement(block)
    })
  }, [highlightApi, sorted])

  const handleCopy = async () => {
    if (!winnerCode) return
    await navigator.clipboard.writeText(winnerCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!winnerCode) return
    const blob = new Blob([winnerCode], { type: language === 'python' ? 'text/x-python' : 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `winner-output.${pickExtension(language)}`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!winner) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-muted-foreground">
        No results to display.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Winning Agent</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{pickName(winner)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Score {Math.round(winner.total_score ?? 0)}/100 {winner.model ? `• ${winner.model}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#07111f] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">Winner</span>
            <span>{winner.model ?? 'Unknown model'}</span>
          </div>
          <span className="text-xs text-muted-foreground">{pickName(winner)}</span>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-0 overflow-hidden">
          <div className="border-r border-white/8 bg-black/20 px-3 py-4 text-right font-mono text-xs leading-6 text-white/35 select-none">
            {winnerCode.split('\n').map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-sm leading-6">
            <code
              data-code-block
              className={`language-${language} font-mono text-slate-100`}
              dangerouslySetInnerHTML={{
                __html: highlightApi ? highlightApi.highlight(winnerCode, { language }).value : escapeHtml(winnerCode)
              }}
            />
          </pre>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {winner.selection_summary ?? 'This result was selected as the top benchmark output for the current session.'}
      </p>

      <details className="group rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground">
          Compare All Outputs
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="mt-4 space-y-4">
          {sorted.map((result) => {
            const code = formatOutput(result.output)
            const resultLanguage = inferLanguage(code, code.includes('def ') ? 'py' : 'ts')
            return (
              <div key={result.agent_id} className="rounded-xl border border-white/8 bg-black/20">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-4 py-3">
                  <div>
                    <div className="font-medium text-foreground">{pickName(result)}</div>
                    <div className="text-xs text-muted-foreground">{result.model ?? 'Unknown model'}</div>
                  </div>
                  <div className="text-sm font-mono text-muted-foreground">{Math.round(result.total_score ?? 0)}/100</div>
                </div>
                <div className="grid grid-cols-[auto_1fr]">
                  <div className="border-r border-white/8 bg-black/25 px-3 py-3 text-right font-mono text-xs leading-6 text-white/30 select-none">
                    {code.split('\n').map((_, index) => (
                      <div key={index}>{index + 1}</div>
                    ))}
                  </div>
                  <pre className="overflow-x-auto px-4 py-3 text-sm leading-6">
                    <code
                      className={`language-${resultLanguage} font-mono text-slate-100`}
                      dangerouslySetInnerHTML={{
                        __html: highlightApi ? highlightApi.highlight(code, { language: resultLanguage }).value : escapeHtml(code)
                      }}
                    />
                  </pre>
                </div>
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}
