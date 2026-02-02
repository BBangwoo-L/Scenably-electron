import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { CreateScenarioData } from '../lib';
import { ScenarioService, AIService } from '../services';
import { normalizeCodeForSaving } from '../utils/codeConverter';

export interface ScenarioData extends CreateScenarioData {
  id?: string;
}

export function useScenarioBuilder(initialData?: Partial<ScenarioData>, scenarioId?: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetUrl = searchParams.get("url") || initialData?.targetUrl || "";

  const [scenarioData, setScenarioData] = useState<ScenarioData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    targetUrl,
    code: initialData?.code || `import { test, expect } from '@playwright/test';

test('E2E Test for ${targetUrl}', async ({ page }) => {
  // Navigate to the target URL
  await page.goto('${targetUrl}');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Add your test steps here
  // Example: Check if page title is not empty
  const title = await page.title();
  expect(title).toBeTruthy();

  // Example: Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });
});`,
    ...initialData
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드일 때 시나리오 데이터 로드
  useEffect(() => {
    const loadScenario = async () => {
      if (!scenarioId) return;

      try {
        setIsLoading(true);
        setError(null);
        const scenario = await ScenarioService.getById(scenarioId);
        setScenarioData({
          id: scenario.id,
          name: scenario.name,
          description: scenario.description || "",
          targetUrl: scenario.targetUrl,
          code: scenario.code
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "시나리오 로드에 실패했습니다";
        setError(errorMessage);
        console.error("Failed to load scenario:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadScenario();
  }, [scenarioId]);

  const updateScenarioData = (updates: Partial<ScenarioData>) => {
    setScenarioData(prev => ({ ...prev, ...updates }));
  };

  const saveScenario = async () => {
    if (!scenarioData.name.trim()) {
      throw new Error("시나리오 이름을 입력해주세요");
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('💾 saveScenario called with code:', scenarioData.code.substring(0, 100) + '...');

      // 저장 전 코드를 정규화 (Codegen → Test 형태로 자동 변환)
      const normalizedCode = normalizeCodeForSaving(scenarioData.code);
      const dataToSave = {
        ...scenarioData,
        code: normalizedCode
      };

      console.log('💾 Data to save:', dataToSave.code.substring(0, 100) + '...');

      let result;
      if (scenarioData.id) {
        result = await ScenarioService.update(dataToSave as any);
      } else {
        result = await ScenarioService.create(dataToSave);
      }

      // UI 상태도 변환된 코드로 업데이트
      setScenarioData(prev => ({
        ...prev,
        id: result.id,
        code: normalizedCode
      }));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save scenario";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const modifyWithAI = async (modificationRequest: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AIService.modifyCode({
        currentCode: scenarioData.code,
        modificationRequest,
        targetUrl: scenarioData.targetUrl,
      });

      setScenarioData(prev => ({ ...prev, code: result.modifiedCode }));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "AI modification failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTest = async () => {
    if (!scenarioData.name.trim()) {
      throw new Error("테스트를 실행하기 전에 먼저 시나리오를 저장해주세요");
    }

    try {
      setIsLoading(true);
      setError(null);

      // Save scenario first if it's new
      let scenarioId = scenarioData.id;
      if (!scenarioId) {
        const savedScenario = await saveScenario();
        scenarioId = savedScenario.id;
      }

      const result = await ScenarioService.execute(scenarioId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute test";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateHome = () => {
    navigate("/");
  };

  return {
    scenarioData,
    isLoading,
    error,
    updateScenarioData,
    saveScenario,
    modifyWithAI,
    executeTest,
    navigateHome
  };
}