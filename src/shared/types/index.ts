export interface Scenario {
  id: string;
  name: string;
  description?: string;
  targetUrl: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  executions: Array<{
    id: string;
    status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
    startedAt: string;
  }>;
}

export interface CreateScenarioData {
  name: string;
  description?: string;
  targetUrl: string;
  code: string;
}

export interface UpdateScenarioData extends Partial<CreateScenarioData> {
  id: string;
}

export interface ExecutionResult {
  executionId: string;
  status: string;
  success?: boolean;
  error?: string;
}

export interface RecordingSession {
  sessionId: string;
  status: string;
}

export type RecordingMode = 'interactive' | 'headless';

export interface StartRecordingData {
  url: string;
  mode: RecordingMode;
}

export interface StartRecordingResult {
  sessionId?: string;
  code?: string;
  mode: RecordingMode;
}

export interface StopRecordingData {
  sessionId: string;
  saveCode: boolean;
}

export interface StopRecordingResult {
  code?: string;
}

export interface ModifyCodeData {
  currentCode: string;
  modificationRequest: string;
  targetUrl: string;
}

export interface ModifyCodeResult {
  modifiedCode: string;
  explanation: string;
}