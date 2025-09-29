"use client";

import { LoadingSkeleton, EmptyState } from "@/shared/components";
import { ScenarioItem } from "./scenario-item";
import { useScenarios, useScenarioActions } from "../hooks";

export function ScenarioList() {
  const { scenarios, isLoading, fetchScenarios, updateScenarioStatus } = useScenarios();
  const { isLoading: actionLoading, executeScenario, deleteScenario, debugScenario, editScenario } = useScenarioActions();

  const handleRun = async (scenarioId: string) => {
    try {
      console.log(`🚀 Executing scenario ${scenarioId}`);

      // 즉시 상태를 RUNNING으로 업데이트하여 UI 반영
      updateScenarioStatus(scenarioId, 'RUNNING');

      const result = await executeScenario(scenarioId);

      const statusMessage = result.success
        ? `✅ 테스트 실행 성공!\n실행 ID: ${result.executionId}`
        : `❌ 테스트 실행 실패!\n실행 ID: ${result.executionId}\n오류: ${result.error}`;

      alert(statusMessage);
    } catch (error) {
      alert(error instanceof Error ? error.message : "❌ 테스트 실행에 실패했습니다");
    } finally {
      // 항상 최신 상태로 새로고침
      fetchScenarios();
    }
  };

  const handleDelete = async (scenarioId: string) => {
    if (!confirm("정말로 이 시나리오를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteScenario(scenarioId);
      fetchScenarios();
    } catch (error) {
      alert(error instanceof Error ? error.message : "시나리오 삭제에 실패했습니다");
    }
  };

  const handleDebug = async (scenarioId: string) => {
    try {
      const result = await debugScenario(scenarioId);
      alert(`디버그 모드가 시작되었습니다!\n세션 ID: ${result.sessionId}\n\n브라우저에서 단계별로 테스트를 확인할 수 있습니다.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "디버그 모드 시작에 실패했습니다");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton count={3} />;
  }

  if (scenarios.length === 0) {
    return (
      <EmptyState
        title="아직 생성된 테스트 시나리오가 없습니다."
        description="왼쪽 폼을 사용하여 첫 번째 시나리오를 만들어보세요."
      />
    );
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => (
        <ScenarioItem
          key={scenario.id}
          scenario={scenario}
          isLoading={actionLoading}
          onRun={handleRun}
          onEdit={editScenario}
          onDebug={handleDebug}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}