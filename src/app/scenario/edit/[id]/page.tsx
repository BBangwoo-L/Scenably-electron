"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/ui";
import { ArrowLeft, Save, Play, Wand2 } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  description?: string;
  targetUrl: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.id as string;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (scenarioId) {
      fetchScenario();
    }
  }, [scenarioId]);

  const fetchScenario = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(`/api/scenarios/${scenarioId}`);

      if (response.ok) {
        const data = await response.json();
        setScenario(data);
      } else {
        const error = await response.json();
        alert(`시나리오를 불러오는데 실패했습니다: ${error.error}`);
        router.push("/");
      }
    } catch (error) {
      alert("시나리오를 불러오는데 실패했습니다");
      console.error(error);
      router.push("/");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!scenario || !scenario.name.trim()) {
      alert("시나리오 이름을 입력해주세요");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: scenario.name,
          description: scenario.description,
          targetUrl: scenario.targetUrl,
          code: scenario.code,
        }),
      });

      if (response.ok) {
        alert("시나리오가 성공적으로 업데이트되었습니다!");
        router.push("/");
      } else {
        const error = await response.json();
        alert(`시나리오 업데이트 실패: ${error.error}`);
      }
    } catch (error) {
      alert("시나리오 업데이트에 실패했습니다");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiModify = async () => {
    if (!scenario) return;

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
          currentCode: scenario.code,
          modificationRequest,
          targetUrl: scenario.targetUrl,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setScenario({ ...scenario, code: result.modifiedCode });
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

  const handleTestRun = async () => {
    if (!scenario) return;

    try {
      setIsLoading(true);

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
    } catch (error) {
      alert("Failed to run test");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>시나리오를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">시나리오 편집</h1>
        <p className="text-muted-foreground">기존 테스트 시나리오를 수정합니다</p>
      </div>

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
                  value={scenario.name}
                  onChange={(e) =>
                    setScenario({ ...scenario, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  placeholder="이 테스트 시나리오가 무엇을 검증하는지 설명해주세요..."
                  value={scenario.description || ""}
                  onChange={(e) =>
                    setScenario({ ...scenario, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetUrl">대상 URL</Label>
                <Input
                  id="targetUrl"
                  value={scenario.targetUrl}
                  onChange={(e) =>
                    setScenario({ ...scenario, targetUrl: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>액션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleAiModify} variant="outline" className="w-full" disabled={isLoading}>
                <Wand2 className="mr-2 h-4 w-4" />
                AI로 수정하기
              </Button>

              <Button onClick={handleSave} disabled={isLoading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "저장 중..." : "시나리오 저장"}
              </Button>

              <Button onClick={handleTestRun} variant="outline" className="w-full" disabled={isLoading}>
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
                value={scenario.code}
                onChange={(e) =>
                  setScenario({ ...scenario, code: e.target.value })
                }
                className="font-mono text-sm min-h-[500px]"
                placeholder="E2E 테스트 코드를 여기에 입력하세요..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}