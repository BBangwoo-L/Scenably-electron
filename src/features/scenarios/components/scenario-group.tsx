"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Globe } from "lucide-react";
import { Badge, Button } from "@/shared/ui";
import { ScenarioItem } from "./scenario-item";
import type { Scenario } from "@/shared/types";

interface ScenarioGroupProps {
  title: string;
  scenarios: Scenario[];
  isLoading?: boolean;
  onRun: (scenarioId: string) => void;
  onEdit: (scenario: Scenario) => void;
  onDebug: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

export function ScenarioGroup({
  title,
  scenarios,
  isLoading = false,
  onRun,
  onEdit,
  onDebug,
  onDelete
}: ScenarioGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const successCount = scenarios.filter(s =>
    s.executions.length > 0 && s.executions[0].status === "SUCCESS"
  ).length;

  const failedCount = scenarios.filter(s =>
    s.executions.length > 0 && s.executions[0].status === "FAILED"
  ).length;

  const runningCount = scenarios.filter(s =>
    s.executions.length > 0 && s.executions[0].status === "RUNNING"
  ).length;

  return (
    <div className="border rounded-lg">
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}

          <Globe className="h-4 w-4 text-muted-foreground" />

          <div className="text-left">
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {scenarios.length}개 시나리오
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              실행중 {runningCount}
            </Badge>
          )}
          {successCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              성공 {successCount}
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              실패 {failedCount}
            </Badge>
          )}
        </div>
      </Button>

      {isExpanded && (
        <div className="border-t">
          <div className="p-4 space-y-4">
            {scenarios.map((scenario) => (
              <ScenarioItem
                key={scenario.id}
                scenario={scenario}
                isLoading={isLoading}
                onRun={onRun}
                onEdit={onEdit}
                onDebug={onDebug}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}