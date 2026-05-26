export type TaskType = 'computation' | 'io' | 'network';

export interface TaskPayload {
  type: TaskType;
  data: any;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output: any;
}
