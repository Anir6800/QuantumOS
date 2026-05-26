"use client";

import React from 'react';
import Link from 'next/link';
import { ActivityIcon, UsersIcon, TrophyIcon, ClockIcon, PlayIcon } from 'lucide-react';

const STATS = [
  { label: 'Active Agents', value: '4', icon: UsersIcon, color: 'text-blue-500' },
  { label: 'Sessions Run', value: '12', icon: ActivityIcon, color: 'text-cyan-500' },
  { label: 'Best Score', value: '98%', icon: TrophyIcon, color: 'text-yellow-500' },
  { label: 'Avg Duration', value: '1.2s', icon: ClockIcon, color: 'text-purple-500' },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your QuantumOS environment</p>
        </div>
        <Link 
          href="/dashboard/session"
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-md font-medium transition-colors shadow-lg shadow-cyan-500/20"
        >
          <PlayIcon className="h-5 w-5" fill="currentColor" />
          Start New Session
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-muted-foreground font-medium text-sm">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-2 text-foreground">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Recent Sessions</h2>
        </div>
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ActivityIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No sessions yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Start a new session to launch agents and begin tasks.
          </p>
          <Link 
            href="/dashboard/session"
            className="text-cyan-500 font-medium hover:text-cyan-400 hover:underline"
          >
            Start your first session &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
