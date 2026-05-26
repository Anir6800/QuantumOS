"use client";

import React, { useEffect, useState } from 'react';
import { wsClient } from '@/lib/ws-client';
import { useSessionStore } from '@/store/session-store';

export function TopBar() {
  const { sessionId } = useSessionStore();
  const [wsState, setWsState] = useState<number>(3); // 3 = CLOSED initially

  useEffect(() => {
    // Poll the WebSocket state
    const checkState = () => {
      setWsState(wsClient.readyState);
    };
    
    // Initial check
    checkState();

    const interval = setInterval(checkState, 1000);
    return () => clearInterval(interval);
  }, []);

  // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
  let dotColor = 'bg-red-500';
  let statusText = 'Disconnected';
  if (wsState === 1) {
    dotColor = 'bg-green-500';
    statusText = 'Connected';
  } else if (wsState === 0) {
    dotColor = 'bg-yellow-500';
    statusText = 'Connecting';
  }

  return (
    <div className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 lg:px-8 flex-shrink-0">
      <div>
        <h1 className="font-semibold text-base md:text-lg text-foreground">
          {sessionId ? `Session: ${sessionId}` : 'No Active Session'}
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2" title={`WebSocket Status: ${statusText}`}>
          <div className={`w-3 h-3 rounded-full ${dotColor} animate-pulse shadow-sm`} />
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
