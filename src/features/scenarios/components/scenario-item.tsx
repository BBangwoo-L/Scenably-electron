import {StatusBadge} from "@/shared/components";
import {ActionButtonGroup} from "@/features/scenarios";
import type {Scenario} from "@/shared/types";

interface ScenarioItemProps {
  scenario: Scenario;
  isLoading?: boolean;
  onRun: (scenarioId: string) => void;
  onEdit: (scenario: Scenario) => void;
  onDebug: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

export function ScenarioItem({
  scenario,
  isLoading = false,
  onRun,
  onEdit,
  onDebug,
  onDelete
}: ScenarioItemProps) {
  const isRunning = scenario.executions.length > 0 && scenario.executions[0].status === "RUNNING";

  return (
    <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
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
            <StatusBadge status={scenario.executions[0].status} />
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

      <div className="text-xs text-muted-foreground mt-2">
        업데이트: {new Date(scenario.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}