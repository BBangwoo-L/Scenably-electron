import { LoadingButton } from "@/shared/components";
import { Play, Edit, Trash2, Bug } from "lucide-react";
import {Scenario} from "@/features/scenarios";


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
    <div className="flex flex-wrap items-center gap-2 mt-3">
      <LoadingButton
        size="sm"
        variant="outline"
        onClick={() => onRun(scenario.id)}
        disabled={isRunning}
        isLoading={isRunning}
        loadingText="실행 중..."
        icon={<Play className="h-3 w-3" />}
        className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-shrink-0"
      >
        <span className="hidden sm:inline">실행</span>
      </LoadingButton>

      <LoadingButton
        size="sm"
        variant="outline"
        onClick={() => onEdit(scenario)}
        disabled={isRunning || isLoading}
        icon={<Edit className="h-3 w-3" />}
        className="flex-shrink-0"
      >
        <span className="hidden sm:inline">편집</span>
      </LoadingButton>

      <LoadingButton
        size="sm"
        variant="outline"
        onClick={() => onDebug(scenario.id)}
        className="text-green-600 border-green-200 hover:bg-green-50 flex-shrink-0"
        disabled={isRunning || isLoading}
        icon={<Bug className="h-3 w-3" />}
      >
        <span className="hidden sm:inline">디버그</span>
      </LoadingButton>

      <LoadingButton
        size="sm"
        variant="outline"
        onClick={() => onDelete(scenario.id)}
        disabled={isRunning || isLoading}
        icon={<Trash2 className="h-3 w-3" />}
        className="text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
      >
        <span className="hidden sm:inline">삭제</span>
      </LoadingButton>
    </div>
  );
}