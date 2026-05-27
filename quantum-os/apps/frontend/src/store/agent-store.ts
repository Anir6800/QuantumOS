import { create } from 'zustand';
import { AgentId } from '@quantum-os/shared';

export type SwarmAgentStatus = 'idle' | 'running' | 'complete' | 'failed' | 'winner' | 'offline';

export interface AgentLogEntry {
  ts: number;
  message: string;
}

export interface AgentState {
  id: AgentId;
  name: string;
  status: SwarmAgentStatus;
  model: string;
  provider?: string;
  output: string | null;
  startTime: Date | null;
  endTime: Date | null;
  logs?: AgentLogEntry[];
  tokenCount?: number;
  currentLog?: string;
}

export interface AgentStore {
  agents: AgentState[];
  activeSession: string | null;
  addAgent: (agent: AgentState) => void;
  updateAgent: (id: AgentId, updates: Partial<AgentState>) => void;
  appendAgentLog: (id: AgentId, message: string) => void;
  incrementTokenCount: (id: AgentId, delta?: number) => void;
  clearAgents: () => void;
  setSession: (sessionId: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  activeSession: null,
  addAgent: (agent) =>
    set((state) => ({ agents: [...state.agents, { logs: [], tokenCount: 0, ...agent }] })),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    })),
  appendAgentLog: (id, message) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? {
              ...agent,
              logs: [...(agent.logs ?? []), { ts: Date.now(), message }].slice(-200),
              currentLog: message,
            }
          : agent
      ),
    })),
  incrementTokenCount: (id, delta = 1) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? { ...agent, tokenCount: (agent.tokenCount ?? 0) + delta }
          : agent
      ),
    })),
  clearAgents: () => set({ agents: [] }),
  setSession: (sessionId) => set({ activeSession: sessionId }),
}));

// Helper hook: subscribe to a single agent by id to avoid whole-array re-renders
export const useAgent = (id: AgentId) =>
  useAgentStore((state) => state.agents.find((a) => a.id === id))
