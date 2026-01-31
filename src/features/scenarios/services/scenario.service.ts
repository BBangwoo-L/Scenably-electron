import { unifiedApiClient } from '@/shared/lib/electron-api-client';
import type { Scenario, CreateScenarioData, UpdateScenarioData, ExecutionResult } from '../lib';

export class ScenarioService {
  static async getAll(): Promise<Scenario[]> {
    return unifiedApiClient.getScenarios();
  }

  static async getById(id: string): Promise<Scenario> {
    return unifiedApiClient.getScenarioById(id);
  }

  static async create(data: CreateScenarioData): Promise<Scenario> {
    return unifiedApiClient.createScenario(data);
  }

  static async update(data: UpdateScenarioData): Promise<Scenario> {
    const { id, ...updateData } = data;
    return unifiedApiClient.updateScenario(id, updateData);
  }

  static async delete(id: string): Promise<void> {
    await unifiedApiClient.deleteScenario(id);
  }

  static async execute(id: string, code: string): Promise<ExecutionResult> {
    return unifiedApiClient.executeScenario(id, code);
  }

  static async debug(code: string): Promise<{ sessionId: string }> {
    return unifiedApiClient.debugScenario(code);
  }
}