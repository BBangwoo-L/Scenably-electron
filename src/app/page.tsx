import { ScenarioList, QuickStartGuide } from "@/features/scenarios/components";
import { Button } from "@/shared/ui";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm sm:text-base">
              AI 도움으로 웹사이트 E2E 테스트를 생성, 관리, 실행하세요
            </p>
          </div>
          <Link to="/scenario/new" className="w-full sm:w-auto">
            <Button className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">새 시나리오 생성</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="mb-8">
        <ScenarioList />
      </div>

      <div className="mt-8">
        <QuickStartGuide />
      </div>
    </div>
  );
}
