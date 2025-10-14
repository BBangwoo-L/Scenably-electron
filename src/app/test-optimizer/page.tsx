'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { PlaywrightCodeOptimizer } from '@/features/scenarios/components/playwright-code-optimizer';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TestOptimizerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터에서 시나리오 데이터 추출
  const scenarioId = searchParams.get('scenarioId');
  const scenarioName = searchParams.get('name') || '';
  const scenarioDescription = searchParams.get('description') || '';
  const targetUrl = searchParams.get('targetUrl') || '';
  const initialCode = searchParams.get('code') || '';
  const returnUrl = searchParams.get('returnUrl') || '/';

  const handleSaveAndReturn = async (optimizedCode: string) => {
    if (!scenarioId) {
      alert('시나리오 ID가 없습니다');
      return;
    }

    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: scenarioName,
          description: scenarioDescription,
          targetUrl: targetUrl,
          code: optimizedCode,
        }),
      });

      if (response.ok) {
        alert('최적화된 코드가 저장되었습니다!');
        router.push(returnUrl);
      } else {
        const error = await response.json();
        alert(`저장 실패: ${error.error}`);
      }
    } catch (error) {
      alert('저장에 실패했습니다');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push(returnUrl)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </Button>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {scenarioName ? `"${scenarioName}" 최적화` : 'Playwright 테스트 코드 최적화'}
          </h1>
          <p className="text-muted-foreground">
            Playwright codegen으로 생성된 코드를 안전하고 조건적인 처리로 변환합니다.
          </p>

          {targetUrl && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>대상 URL:</strong> {targetUrl}</p>
            </div>
          )}
        </div>

        <PlaywrightCodeOptimizer
          initialCode={initialCode}
          onCodeChange={(optimizedCode) => {
            // 코드 변경 시 자동 저장하지 않고 버튼으로만 저장
          }}
          scenarioId={scenarioId}
          onSaveAndReturn={handleSaveAndReturn}
        />
      </div>
    </div>
  );
}