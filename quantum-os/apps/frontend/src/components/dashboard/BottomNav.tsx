"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gamepad2Icon,
  CpuIcon,
  PlaySquareIcon,
  TrophyIcon,
  SettingsIcon
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Gamepad2Icon, label: 'Arena' },
  { href: '/dashboard/agents', icon: CpuIcon, label: 'Swarm' },
  { href: '/dashboard/replay', icon: PlaySquareIcon, label: 'Replay' },
  { href: '/dashboard/rankings', icon: TrophyIcon, label: 'Rankings' },
  { href: '/dashboard/settings', icon: SettingsIcon, label: 'Settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
        {NAV_ITEMS.map((item) => {
          // Strict match for Arena, loose match for others (or we can just strict match everything for now)
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
                isActive 
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-110' 
                  : 'text-white/60 hover:text-white hover:bg-white/10 hover:scale-105'
              }`}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
