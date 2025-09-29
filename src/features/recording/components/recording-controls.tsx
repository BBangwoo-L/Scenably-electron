import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";
import { LoadingButton } from "@/shared/components";
import { Video, Code2, Zap, Wand2, Save, Play, ArrowLeft } from "lucide-react";
import type { RecordingMode, RecordingSession } from "@/shared/types";

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
  onAiModify: () => void;
  onTestRun: () => void;
  onNavigateHome: () => void;
}

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
  onAiModify,
  onTestRun,
  onNavigateHome
}: RecordingControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>레코딩 및 액션</CardTitle>
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
            <p className="text-sm text-muted-foreground">
              일반적인 테스트 패턴이 포함된 인터랙티브 코드 템플릿을 생성합니다
            </p>
            <LoadingButton
              onClick={onStartRecording}
              isLoading={isLoading}
              className="w-full"
              icon={<Zap className="h-4 w-4" />}
            >
              인터랙티브 템플릿 생성
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
                  🔴 레코딩 진행 중...
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
            onClick={onAiModify}
            variant="outline"
            className="w-full"
            isLoading={isLoading}
            icon={<Wand2 className="h-4 w-4" />}
          >
            AI로 수정하기
          </LoadingButton>

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
            icon={<Play className="h-4 w-4" />}
          >
            테스트 실행
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