import { useEffect, useMemo, useRef, useState } from "react";
import { Balloon } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@/shared/ui";
import { Link } from "react-router-dom";
import { Link as LinkIcon } from "lucide-react";
import type { ScenarioData } from "../hooks";

interface ScenarioInfoFormProps {
  scenarioData: ScenarioData;
  onUpdate: (updates: Partial<ScenarioData>) => void;
  existingUrls?: string[];
  errors?: {
    name?: string;
    targetUrl?: string;
  };
  inputRefs?: {
    name?: React.RefObject<HTMLInputElement>;
    targetUrl?: React.RefObject<HTMLInputElement>;
  };
  onClearError?: (field: "name" | "targetUrl") => void;
  scheduleId?: string;
}

export function ScenarioInfoForm({
  scenarioData,
  onUpdate,
  existingUrls = [],
  errors,
  inputRefs,
  onClearError,
  scheduleId
}: ScenarioInfoFormProps) {
  const [isUrlSuggestionOpen, setIsUrlSuggestionOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredUrlSuggestions = useMemo(() => {
    const currentValue = scenarioData.targetUrl.trim().toLowerCase();
    const suggestions = existingUrls.filter((url) => {
      const normalized = url.trim().toLowerCase();
      if (!normalized) {
        return false;
      }
      if (normalized === currentValue) {
        return false;
      }
      if (!currentValue) {
        return true;
      }
      return normalized.includes(currentValue);
    });

    return suggestions.slice(0, 6);
  }, [existingUrls, scenarioData.targetUrl]);

  const clearCloseTimeout = () => {
    if (!closeTimeoutRef.current) {
      return;
    }
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };

  const handleSuggestionBlur = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setIsUrlSuggestionOpen(false);
    }, 120);
  };

  const handleSuggestionFocus = () => {
    clearCloseTimeout();
    setIsUrlSuggestionOpen(true);
  };

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>시나리오 정보</CardTitle>
          {scheduleId && (
            <Link
              to={`/schedules/${scheduleId}`}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <LinkIcon className="h-3 w-3" />
              스케줄 보기
            </Link>
          )}
        </div>
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
            autoComplete="off"
            onChange={(e) => {
              onUpdate({ targetUrl: e.target.value });
              if (errors?.targetUrl) onClearError?.("targetUrl");
              if (!isUrlSuggestionOpen) {
                setIsUrlSuggestionOpen(true);
              }
            }}
            onFocus={handleSuggestionFocus}
            onBlur={handleSuggestionBlur}
          />
          {isUrlSuggestionOpen && filteredUrlSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-10 overflow-hidden rounded-md border bg-popover shadow-md">
              <ul className="max-h-52 overflow-y-auto py-1">
                {filteredUrlSuggestions.map((url) => (
                  <li key={url}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onUpdate({ targetUrl: url });
                        if (errors?.targetUrl) onClearError?.("targetUrl");
                        setIsUrlSuggestionOpen(false);
                      }}
                    >
                      {url}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
