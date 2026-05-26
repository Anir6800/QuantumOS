'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

export type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" aria-label={`Empty state: ${title}`}>
      <div className="bg-gray-100 dark:bg-gray-900 rounded-full p-4 mb-4">
        <Icon size={48} className="text-gray-400 dark:text-gray-600" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-medium transition-colors"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
