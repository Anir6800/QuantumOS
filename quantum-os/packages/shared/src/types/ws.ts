export const WS_EVENTS = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  TASK_ASSIGN: 'TASK_ASSIGN',
  TASK_UPDATE: 'TASK_UPDATE',
  AGENT_STATUS: 'AGENT_STATUS',
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];

export interface WSEventPayload {
  event: WSEventType;
  data: any;
}
