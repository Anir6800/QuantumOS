import { create } from 'zustand';
import { AgentId } from '@quantum-os/shared';

export interface AgentState {
  id: AgentId;
  name: string;
  status: 'idle' | 'busy' | 'offline';
  model: string;
  output: string | null;
  startTime: Date | null;
  endTime: Date | null;
}

export interface AgentStore {
  agents: AgentState[];
  activeSession: string | null;
  addAgent: (agent: AgentState) => void;
  updateAgent: (id: AgentId, updates: Partial<AgentState>) => void;
  clearAgents: () => void;
  setSession: (sessionId: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  activeSession: null,
  addAgent: (agent) =>
    set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    })),
  clearAgents: () => set({ agents: [] }),
  setSession: (sessionId) => set({ activeSession: sessionId }),
}));
