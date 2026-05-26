"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/app/dashboard/layout';
import {
  HomeIcon,
  ZapIcon,
  CpuIcon,
  BarChart2Icon,
  ScrollIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TerminalSquareIcon
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: HomeIcon, label: 'Overview' },
  { href: '/dashboard/session', icon: ZapIcon, label: 'New Session' },
  { href: '/dashboard/agents', icon: CpuIcon, label: 'Live Agents' },
  { href: '/dashboard/results', icon: BarChart2Icon, label: 'Results' },
  { href: '/dashboard/logs', icon: ScrollIcon, label: 'Logs' },
];

export function Sidebar() {
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0 overflow-hidden">
        <TerminalSquareIcon className="h-6 w-6 text-cyan-500 flex-shrink-0" />
        <span className={`ml-3 font-bold text-lg whitespace-nowrap text-foreground transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
          QuantumOS
        </span>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto overflow-x-hidden px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          
          const baseClasses = "flex items-center h-10 px-2 rounded-md transition-colors";
          const activeClasses = "bg-cyan-500/10 text-cyan-500 border-l-2 border-cyan-500";
          const inactiveClasses = "text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent";
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
              title={!isOpen ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-border flex-shrink-0 flex flex-col gap-2">
        <Link
          href="/dashboard/settings"
          className="flex items-center h-10 px-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border-l-2 border-transparent overflow-hidden"
          title={!isOpen ? 'Settings' : undefined}
        >
          <SettingsIcon className="h-5 w-5 flex-shrink-0" />
          <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Settings</span>
        </Link>
        <button
          onClick={toggleSidebar}
          className="flex items-center h-10 px-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border-l-2 border-transparent w-full overflow-hidden"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          <ChevronLeftIcon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
          <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Collapse</span>
        </button>
      </div>
    </div>
  );
}
