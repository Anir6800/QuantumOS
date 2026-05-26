'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export type CopyButtonProps = {
  text: string
  className?: string
}

export function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied'>('idle')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${className}`}
      aria-label={state === 'copied' ? "Copied" : "Copy to clipboard"}
    >
      {state === 'idle' ? (
        <>
          <Copy size={14} />
          <span>Copy</span>
        </>
      ) : (
        <>
          <Check size={14} className="text-green-500" />
          <span className="text-green-600 dark:text-green-500">Copied!</span>
        </>
      )}
    </button>
  )
}
