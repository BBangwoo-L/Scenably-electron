"use client";

import { useState, useEffect, useRef } from 'react';
import type { Scenario } from '../lib';
import { ScenarioService } from '../services';
import { unifiedApiClient } from '@/shared/lib/electron-api-client';

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchScenarios = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);
      const data = await ScenarioService.getAll();
      setScenarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scenarios');
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
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

  // Subscribe to execution status change events
  useEffect(() => {
    const cleanup = unifiedApiClient.onExecutionStatusChanged(() => {
      fetchScenarios({ silent: true });
    });

    return cleanup;
  }, []);

  // Polling fallback: if any scenario has RUNNING status, poll every 3 seconds
  useEffect(() => {
    const hasRunning = scenarios.some(s =>
      s.executions.length > 0 && s.executions[0].status === 'RUNNING'
    );

    if (hasRunning && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        fetchScenarios({ silent: true });
      }, 3000);
    } else if (!hasRunning && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [scenarios]);

  return {
    scenarios,
    isLoading,
    error,
    fetchScenarios,
    updateScenarioStatus
  };
}
