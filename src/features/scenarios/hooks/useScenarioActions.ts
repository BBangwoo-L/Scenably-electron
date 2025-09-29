"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Scenario } from '@/shared/types';
import { ScenarioService } from '../services';

export function useScenarioActions() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeScenario = async (scenarioId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ScenarioService.execute(scenarioId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute scenario";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteScenario = async (scenarioId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await ScenarioService.delete(scenarioId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete scenario";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const debugScenario = async (scenarioId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ScenarioService.debug(scenarioId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start debug mode";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const editScenario = (scenario: Scenario) => {
    router.push(`/scenario/edit/${scenario.id}`);
  };

  return {
    isLoading,
    error,
    executeScenario,
    deleteScenario,
    debugScenario,
    editScenario
  };
}