import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";
import { Balloon, LoadingButton } from "@/shared/components";
import { Video, Code2, Save, Bug, ArrowLeft, FileCode, HelpCircle } from "lucide-react";
import type { RecordingMode, RecordingSession } from "@/features/recording";
interface RecordingControlsProps {
  recordingMode: RecordingMode;
  recordingSession: RecordingSession | null;
  isLoading: boolean;
  onModeChange: (mode: RecordingMode) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onForceReset: () => void;
  onSave: () => void;
  onTestRun: () => void;
  onNavigateHome: () => void;
  onApplyTemplate?: () => void;
}

const TEMPLATE_CODE = `import { test, expect } from '@playwright/test';

test('시나리오 이름을 입력하세요', async ({ page }) => {
  // 1. 페이지 이동
  await page.goto('https://example.com');

  // 2. 요소 클릭
  // await page.click('selector');

  // 3. 텍스트 입력
  // await page.fill('input[name="username"]', '사용자이름');

  // 4. 요소가 보이는지 확인
  // await expect(page.locator('selector')).toBeVisible();

  // 5. 텍스트 내용 확인
  // await expect(page.locator('selector')).toHaveText('예상 텍스트');
});
`;

export function RecordingControls({
  recordingMode,
  recordingSession,
  isLoading,
  onModeChange,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onForceReset,
  onSave,
  onTestRun,
  onNavigateHome,
  onApplyTemplate
}: RecordingControlsProps) {
  const [showCommands, setShowCommands] = useState(false);
  const [isClosingCommands, setIsClosingCommands] = useState(false);
  const commandsRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCommands = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsClosingCommands(false);
    setShowCommands(true);
  };

  const closeCommands = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setIsClosingCommands(true);
    closeTimerRef.current = setTimeout(() => {
      setShowCommands(false);
      setIsClosingCommands(false);
      closeTimerRef.current = null;
    }, 180);
  };

  useEffect(() => {
    if (!showCommands) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!commandsRef.current) return;
      if (!commandsRef.current.contains(event.target as Node)) {
        closeCommands();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showCommands]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>코드 작성 및 액션</CardTitle>
        <div className="relative" ref={commandsRef}>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-muted-foreground/30 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/60"
            onClick={() => {
              if (showCommands) {
                closeCommands();
              } else {
                openCommands();
              }
            }}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            안내
          </button>

          <Balloon
            open={showCommands && !isClosingCommands}
            positionClassName="right-0 top-full mt-2"
            align="right"
            className="w-[320px]"
          >
            <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
              <li>
                <span className="font-semibold text-foreground">레코딩</span>은 한 번 테스트했던 시나리오를
                <span className="font-semibold text-foreground"> 다시 실행</span>시키는 기능입니다.
              </li>
              <li>
                메인 화면에서 여러 개를 <span className="font-semibold text-foreground">한 번에 실행</span>하거나,
                <span className="font-semibold text-foreground"> 디버그 모드</span>로 브라우저를 직접 보면서 테스트를 진행할 수 있습니다.
              </li>
              <li>
                비슷한 시나리오가 필요하면 코드를 복사해 일부만 수정할 수 있는
                <span className="font-semibold text-foreground"> 템플릿 모드</span>를 활용하세요.
              </li>
            </ul>
          </Balloon>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={recordingMode} onValueChange={(value) => onModeChange(value as RecordingMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="headless">
              <Code2 className="mr-2 h-4 w-4" />
              템플릿
            </TabsTrigger>
            <TabsTrigger value="interactive">
              <Video className="mr-2 h-4 w-4" />
              레코딩
            </TabsTrigger>
          </TabsList>

          <TabsContent value="headless" className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Playwright 테스트 코드를 직접 작성합니다. 템플릿을 적용하면 기본 구조가 코드 에디터에 삽입됩니다.</p>
            </div>
            <LoadingButton
              onClick={onApplyTemplate}
              className="w-full"
              variant="outline"
              icon={<FileCode className="h-4 w-4" />}
            >
              기본 템플릿 적용
            </LoadingButton>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              브라우저를 열고 실제 상호작용을 레코딩하여 테스트 코드를 생성합니다
            </p>
            {!recordingSession ? (
              <LoadingButton
                onClick={onStartRecording}
                isLoading={isLoading}
                className="w-full"
                icon={<Video className="h-4 w-4" />}
              >
                레코딩 시작
              </LoadingButton>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center p-2 bg-red-50 text-red-700 rounded-md text-sm">
                  레코딩 진행 중...
                </div>
                <div className="flex gap-2">
                  <LoadingButton
                    onClick={onStopRecording}
                    isLoading={isLoading}
                    variant="default"
                    className="flex-1"
                  >
                    저장 후 중지
                  </LoadingButton>
                  <LoadingButton
                    onClick={onCancelRecording}
                    isLoading={isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </LoadingButton>
                </div>
                <LoadingButton
                  onClick={onForceReset}
                  variant="ghost"
                  className="w-full text-xs text-gray-500"
                >
                  강제 리셋
                </LoadingButton>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t pt-3 space-y-3">
          <LoadingButton
            onClick={onSave}
            isLoading={isLoading}
            className="w-full"
            loadingText="저장 중..."
            icon={<Save className="h-4 w-4" />}
          >
            시나리오 저장
          </LoadingButton>

          <LoadingButton
            onClick={onTestRun}
            variant="outline"
            className="w-full"
            isLoading={isLoading}
            icon={<Bug className="h-4 w-4" />}
          >
            디버그 모드 실행
          </LoadingButton>

          <LoadingButton
            onClick={onNavigateHome}
            variant="ghost"
            className="w-full"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            대시보드로 돌아가기
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
}

export { TEMPLATE_CODE };
