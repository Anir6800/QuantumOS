export type AgentId = string;

export interface AgentStatus {
  id: AgentId;
  state: 'idle' | 'busy' | 'offline';
  lastSeen: Date;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
}
