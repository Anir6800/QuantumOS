'use client'

import React from 'react'

export type ModelBadgeProps = { model: string; provider: string }

const providerColorMap: Record<string, string> = {
  groq: 'bg-cyan-500',
  openrouter: 'bg-violet-500',
  together: 'bg-green-500',
  nvidia: 'bg-amber-500'
}

export function ModelBadge({ model, provider }: ModelBadgeProps) {
  const colorClass = providerColorMap[provider.toLowerCase()] || 'bg-gray-500'
  const truncatedModel = model.length > 20 ? model.slice(0, 20) + '...' : model

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300" aria-label={`Model: ${model}, Provider: ${provider}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
      <span>{truncatedModel}</span>
    </div>
  )
}
