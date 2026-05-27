"use client"

import React from 'react'
import Link from 'next/link'

export function TopBar() {
  return (
    <header className="w-full border-b border-white/6 bg-transparent py-3 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-lg font-semibold">QuantumOS</Link>
        <nav className="hidden sm:flex items-center gap-3 text-sm text-slate-300">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/dashboard/session" className="hover:underline">Sessions</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="hidden sm:inline">Status: <strong className="ml-2 text-slate-200">Connected</strong></span>
      </div>
    </header>
  )
}
