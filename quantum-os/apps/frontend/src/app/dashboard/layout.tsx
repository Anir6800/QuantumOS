"use client";

import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/dashboard/TopBar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { useDemoShortcut } from '@/hooks/useDemoShortcut';
import { useDemoStore } from '@/store/demo-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Initialize keyboard listener globally
  useDemoShortcut();
  
  const isDemoModeActive = useDemoStore((state) => state.isDemoModeActive);
  const [flash, setFlash] = useState(false);

  // Trigger flash effect on toggle
  useEffect(() => {
    if (isDemoModeActive) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isDemoModeActive]);

  return (
    <div className="relative flex h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950 text-foreground overflow-hidden">
      
      {/* Holographic Flash Overlay for Demo Mode Activation */}
      <div 
        className={`absolute inset-0 pointer-events-none z-50 transition-all duration-700 ${
          flash ? 'bg-cyan-500/20 backdrop-blur-md opacity-100' : 'bg-transparent backdrop-blur-none opacity-0'
        }`} 
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 h-full">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-28">
          {children}
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
      
      {/* Demo Mode Indicator (Hidden as requested) */}
    </div>
  );
}
