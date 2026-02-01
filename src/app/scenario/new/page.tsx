"use client";

import { useState, useEffect } from "react";
import { ScenarioBuilder } from "@/features/scenarios/components";

function ScenarioBuilderPage() {
  const [isClient, setIsClient] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI);
  }, []);

  if (!isClient) {
    return (
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">테스트 시나리오 생성</h1>
          <p className="text-muted-foreground">
            단계별로 E2E 테스트 시나리오를 만들어보세요
          </p>
        </header>
        <div>클라이언트 초기화 중...</div>
      </div>
    );
  }

  if (!isElectron) {
    return (
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">테스트 시나리오 생성</h1>
          <p className="text-muted-foreground">
            단계별로 E2E 테스트 시나리오를 만들어보세요
          </p>
        </header>
        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded">
          이 기능은 Electron 데스크탑 앱에서만 사용할 수 있습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">테스트 시나리오 생성</h1>
        <p className="text-muted-foreground">
          단계별로 E2E 테스트 시나리오를 만들어보세요
        </p>
      </header>

      <ScenarioBuilder />
    </div>
  );
}

export default ScenarioBuilderPage;