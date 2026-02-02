import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Scenario } from '../lib';
import { ScenarioService } from '../services';

export function useScenarioActions() {
  const navigate = useNavigate();
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

      // 시나리오 ID로 실제 코드를 먼저 가져옴
      const scenario = await ScenarioService.getById(scenarioId);

      if (!scenario.code) {
        throw new Error('시나리오에 코드가 없습니다.');
      }

      // 가져온 코드로 디버그 실행
      const result = await ScenarioService.debug(scenario.code);
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
    navigate(`/scenario/edit/${scenario.id}`);
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