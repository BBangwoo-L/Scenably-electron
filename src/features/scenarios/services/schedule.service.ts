import { unifiedApiClient } from '@/shared/lib/electron-api-client';

export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ScenarioSchedule {
  id?: string;
  scenarioId: string;
  enabled: boolean;
  frequency: ScheduleFrequency;
  time: string; // HH:MM
  dayOfWeek?: string | null;
  dayOfMonth?: number | null;
}

export interface ScenarioScheduleWithScenario extends ScenarioSchedule {
  scenarioName: string;
  targetUrl: string;
  lastStatus?: string | null;
  lastStartedAt?: string | null;
  lastCompletedAt?: string | null;
  lastExecutionId?: string | null;
}

export interface ScheduleRun {
  id: string;
  scheduleId: string;
  executionId: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILURE';
  startedAt: string;
  completedAt: string | null;
}

export class ScheduleService {
  static async getByScenarioId(scenarioId: string): Promise<ScenarioSchedule | null> {
    return unifiedApiClient.getScheduleByScenarioId(scenarioId);
  }

  static async save(data: ScenarioSchedule): Promise<ScenarioSchedule> {
    return unifiedApiClient.saveSchedule(data);
  }

  static async toggle(scenarioId: string, enabled: boolean): Promise<ScenarioSchedule> {
    return unifiedApiClient.toggleSchedule(scenarioId, enabled);
  }

  static async delete(scenarioId: string): Promise<{ deleted: boolean }> {
    return unifiedApiClient.deleteSchedule(scenarioId);
  }

  static async list(): Promise<ScenarioScheduleWithScenario[]> {
    return unifiedApiClient.listSchedules();
  }

  static async listRuns(scheduleId: string): Promise<ScheduleRun[]> {
    return unifiedApiClient.listScheduleRuns(scheduleId);
  }
}
