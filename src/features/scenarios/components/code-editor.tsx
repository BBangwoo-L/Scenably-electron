import { Card, CardContent, CardHeader, CardTitle, Label, Textarea } from "@/shared/ui";
import type { ScenarioData } from "../hooks";

interface CodeEditorProps {
  scenarioData: ScenarioData;
  onUpdate: (updates: Partial<ScenarioData>) => void;
}

export function CodeEditor({ scenarioData, onUpdate }: CodeEditorProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>E2E 테스트 코드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="code">테스트 스크립트</Label>
          <Textarea
            id="code"
            value={scenarioData.code}
            onChange={(e) => onUpdate({ code: e.target.value })}
            className="font-mono text-sm min-h-[500px]"
            placeholder="E2E 테스트 코드를 여기에 입력하세요..."
          />
        </div>
      </CardContent>
    </Card>
  );
}