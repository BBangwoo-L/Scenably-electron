import { Balloon } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@/shared/ui";
import type { ScenarioData } from "../hooks";

interface ScenarioInfoFormProps {
  scenarioData: ScenarioData;
  onUpdate: (updates: Partial<ScenarioData>) => void;
  errors?: {
    name?: string;
    targetUrl?: string;
  };
  inputRefs?: {
    name?: React.RefObject<HTMLInputElement>;
    targetUrl?: React.RefObject<HTMLInputElement>;
  };
  onClearError?: (field: "name" | "targetUrl") => void;
}

export function ScenarioInfoForm({
  scenarioData,
  onUpdate,
  errors,
  inputRefs,
  onClearError
}: ScenarioInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>시나리오 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5 relative">
          <Label htmlFor="name">시나리오 이름 *</Label>
          <Input
            id="name"
            placeholder="예: 로그인 플로우 테스트"
            value={scenarioData.name}
            aria-invalid={!!errors?.name}
            ref={inputRefs?.name}
            onChange={(e) => {
              onUpdate({ name: e.target.value });
              if (errors?.name) onClearError?.("name");
            }}
          />
          <Balloon
            open={!!errors?.name}
            positionClassName="left-0 top-full mt-2"
            align="left"
            className="w-[260px] text-destructive"
          >
            {errors?.name}
          </Balloon>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">설명</Label>
          <Textarea
            id="description"
            placeholder="이 테스트 시나리오가 무엇을 검증하는지 설명해주세요..."
            value={scenarioData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>

        <div className="space-y-1.5 relative">
          <Label htmlFor="targetUrl">대상 URL *</Label>
          <Input
            id="targetUrl"
            placeholder="예: https://example.com"
            value={scenarioData.targetUrl}
            aria-invalid={!!errors?.targetUrl}
            ref={inputRefs?.targetUrl}
            onChange={(e) => {
              onUpdate({ targetUrl: e.target.value });
              if (errors?.targetUrl) onClearError?.("targetUrl");
            }}
          />
          <Balloon
            open={!!errors?.targetUrl}
            positionClassName="left-0 top-full mt-2"
            align="left"
            className="w-[260px] text-destructive"
          >
            {errors?.targetUrl}
          </Balloon>
        </div>
      </CardContent>
    </Card>
  );
}
