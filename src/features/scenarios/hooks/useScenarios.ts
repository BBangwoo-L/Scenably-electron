import { useState, useEffect } from 'react';
import type { Scenario } from '@/shared/types';
import { ScenarioService } from '../services';

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ScenarioService.getAll();
      setScenarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const updateScenarioStatus = (scenarioId: string, status: 'RUNNING' | 'SUCCESS' | 'FAILED') => {
    setScenarios(prev => prev.map(scenario =>
      scenario.id === scenarioId
        ? {
            ...scenario,
            executions: [{
              id: status === 'RUNNING' ? 'temp-' + Date.now() : scenario.executions[0]?.id || 'unknown',
              status,
              startedAt: new Date().toISOString()
            }, ...scenario.executions.slice(status === 'RUNNING' ? 0 : 1)]
          }
        : scenario
    ));
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  return {
    scenarios,
    isLoading,
    error,
    fetchScenarios,
    updateScenarioStatus
  };
}