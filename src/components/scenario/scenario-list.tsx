"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@/components/ui";
import { Play, Edit, Trash2, Clock, CheckCircle, XCircle, Bug } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  description?: string;
  targetUrl: string;
  createdAt: string;
  updatedAt: string;
  executions: Array<{
    id: string;
    status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
    startedAt: string;
  }>;
}

export function ScenarioList() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      console.log("🔄 Fetching scenarios...");
      const response = await fetch("/api/scenarios");
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Fetched scenarios:", data.map((s: any) => ({
          id: s.id,
          name: s.name,
          executionsCount: s.executions.length,
          latestExecution: s.executions[0] ? {
            id: s.executions[0].id,
            status: s.executions[0].status,
            startedAt: s.executions[0].startedAt
          } : null
        })));
        setScenarios(data);
      }
    } catch (error) {
      console.error("Failed to fetch scenarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "RUNNING":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "RUNNING":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRun = async (scenarioId: string) => {
    try {
      console.log(`🚀 Executing scenario ${scenarioId}`);

      // 즉시 상태를 RUNNING으로 업데이트하여 UI 반영
      setScenarios(prev => prev.map(scenario =>
        scenario.id === scenarioId
          ? {
              ...scenario,
              executions: [{
                id: 'temp-' + Date.now(),
                status: 'RUNNING' as const,
                startedAt: new Date().toISOString()
              }, ...scenario.executions]
            }
          : scenario
      ));

      const response = await fetch(`/api/scenarios/${scenarioId}/execute`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        const statusMessage = result.success
          ? `✅ 테스트 실행 성공!\n실행 ID: ${result.executionId}`
          : `❌ 테스트 실행 실패!\n실행 ID: ${result.executionId}\n오류: ${result.error}`;

        alert(statusMessage);
      } else {
        alert(`❌ 테스트 실행 실패: ${result.error}`);
      }
    } catch (error) {
      alert("❌ 테스트 실행에 실패했습니다");
      console.error(error);
    } finally {
      // 항상 최신 상태로 새로고침
      fetchScenarios();
    }
  };

  const handleEdit = (scenario: Scenario) => {
    router.push(`/scenario/edit/${scenario.id}`);
  };

  const handleDelete = async (scenarioId: string) => {
    if (!confirm("정말로 이 시나리오를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the scenarios list
        fetchScenarios();
      } else {
        const error = await response.json();
        alert(`시나리오 삭제 실패: ${error.error}`);
      }
    } catch (error) {
      alert("시나리오 삭제에 실패했습니다");
      console.error(error);
    }
  };

  const handleDebug = async (scenarioId: string) => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/debug`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(`디버그 모드가 시작되었습니다!\n세션 ID: ${result.sessionId}\n\n브라우저에서 단계별로 테스트를 확인할 수 있습니다.`);
      } else {
        const error = await response.json();
        alert(`디버그 시작 실패: ${error.error}`);
      }
    } catch (error) {
      alert("디버그 모드 시작에 실패했습니다");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>아직 생성된 테스트 시나리오가 없습니다.</p>
        <p className="text-sm">왼쪽 폼을 사용하여 첫 번째 시나리오를 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => {
        const isRunning = scenario.executions.length > 0 && scenario.executions[0].status === "RUNNING";

        return (
          <div key={scenario.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-medium">{scenario.name}</h3>
                {scenario.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {scenario.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {scenario.targetUrl}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {scenario.executions.length > 0 && (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(scenario.executions[0].status)}
                    <Badge
                      variant="secondary"
                      className={getStatusColor(scenario.executions[0].status)}
                    >
                      {scenario.executions[0].status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleRun(scenario.id)}
                disabled={isRunning}
              >
                <Play className="h-3 w-3 mr-1" />
                {isRunning ? "실행 중..." : "실행"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(scenario)}
                disabled={isRunning}
              >
                <Edit className="h-3 w-3 mr-1" />
                편집
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDebug(scenario.id)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                disabled={isRunning}
              >
                <Bug className="h-3 w-3 mr-1" />
                디버그
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(scenario.id)}
                disabled={isRunning}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                삭제
              </Button>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              업데이트: {new Date(scenario.updatedAt).toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}