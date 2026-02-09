import { Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@/shared/ui";
import type { ScenarioData } from "../hooks";

interface ScenarioInfoFormProps {
  scenarioData: ScenarioData;
  onUpdate: (updates: Partial<ScenarioData>) => void;
}

export function ScenarioInfoForm({ scenarioData, onUpdate }: ScenarioInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>시나리오 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">시나리오 이름 *</Label>
          <Input
            id="name"
            placeholder="예: 로그인 플로우 테스트"
            value={scenarioData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">설명</Label>
          <Textarea
            id="description"
            placeholder="이 테스트 시나리오가 무엇을 검증하는지 설명해주세요..."
            value={scenarioData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetUrl">대상 URL *</Label>
          <Input
            id="targetUrl"
            value={scenarioData.targetUrl}
            onChange={(e) => onUpdate({ targetUrl: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}