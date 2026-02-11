"use client";

import { useEffect, useRef, useState } from "react";
import { useScenarioBuilder } from "../hooks";
import { useRecording } from "@/features/recording/hooks";
import { ScenarioInfoForm } from "./scenario-info-form";
import { RecordingControls, TEMPLATE_CODE } from "@/features/recording/components";
import { CodeEditor } from "./code-editor";
import { useConfirmModalStore } from "@/stores/confirm-modal-store";
import { ScheduleService, ScenarioService } from "@/features/scenarios/services";
import { isElectron } from "@/shared/lib/electron-api-client";

interface ScenarioBuilderProps {
  scenarioId?: string;
}

export function ScenarioBuilder({ scenarioId }: ScenarioBuilderProps) {
  const {
    scenarioData,
    isLoading: builderLoading,
    updateScenarioData,
    saveScenario,
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

  const { openConfirmModal } = useConfirmModalStore();

  const isLoading = builderLoading || recordingLoading;
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; targetUrl?: string }>({});
  const nameInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [scheduleId, setScheduleId] = useState<string | undefined>(undefined);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!scenarioId || !isElectron) {
      setScheduleId(undefined);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const schedule = await ScheduleService.getByScenarioId(scenarioId);
        if (mounted) setScheduleId(schedule?.id);
      } catch {
        if (mounted) setScheduleId(undefined);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [scenarioId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const scenarios = await ScenarioService.getAll();
        if (!mounted) {
          return;
        }
        const uniqueUrls = Array.from(
          new Set(
            scenarios
              .map((scenario) => scenario.targetUrl?.trim())
              .filter((url): url is string => Boolean(url))
          )
        );
        setExistingUrls(uniqueUrls);
      } catch {
        if (mounted) {
          setExistingUrls([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const clearFieldError = (field: "name" | "targetUrl") => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const ensureRequiredFields = (options: { name?: boolean; targetUrl?: boolean }) => {
    const nextErrors: { name?: string; targetUrl?: string } = {};

    if (options.name && !scenarioData.name.trim()) {
      nextErrors.name = "시나리오 이름을 입력해주세요.";
    }
    if (options.targetUrl && !scenarioData.targetUrl.trim()) {
      nextErrors.targetUrl = "대상 URL을 입력해주세요.";
    }

    const hasErrors = Object.keys(nextErrors).length > 0;
    if (hasErrors) {
      setFieldErrors(nextErrors);
      if (nextErrors.name) {
        nameInputRef.current?.focus();
      } else if (nextErrors.targetUrl) {
        urlInputRef.current?.focus();
      }
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!ensureRequiredFields({ name: true, targetUrl: true })) {
      return;
    }
    try {
      await saveScenario();
      navigateHome();
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "Failed to save scenario" });
    }
  };

  const handleApplyTemplate = () => {
    updateScenarioData({ code: TEMPLATE_CODE });
  };

  const handleStartRecording = async () => {
    if (!ensureRequiredFields({ targetUrl: true })) {
      return;
    }

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
    try {
      await cancelRecording();
      await openConfirmModal({ message: "레코딩이 취소되었습니다." });
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "레코딩 취소에 실패했습니다" });
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
    if (!ensureRequiredFields({ name: true, targetUrl: true })) {
      return;
    }
    try {
      const result = await executeTest();
      await openConfirmModal({ message: `테스트 실행이 시작되었습니다!\n실행 ID: ${result.executionId}\n상태: ${result.status}` });
    } catch (error) {
      await openConfirmModal({ message: error instanceof Error ? error.message : "테스트 실행에 실패했습니다" });
    }
  };


  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Scenario Details */}
      <div className="space-y-6">
        <ScenarioInfoForm
          scenarioData={scenarioData}
          onUpdate={updateScenarioData}
          errors={fieldErrors}
          inputRefs={{ name: nameInputRef, targetUrl: urlInputRef }}
          onClearError={clearFieldError}
          scheduleId={scheduleId}
          existingUrls={existingUrls}
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
          onTestRun={handleTestRun}
          onNavigateHome={navigateHome}
          onApplyTemplate={handleApplyTemplate}
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
