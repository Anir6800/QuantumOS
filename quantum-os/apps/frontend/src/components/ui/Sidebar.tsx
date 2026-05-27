"use client"

import React from 'react'
import Link from 'next/link'

export function Sidebar() {
  return (
    <aside className="w-64 min-w-[14rem] border-r border-white/6 bg-transparent p-4 hidden md:block">
      <div className="mb-6">
        <h4 className="text-sm text-slate-300">Navigation</h4>
      </div>
      <nav className="flex flex-col gap-2 text-sm">
        <Link href="/dashboard" className="py-2 px-3 rounded hover:bg-white/2">Dashboard</Link>
        <Link href="/dashboard/session" className="py-2 px-3 rounded hover:bg-white/2">Sessions</Link>
        <Link href="/dashboard/logs" className="py-2 px-3 rounded hover:bg-white/2">Logs</Link>
        <Link href="/dashboard/settings" className="py-2 px-3 rounded hover:bg-white/2">Settings</Link>
      </nav>
    </aside>
  )
}
