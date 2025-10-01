import { apiClient } from '@/shared/lib';
import { SCENARIO_API_ENDPOINTS } from '../lib';
import type { Scenario, CreateScenarioData, UpdateScenarioData, ExecutionResult } from '../lib';

export class ScenarioService {
  static async getAll(): Promise<Scenario[]> {
    return apiClient.get<Scenario[]>(SCENARIO_API_ENDPOINTS.SCENARIOS);
  }

  static async getById(id: string): Promise<Scenario> {
    return apiClient.get<Scenario>(SCENARIO_API_ENDPOINTS.SCENARIO_BY_ID(id));
  }

  static async create(data: CreateScenarioData): Promise<Scenario> {
    return apiClient.post<Scenario>(SCENARIO_API_ENDPOINTS.SCENARIOS, data);
  }

  static async update(data: UpdateScenarioData): Promise<Scenario> {
    const { id, ...updateData } = data;
    return apiClient.put<Scenario>(SCENARIO_API_ENDPOINTS.SCENARIO_BY_ID(id), updateData);
  }

  static async delete(id: string): Promise<void> {
    return apiClient.delete<void>(SCENARIO_API_ENDPOINTS.SCENARIO_BY_ID(id));
  }

  static async execute(id: string): Promise<ExecutionResult> {
    return apiClient.post<ExecutionResult>(SCENARIO_API_ENDPOINTS.SCENARIO_EXECUTE(id));
  }

  static async debug(id: string): Promise<{ sessionId: string }> {
    return apiClient.post<{ sessionId: string }>(SCENARIO_API_ENDPOINTS.SCENARIO_DEBUG(id));
  }
}