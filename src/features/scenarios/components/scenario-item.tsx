import { useState } from "react";
import { StatusBadge } from "@/shared/components";
import { ActionButtonGroup } from "@/features/scenarios";
import { ExecutionDetailDialog } from "./execution-detail-dialog";
import type { ScenarioItemProps } from "../lib";


export function ScenarioItem({
  scenario,
  isLoading = false,
  onRun,
  onEdit,
  onDebug,
  onDelete
}: ScenarioItemProps) {
  const isRunning = scenario.executions.length > 0 && scenario.executions[0].status === "RUNNING";
  const [detailOpen, setDetailOpen] = useState(false);

  const latestExecution = scenario.executions.length > 0 ? scenario.executions[0] : null;
  const canShowDetail = latestExecution && (latestExecution.status === 'SUCCESS' || latestExecution.status === 'FAILED');

  return (
    <div className="p-3 sm:p-4 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2 sm:mb-0">
            <h3 className="font-medium text-sm sm:text-base pr-2">{scenario.name}</h3>
            <div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
              {latestExecution && (
                <div
                  className={canShowDetail ? "cursor-pointer" : ""}
                  onClick={canShowDetail ? () => setDetailOpen(true) : undefined}
                >
                  <StatusBadge status={latestExecution.status} />
                </div>
              )}
            </div>
          </div>
          {scenario.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {scenario.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {scenario.targetUrl}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 ml-4">
          {latestExecution && (
            <div
              className={canShowDetail ? "cursor-pointer" : ""}
              onClick={canShowDetail ? () => setDetailOpen(true) : undefined}
            >
              <StatusBadge status={latestExecution.status} />
            </div>
          )}
        </div>
      </div>

      <ActionButtonGroup
        scenario={scenario}
        isRunning={isRunning}
        isLoading={isLoading}
        onRun={onRun}
        onEdit={onEdit}
        onDebug={onDebug}
        onDelete={onDelete}
      />

      <div className="text-xs text-muted-foreground mt-2 flex justify-between items-center">
        <span>업데이트: {new Date(scenario.updatedAt).toLocaleDateString()}</span>
      </div>

      {latestExecution && (
        <ExecutionDetailDialog
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          execution={latestExecution}
        />
      )}
    </div>
  );
}
