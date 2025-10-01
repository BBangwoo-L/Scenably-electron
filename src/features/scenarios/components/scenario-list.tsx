"use client";

import { useState, useMemo } from "react";
import { LoadingSkeleton, EmptyState } from "@/shared/components";
import { ScenarioItem } from "./scenario-item";
import { ScenarioGroup } from "./scenario-group";
import { ScenarioTableView } from "./scenario-table-view";
import { ScenarioFilterBar } from "./scenario-filter-bar";
import { useScenarios, useScenarioActions } from "../hooks";

export function ScenarioList() {
  const { scenarios, isLoading, fetchScenarios, updateScenarioStatus } = useScenarios();
  const { isLoading: actionLoading, executeScenario, deleteScenario, debugScenario, editScenario } = useScenarioActions();

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
    sortBy: "updatedAt",
    sortOrder: "desc" as "asc" | "desc"
  });

  const [groupBy, setGroupBy] = useState<"none" | "domain" | "status">("domain");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const filteredAndSortedScenarios = useMemo(() => {
    let filtered = scenarios.filter((scenario) => {
      const matchesSearch = filters.search === "" ||
        scenario.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        scenario.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        scenario.targetUrl.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === "all" ||
        (scenario.executions.length > 0 && scenario.executions[0].status === filters.status);

      return matchesSearch && matchesStatus;
    });

    // 정렬 적용
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "status":
          aValue = a.executions.length > 0 ? a.executions[0].status : "PENDING";
          bValue = b.executions.length > 0 ? b.executions[0].status : "PENDING";
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "updatedAt":
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [scenarios, filters]);

  const groupedScenarios = useMemo(() => {
    if (groupBy === "none") {
      return null;
    }

    const groups: Record<string, typeof filteredAndSortedScenarios> = {};

    filteredAndSortedScenarios.forEach((scenario) => {
      let groupKey: string;

      if (groupBy === "domain") {
        try {
          const url = new URL(scenario.targetUrl);
          groupKey = url.hostname;
        } catch {
          groupKey = "잘못된 URL";
        }
      } else if (groupBy === "status") {
        groupKey = scenario.executions.length > 0
          ? scenario.executions[0].status
          : "PENDING";
      } else {
        groupKey = "기타";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(scenario);
    });

    return groups;
  }, [filteredAndSortedScenarios, groupBy]);

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