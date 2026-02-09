"use client";

import { useState, useMemo } from "react";
import { LoadingSkeleton, EmptyState } from "@/shared/components";
import { ScenarioItem } from "./scenario-item";
import { ScenarioGroup } from "./scenario-group";
import { ScenarioTableView } from "./scenario-table-view";
import { ScenarioFilterBar } from "./scenario-filter-bar";
import { useScenarios, useScenarioActions } from "../hooks";
import { type ViewModeOption } from "@/shared/lib";
import { filterScenarios, sortScenarios, groupScenarios, type ScenarioFilterOptions, type ScenarioGroupByOption } from "../lib";
import { useConfirmModalStore } from "@/stores/confirm-modal-store";
import { useToastStore } from "@/stores/toast-store";

export function ScenarioList() {
  const { scenarios, isLoading, fetchScenarios, updateScenarioStatus } = useScenarios();
  const { isLoading: actionLoading, executeScenario, deleteScenario, debugScenario, editScenario } = useScenarioActions();
  const { openConfirmModal } = useConfirmModalStore();
  const { showToast } = useToastStore();

  const [filters, setFilters] = useState<ScenarioFilterOptions>({
    search: "",
    status: "all",
    category: "all",
    sortBy: "updatedAt",
    sortOrder: "desc" as "asc" | "desc"
  });

  const [groupBy, setGroupBy] = useState<ScenarioGroupByOption>("domain");
  const [viewMode, setViewMode] = useState<ViewModeOption>("card");

  const filteredAndSortedScenarios = useMemo(() => {
    const filtered = filterScenarios(scenarios, filters);
    return sortScenarios(filtered, filters.sortBy, filters.sortOrder);
  }, [scenarios, filters]);

  const groupedScenarios = useMemo(() => {
    return groupScenarios(filteredAndSortedScenarios, groupBy);
  }, [filteredAndSortedScenarios, groupBy]);

  const handleRun = async (scenarioId: string) => {
    try {
      console.log(`🚀 Executing scenario ${scenarioId}`);

      // 즉시 상태를 RUNNING으로 업데이트하여 UI 반영
      updateScenarioStatus(scenarioId, 'RUNNING');

      await executeScenario(scenarioId);

      showToast({
        title: "실행 시작",
        message: "백그라운드에서 테스트를 실행 중입니다. 완료 시 자동으로 결과가 반영됩니다.",
        type: "info",
        duration: 3000
      });
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "❌ 테스트 실행에 실패했습니다" });
      fetchScenarios();
    }
  };

  const handleDelete = async (scenarioId: string) => {
    const confirmed = await openConfirmModal({ message: "정말로 이 시나리오를 삭제하시겠습니까?", isAlert: false });
    if (!confirmed) return;

    try {
      await deleteScenario(scenarioId);
      fetchScenarios();
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "시나리오 삭제에 실패했습니다" });
    }
  };

  const handleDebug = async (scenarioId: string) => {
    try {
      const result = await debugScenario(scenarioId);
      await openConfirmModal({ message: `디버그 모드가 정상적으로 종료 됐습니다.!\n세션 ID: ${result.sessionId}` });
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "디버그 모드가 실패했습니다.\n 프로세스를 한 단계씩 진행하면서 실패 지점을 찾아보세요!" });
    }
  };

  if (isLoading) {
    return <LoadingSkeleton count={3} />;
  }

  if (scenarios.length === 0) {
    return (
      <EmptyState
        title="아직 생성된 테스트 시나리오가 없습니다."
        description="'새 시나리오 생성' 버튼을 클릭하여 첫 번째 시나리오를 만들어보세요."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ScenarioFilterBar
        onFilterChange={setFilters}
        onGroupByChange={setGroupBy}
        onViewModeChange={setViewMode}
        viewMode={viewMode}
        totalCount={scenarios.length}
        filteredCount={filteredAndSortedScenarios.length}
      />

      {filteredAndSortedScenarios.length === 0 ? (
        <EmptyState
          title="검색 조건에 맞는 시나리오가 없습니다."
          description="다른 검색어나 필터를 시도해보세요."
        />
      ) : viewMode === "table" ? (
        <ScenarioTableView
          scenarios={filteredAndSortedScenarios}
          isLoading={actionLoading}
          onRun={handleRun}
          onEdit={editScenario}
          onDebug={handleDebug}
          onDelete={handleDelete}
        />
      ) : groupedScenarios ? (
        <div className="space-y-4">
          {Object.entries(groupedScenarios).map(([groupName, groupScenarios]) => (
            <ScenarioGroup
              key={groupName}
              title={groupName}
              scenarios={groupScenarios}
              isLoading={actionLoading}
              onRun={handleRun}
              onEdit={editScenario}
              onDebug={handleDebug}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedScenarios.map((scenario) => (
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
      )}
    </div>
  );
}
