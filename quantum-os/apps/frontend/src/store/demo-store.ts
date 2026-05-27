import { create } from 'zustand';

export type DemoStatePhase = 'idle' | 'initializing' | 'executing' | 'benchmarking' | 'completed';

export interface FakeLog {
  id: string;
  agent: string;
  message: string;
  timestamp: number;
}

export interface DemoStore {
  isDemoModeActive: boolean;
  phase: DemoStatePhase;
  fakeLogs: FakeLog[];
  selectedWinner: string | null;
  winReason: string | null;
  agentScores: Record<string, number>;
  
  toggleDemoMode: () => void;
  setPhase: (phase: DemoStatePhase) => void;
  addFakeLog: (log: Omit<FakeLog, 'id' | 'timestamp'>) => void;
  setWinner: (winner: string, reason: string) => void;
  updateAgentScore: (agent: string, score: number) => void;
  resetSimulation: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  isDemoModeActive: false,
  phase: 'idle',
  fakeLogs: [],
  selectedWinner: null,
  winReason: null,
  agentScores: {},
  
  toggleDemoMode: () => set((state) => ({ isDemoModeActive: !state.isDemoModeActive })),
  setPhase: (phase) => set({ phase }),
  addFakeLog: (log) => set((state) => {
    // Keep only the last 50 logs to prevent memory bloat and UI lag
    const newLogs = [...state.fakeLogs, { ...log, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }];
    if (newLogs.length > 50) newLogs.shift();
    return { fakeLogs: newLogs };
  }),
  setWinner: (winner, reason) => set({ selectedWinner: winner, winReason: reason }),
  updateAgentScore: (agent, score) => set((state) => ({
    agentScores: { ...state.agentScores, [agent]: score }
  })),
  resetSimulation: () => set({
    phase: 'idle',
    fakeLogs: [],
    selectedWinner: null,
    winReason: null,
    agentScores: {}
  })
}));
