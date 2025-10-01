"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Globe } from "lucide-react";
import { Badge, Button } from "@/shared/ui";
import { ScenarioItem } from "./scenario-item";
import type { ScenarioGroupProps } from "../lib";


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
        className="w-full justify-between p-3 sm:p-4 h-auto hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}

          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />

          <div className="text-left min-w-0 flex-1">
            <h3 className="font-medium text-sm sm:text-base truncate">{title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {scenarios.length}개 시나리오
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {runningCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-1 sm:px-2">
              <span className="hidden sm:inline">실행중 </span>{runningCount}
            </Badge>
          )}
          {successCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1 sm:px-2">
              <span className="hidden sm:inline">성공 </span>{successCount}
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs px-1 sm:px-2">
              <span className="hidden sm:inline">실패 </span>{failedCount}
            </Badge>
          )}
        </div>
      </Button>

      {isExpanded && (
        <div className="border-t">
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
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