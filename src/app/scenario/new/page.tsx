"use client";

import { Suspense } from "react";
import { ScenarioBuilder } from "@/components/scenario/scenario-builder";

function ScenarioBuilderPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">테스트 시나리오 생성</h1>
        <p className="text-muted-foreground">
          단계별로 E2E 테스트 시나리오를 만들어보세요
        </p>
      </header>

      <Suspense fallback={<div>로딩 중...</div>}>
        <ScenarioBuilder />
      </Suspense>
    </div>
  );
}

export default ScenarioBuilderPage;