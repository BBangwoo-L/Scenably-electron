import { LoadingButton } from "@/shared/components";
import { Play, Edit, Trash2, Bug } from "lucide-react";
import type { Scenario } from "@/shared/types";

interface ActionButtonGroupProps {
  scenario: Scenario;
  isRunning?: boolean;
  isLoading?: boolean;
  onRun: (scenarioId: string) => void;
  onEdit: (scenario: Scenario) => void;
  onDebug: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

export function ActionButtonGroup({
  scenario,
  isRunning = false,
  isLoading = false,
  onRun,
  onEdit,
  onDebug,
  onDelete
}: ActionButtonGroupProps) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <LoadingButton
        size="sm"
        variant="default"
        onClick={() => onRun(scenario.id)}
        disabled={isRunning}
        isLoading={isRunning}
        loadingText="실행 중..."
        icon={<Play className="h-3 w-3" />}
      >
        실행
      </LoadingButton>

      <LoadingButton
        size="sm"
        variant="outline"
        onClick={() => onEdit(scenario)}
        disabled={isRunning || isLoading}
        icon={<Edit className="h-3 w-3" />}
      >
        편집
      </LoadingButton>

      <LoadingButton
        size="sm"
        variant="outline"
        onClick={() => onDebug(scenario.id)}
        className="text-blue-600 border-blue-200 hover:bg-blue-50"
        disabled={isRunning || isLoading}
        icon={<Bug className="h-3 w-3" />}
      >
        디버그
      </LoadingButton>

      <LoadingButton
        size="sm"
        variant="outline"
        onClick={() => onDelete(scenario.id)}
        disabled={isRunning || isLoading}
        icon={<Trash2 className="h-3 w-3" />}
      >
        삭제
      </LoadingButton>
    </div>
  );
}