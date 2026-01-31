'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { PlaywrightCodeOptimizer } from '@/features/scenarios/components/playwright-code-optimizer';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function TestOptimizerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 로딩 및 데이터 상태
  const [isLoading, setIsLoading] = useState(true);
  const [scenarioData, setScenarioData] = useState<{
    scenarioId: string | null;
    scenarioName: string;
    scenarioDescription: string;
    targetUrl: string;
    initialCode: string;
    returnUrl: string;
  }>({
    scenarioId: null,
    scenarioName: '',
    scenarioDescription: '',
    targetUrl: '',
    initialCode: '',
    returnUrl: '/'
  });

  // scenarioId로 데이터 로드
  useEffect(() => {
    const loadScenarioData = async () => {
      setIsLoading(true);

      const scenarioId = searchParams.get('scenarioId');
      const returnUrl = searchParams.get('returnUrl') || '/';

      if (!scenarioId) {
        alert('시나리오 ID가 필요합니다');
        router.push(returnUrl);
        return;
      }

      try {
        const response = await fetch(`/api/scenarios/${scenarioId}`);
        if (response.ok) {
          const scenario = await response.json();

          setScenarioData({
            scenarioId: scenario.id,
            scenarioName: scenario.name || '',
            scenarioDescription: scenario.description || '',
            targetUrl: scenario.targetUrl || '',
            initialCode: scenario.code || '',
            returnUrl: returnUrl
          });
        } else {
          alert('시나리오를 찾을 수 없습니다');
          router.push(returnUrl);
          return;
        }
      } catch (error) {
        console.error('시나리오 로드 실패:', error);
        alert('시나리오 로드에 실패했습니다');
        router.push(returnUrl);
        return;
      }

      setIsLoading(false);
    };

    loadScenarioData();
  }, [searchParams, router]);

  const handleSaveAndReturn = async (optimizedCode: string) => {
    if (!scenarioData.scenarioId) {
      alert('시나리오 ID가 없습니다');
      return;
    }

    try {
      const response = await fetch(`/api/scenarios/${scenarioData.scenarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: scenarioData.scenarioName,
          description: scenarioData.scenarioDescription,
          targetUrl: scenarioData.targetUrl,
          code: optimizedCode,
        }),
      });

      if (response.ok) {
        alert('최적화된 코드가 저장되었습니다!');
        router.push(scenarioData.returnUrl);
      } else {
        const error = await response.json();
        alert(`저장 실패: ${error.error}`);
      }
    } catch (error) {
      alert('저장에 실패했습니다');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>시나리오 데이터를 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push(scenarioData.returnUrl)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </Button>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {scenarioData.scenarioName ? `"${scenarioData.scenarioName}" 최적화` : 'Playwright 테스트 코드 최적화'}
          </h1>
          <p className="text-muted-foreground">
            Playwright codegen으로 생성된 코드를 안전하고 조건적인 처리로 변환합니다.
          </p>

          {scenarioData.targetUrl && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>대상 URL:</strong> {scenarioData.targetUrl}</p>
            </div>
          )}
        </div>

        <PlaywrightCodeOptimizer
          initialCode={scenarioData.initialCode}
          onCodeChange={(optimizedCode) => {
            // 코드 변경 시 자동 저장하지 않고 버튼으로만 저장
          }}
          scenarioId={scenarioData.scenarioId}
          onSaveAndReturn={handleSaveAndReturn}
        />
      </div>
    </div>
  );
}

export default function TestOptimizerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <TestOptimizerContent />
    </Suspense>
  );
}