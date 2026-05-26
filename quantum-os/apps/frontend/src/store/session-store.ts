import { create } from 'zustand';
import { TaskResult } from '@quantum-os/shared';

export type SessionStatus = 'idle' | 'active' | 'completed' | 'error';

export interface SessionStore {
  sessionId: string | null;
  status: SessionStatus;
  taskDescription: string | null;
  results: TaskResult[];
  startSession: (sessionId: string, taskDescription: string) => void;
  endSession: () => void;
  setResults: (results: TaskResult[]) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  status: 'idle',
  taskDescription: null,
  results: [],
  startSession: (sessionId, taskDescription) =>
    set({ sessionId, status: 'active', taskDescription, results: [] }),
  endSession: () => set({ status: 'completed' }),
  setResults: (results) => set({ results }),
}));
