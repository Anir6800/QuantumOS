'use client'

import * as React from 'react'

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number
  children?: React.ReactNode
}

export function Progress({ value = 0, className = '', children, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-white/8 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      {...props}
    >
      {children ?? <div className="h-full rounded-full bg-current transition-[width] duration-200 ease-out" style={{ width: `${clamped}%` }} />}
    </div>
  )
}
