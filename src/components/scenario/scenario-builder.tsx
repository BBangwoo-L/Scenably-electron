"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { ArrowLeft, Save, Play, Wand2, Video, Code2, Zap } from "lucide-react";

export function ScenarioBuilder() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUrl = searchParams.get("url") || "";

  const [scenarioData, setScenarioData] = useState({
    name: "",
    description: "",
    targetUrl: targetUrl,
    code: `import { test, expect } from '@playwright/test';

test('E2E Test for ${targetUrl}', async ({ page }) => {
  // Navigate to the target URL
  await page.goto('${targetUrl}');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Add your test steps here
  // Example: Check if page title is not empty
  const title = await page.title();
  expect(title).toBeTruthy();

  // Example: Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });
});`,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [recordingSession, setRecordingSession] = useState<{
    sessionId: string;
    status: string;
  } | null>(null);
  const [recordingMode, setRecordingMode] = useState<'interactive' | 'headless'>('headless');

  const handleSave = async () => {
    if (!scenarioData.name.trim()) {
      alert("시나리오 이름을 입력해주세요");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scenarioData),
      });

      if (response.ok) {
        router.push("/");
      } else {
        const error = await response.json();
        alert(`Failed to save scenario: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to save scenario");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiModify = async () => {
    const modificationRequest = prompt(
      "테스트 시나리오를 어떻게 수정하고 싶은지 설명해주세요:\n(예: '로그인 테스트 추가', '특정 텍스트 확인', '폼 유효성 검사 추가')"
    );

    if (!modificationRequest) return;

    try {
      setIsLoading(true);

      const response = await fetch("/api/ai/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentCode: scenarioData.code,
          modificationRequest,
          targetUrl: scenarioData.targetUrl,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setScenarioData({ ...scenarioData, code: result.modifiedCode });
        alert(`코드가 성공적으로 수정되었습니다!\n\n설명: ${result.explanation}`);
      } else {
        const error = await response.json();
        alert(`AI 수정 실패: ${error.error}`);
      }
    } catch (error) {
      alert("AI 수정에 실패했습니다");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/recording/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: scenarioData.targetUrl,
          mode: recordingMode,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.mode === 'headless') {
          // Update code with interactive template
          setScenarioData({ ...scenarioData, code: result.code });
          alert("인터랙티브 코드 템플릿이 생성되었습니다! 이제 테스트 단계를 커스터마이징할 수 있습니다.");
        } else {
          // Start interactive recording session and set default name if empty
          const defaultName = scenarioData.name.trim() || `Recording ${new Date().toLocaleString()}`;
          setScenarioData({ ...scenarioData, name: defaultName });
          setRecordingSession({
            sessionId: result.sessionId,
            status: 'recording',
          });
          alert("레코딩이 시작되었습니다! 브라우저 창이 열렸습니다. 웹사이트와 상호작용하여 테스트 시나리오를 레코딩하세요.");
        }
      } else {
        const error = await response.json();
        alert(`레코딩 시작 실패: ${error.error}`);
      }
    } catch (error) {
      alert("레코딩 시작에 실패했습니다");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async (saveCode: boolean = true) => {
    if (!recordingSession) return;

    console.log(`🔵 Frontend: Stopping recording with saveCode=${saveCode}, sessionId=${recordingSession.sessionId}`);

    try {
      setIsLoading(true);

      const requestBody = {
        sessionId: recordingSession.sessionId,
        saveCode,
      };

      console.log('🔵 Frontend: Request body:', requestBody);

      const response = await fetch("/api/recording/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🔵 Frontend: Response result:', result);
        console.log('🔵 Frontend: saveCode=', saveCode, 'result.code=', result.code ? result.code.length + ' chars' : 'null');

        if (saveCode && result.code) {
          const updatedScenarioData = { ...scenarioData, code: result.code };
          setScenarioData(updatedScenarioData);

          // Auto-save the scenario if name is provided
          if (updatedScenarioData.name.trim()) {
            try {
              const saveResponse = await fetch("/api/scenarios", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedScenarioData),
              });

              if (saveResponse.ok) {
                alert("레코딩이 중지되고 시나리오가 자동 저장되었습니다! 브라우저가 자동으로 종료됩니다.");
                // Redirect to home page after successful save
                setTimeout(() => router.push("/"), 1000);
              } else {
                alert("레코딩이 중지되고 코드가 생성되었습니다! 시나리오 이름을 입력한 후 '저장' 버튼을 클릭하세요.");
              }
            } catch (error) {
              alert("레코딩이 중지되고 코드가 생성되었습니다! 시나리오 이름을 입력한 후 '저장' 버튼을 클릭하세요.");
            }
          } else {
            alert("레코딩이 중지되고 코드가 생성되었습니다! 시나리오 이름을 입력한 후 '저장' 버튼을 클릭하세요.");
          }
        } else if (saveCode && !result.code) {
          alert("레코딩이 중지되었지만 코드 생성에 실패했습니다. 다시 시도해주세요.");
        } else {
          alert("레코딩이 취소되었습니다. 브라우저가 자동으로 종료됩니다.");
        }
        setRecordingSession(null);
      } else {
        const error = await response.json();
        console.error("Stop recording error:", error);

        // Even if API fails, reset UI state for better UX
        setRecordingSession(null);

        if (saveCode) {
          alert(`레코딩 중지 실패: ${error.error}\n\nUI 상태가 리셋되었습니다. 백그라운드 프로세스는 수동으로 종료해야 할 수 있습니다.`);
        } else {
          alert("레코딩이 취소되었습니다. (백그라운드 프로세스는 수동으로 종료해야 할 수 있습니다)");
        }
      }
    } catch (error) {
      console.error("Stop recording network error:", error);

      // Reset UI state even on network errors
      setRecordingSession(null);

      if (saveCode) {
        alert("레코딩 중지에 실패했습니다. UI 상태가 리셋되었습니다.");
      } else {
        alert("레코딩이 취소되었습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRecording = async () => {
    if (confirm("레코딩을 취소하시겠습니까? 지금까지의 레코딩 내용은 저장되지 않습니다.")) {
      try {
        await handleStopRecording(false);
      } catch (error) {
        // Even if there's an error, we want to reset the UI state
        console.error("Cancel recording error:", error);
        setRecordingSession(null);
        alert("레코딩이 취소되었습니다. (일부 프로세스는 수동으로 종료해야 할 수 있습니다)");
      }
    }
  };

  const handleForceReset = () => {
    if (confirm("강제로 레코딩 상태를 리셋하시겠습니까? 백그라운드 프로세스는 수동으로 종료해야 할 수 있습니다.")) {
      setRecordingSession(null);
      alert("레코딩 상태가 강제로 리셋되었습니다.");
    }
  };

  const handleTestRun = async () => {
    if (!scenarioData.name.trim()) {
      alert("테스트를 실행하기 전에 먼저 시나리오를 저장해주세요");
      return;
    }

    try {
      setIsLoading(true);

      // First, save the scenario if it's new
      let scenarioId;
      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scenarioData),
      });

      if (response.ok) {
        const scenario = await response.json();
        scenarioId = scenario.id;

        // Now execute the test
        const executeResponse = await fetch(`/api/scenarios/${scenarioId}/execute`, {
          method: "POST",
        });

        if (executeResponse.ok) {
          const result = await executeResponse.json();
          alert(`Test execution started!\nExecution ID: ${result.executionId}\nStatus: ${result.status}`);
        } else {
          const error = await executeResponse.json();
          alert(`Test execution failed: ${error.error}`);
        }
      } else {
        const error = await response.json();
        alert(`Failed to save scenario: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to run test");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Scenario Details */}
      <div className="space-y-6">
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
                onChange={(e) =>
                  setScenarioData({ ...scenarioData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="이 테스트 시나리오가 무엇을 검증하는지 설명해주세요..."
                value={scenarioData.description}
                onChange={(e) =>
                  setScenarioData({ ...scenarioData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">대상 URL</Label>
              <Input
                id="targetUrl"
                value={scenarioData.targetUrl}
                onChange={(e) =>
                  setScenarioData({ ...scenarioData, targetUrl: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>레코딩 및 액션</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={recordingMode} onValueChange={(value) => setRecordingMode(value as 'interactive' | 'headless')}>
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
                <Button onClick={handleStartRecording} disabled={isLoading} className="w-full">
                  <Zap className="mr-2 h-4 w-4" />
                  인터랙티브 템플릿 생성
                </Button>
              </TabsContent>

              <TabsContent value="interactive" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  브라우저를 열고 실제 상호작용을 레코딩하여 테스트 코드를 생성합니다
                </p>
                {!recordingSession ? (
                  <Button onClick={handleStartRecording} disabled={isLoading} className="w-full">
                    <Video className="mr-2 h-4 w-4" />
                    레코딩 시작
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center p-2 bg-red-50 text-red-700 rounded-md text-sm">
                      🔴 레코딩 진행 중...
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleStopRecording(true)} disabled={isLoading} variant="default" className="flex-1">
                        저장 후 중지
                      </Button>
                      <Button onClick={handleCancelRecording} disabled={isLoading} variant="outline" className="flex-1">
                        취소
                      </Button>
                    </div>
                    <Button onClick={handleForceReset} variant="ghost" className="w-full text-xs text-gray-500">
                      강제 리셋
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="border-t pt-3 space-y-3">
              <Button onClick={handleAiModify} variant="outline" className="w-full">
                <Wand2 className="mr-2 h-4 w-4" />
                AI로 수정하기
              </Button>

              <Button onClick={handleSave} disabled={isLoading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "저장 중..." : "시나리오 저장"}
              </Button>

              <Button onClick={handleTestRun} variant="outline" className="w-full">
                <Play className="mr-2 h-4 w-4" />
                테스트 실행
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                대시보드로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Code Editor */}
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
              onChange={(e) =>
                setScenarioData({ ...scenarioData, code: e.target.value })
              }
              className="font-mono text-sm min-h-[500px]"
              placeholder="E2E 테스트 코드를 여기에 입력하세요..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}