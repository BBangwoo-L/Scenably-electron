import type { Scenario, CreateScenarioData, UpdateScenarioData, ExecutionResult } from '@/shared/types';

export class ScenarioService {
  static async getAll(): Promise<Scenario[]> {
    const response = await fetch("/api/scenarios");
    if (!response.ok) {
      throw new Error("Failed to fetch scenarios");
    }
    return response.json();
  }

  static async getById(id: string): Promise<Scenario> {
    const response = await fetch(`/api/scenarios/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch scenario");
    }
    return response.json();
  }

  static async create(data: CreateScenarioData): Promise<Scenario> {
    const response = await fetch("/api/scenarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create scenario");
    }

    return response.json();
  }

  static async update(data: UpdateScenarioData): Promise<Scenario> {
    const { id, ...updateData } = data;
    const response = await fetch(`/api/scenarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update scenario");
    }

    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`/api/scenarios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete scenario");
    }
  }

  static async execute(id: string): Promise<ExecutionResult> {
    const response = await fetch(`/api/scenarios/${id}/execute`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to execute scenario");
    }

    return response.json();
  }

  static async debug(id: string): Promise<{ sessionId: string }> {
    const response = await fetch(`/api/scenarios/${id}/debug`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to start debug mode");
    }

    return response.json();
  }
}