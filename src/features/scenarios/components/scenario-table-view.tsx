"use client";

import { Play, Edit, Bug, Trash2, ExternalLink } from "lucide-react";
import { Button, Badge } from "@/shared/ui";
import { StatusBadge } from "@/shared/components";
import type { Scenario } from "@/shared/types";

interface ScenarioTableViewProps {
  scenarios: Scenario[];
  isLoading?: boolean;
  onRun: (scenarioId: string) => void;
  onEdit: (scenario: Scenario) => void;
  onDebug: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

export function ScenarioTableView({
  scenarios,
  isLoading = false,
  onRun,
  onEdit,
  onDebug,
  onDelete
}: ScenarioTableViewProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3 font-medium">시나리오</th>
              <th className="p-3 font-medium hidden sm:table-cell">URL</th>
              <th className="p-3 font-medium">상태</th>
              <th className="p-3 font-medium hidden md:table-cell">업데이트</th>
              <th className="p-3 font-medium w-24 sm:w-32">작업</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => {
              const isRunning = scenario.executions.length > 0 && scenario.executions[0].status === "RUNNING";

              return (
                <tr key={scenario.id} className="border-t hover:bg-muted/25">
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-sm sm:text-base">{scenario.name}</div>
                      {scenario.description && (
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {scenario.description}
                        </div>
                      )}
                      {/* 모바일에서 URL과 업데이트 정보 표시 */}
                      <div className="sm:hidden mt-2 space-y-1">
                        <div className="text-xs text-muted-foreground truncate">
                          {scenario.targetUrl}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(scenario.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground truncate max-w-48">
                        {scenario.targetUrl}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(scenario.targetUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    {scenario.executions.length > 0 ? (
                      <StatusBadge status={scenario.executions[0].status} />
                    ) : (
                      <Badge variant="secondary">대기중</Badge>
                    )}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {new Date(scenario.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => onRun(scenario.id)}
                        disabled={isLoading || isRunning}
                        title="실행"
                      >
                        <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => onEdit(scenario)}
                        title="편집"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:flex"
                        onClick={() => onDebug(scenario.id)}
                        disabled={isLoading}
                        title="디버그"
                      >
                        <Bug className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => onDelete(scenario.id)}
                        title="삭제"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}