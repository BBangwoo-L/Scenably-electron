"use client";

import { useScenarioBuilder } from "../hooks";
import { useRecording } from "@/features/recording/hooks";
import { ScenarioInfoForm } from "./scenario-info-form";
import { RecordingControls } from "@/features/recording/components";
import { CodeEditor } from "./code-editor";
import { useConfirmModalStore } from "@/stores/confirm-modal-store";

interface ScenarioBuilderProps {
  scenarioId?: string;
}

export function ScenarioBuilder({ scenarioId }: ScenarioBuilderProps) {
  const {
    scenarioData,
    isLoading: builderLoading,
    updateScenarioData,
    saveScenario,
    modifyWithAI,
    executeTest,
    navigateHome
  } = useScenarioBuilder(undefined, scenarioId);

  const {
    recordingMode,
    recordingSession,
    isLoading: recordingLoading,
    setRecordingMode,
    startRecording,
    stopRecording,
    cancelRecording,
    forceReset
  } = useRecording();

  const { openConfirmModal, openPromptModal } = useConfirmModalStore();

  const isLoading = builderLoading || recordingLoading;

  const handleSave = async () => {
    try {
      await saveScenario();
      navigateHome();
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "Failed to save scenario" });
    }
  };

  const handleAiModify = async () => {
    const modificationRequest = await openPromptModal({
      message: "테스트 시나리오를 어떻게 수정하고 싶은지 설명해주세요:\n(예: '로그인 테스트 추가', '특정 텍스트 확인', '폼 유효성 검사 추가')"
    });

    if (!modificationRequest) return;

    try {
      const result = await modifyWithAI(modificationRequest);
      await openConfirmModal({ message: `코드가 성공적으로 수정되었습니다!\n\n설명: ${result.explanation}` });
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "AI 수정에 실패했습니다" });
    }
  };

  const handleStartRecording = async () => {
    try {
      const result = await startRecording(scenarioData.targetUrl);

      if (result.mode === 'headless') {
        updateScenarioData({ code: result.code });
        await openConfirmModal({ message: "인터랙티브 코드 템플릿이 생성되었습니다! 이제 테스트 단계를 커스터마이징할 수 있습니다." });
      } else {
        const defaultName = scenarioData.name.trim() || `Recording ${new Date().toLocaleString()}`;
        updateScenarioData({ name: defaultName });
        await openConfirmModal({ message: "레코딩이 시작되었습니다! 브라우저 창이 열렸습니다. 웹사이트와 상호작용하여 테스트 시나리오를 레코딩하세요." });
      }
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "레코딩 시작에 실패했습니다" });
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await stopRecording(true);

      if (result.code) {
        updateScenarioData({ code: result.code });
        await openConfirmModal({ message: "레코딩이 중지되고 코드가 생성되었습니다! 시나리오 이름을 입력한 후 '저장' 버튼을 클릭하세요." });
      } else {
        await openConfirmModal({ message: "레코딩이 중지되었지만 코드 생성에 실패했습니다. 다시 시도해주세요." });
      }
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "레코딩 중지에 실패했습니다" });
    }
  };

  const handleCancelRecording = async () => {
    const confirmed = await openConfirmModal({ message: "레코딩을 취소하시겠습니까? 지금까지의 레코딩 내용은 저장되지 않습니다.", isAlert: false });
    if (confirmed) {
      try {
        await cancelRecording();
        await openConfirmModal({ message: "레코딩이 취소되었습니다." });
      } catch (error) {
        await openConfirmModal({ message: error instanceof Error ? error.message : "레코딩 취소에 실패했습니다" });
      }
    }
  };

  const handleForceReset = async () => {
    const confirmed = await openConfirmModal({ message: "강제로 레코딩 상태를 리셋하시겠습니까? 백그라운드 프로세스는 수동으로 종료해야 할 수 있습니다.", isAlert: false });
    if (confirmed) {
      forceReset();
      await openConfirmModal({ message: "레코딩 상태가 강제로 리셋되었습니다." });
    }
  };

  const handleTestRun = async () => {
    try {
      const result = await executeTest();
      await openConfirmModal({ message: `Test execution started!\nExecution ID: ${result.executionId}\nStatus: ${result.status}` });
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "Failed to run test" });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Scenario Details */}
      <div className="space-y-6">
        <ScenarioInfoForm
          scenarioData={scenarioData}
          onUpdate={updateScenarioData}
        />

        <RecordingControls
          recordingMode={recordingMode}
          recordingSession={recordingSession}
          isLoading={isLoading}
          onModeChange={setRecordingMode}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onCancelRecording={handleCancelRecording}
          onForceReset={handleForceReset}
          onSave={handleSave}
          onAiModify={handleAiModify}
          onTestRun={handleTestRun}
          onNavigateHome={navigateHome}
        />
      </div>

      {/* Right Column - Code Preview */}
      <div>
        <CodeEditor
          scenarioData={scenarioData}
          onUpdate={updateScenarioData}
        />
      </div>
    </div>
  );
}
