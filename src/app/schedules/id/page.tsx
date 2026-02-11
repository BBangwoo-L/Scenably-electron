"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button, Switch } from "@/shared/ui";
import { ScheduleService, type ScenarioScheduleWithScenario, type ScheduleRun } from "@/features/scenarios/services";
import { unifiedApiClient } from "@/shared/lib/electron-api-client";
import { ExecutionDetailDialog } from "@/features/scenarios/components/execution-detail-dialog";
import { useConfirmModalStore } from "@/stores/confirm-modal-store";
import { Pencil, Trash2 } from "lucide-react";

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openConfirmModal } = useConfirmModalStore();
  const [schedule, setSchedule] = useState<ScenarioScheduleWithScenario | null>(null);
  const [runs, setRuns] = useState<ScheduleRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const list = await ScheduleService.list();
      const found = list.find((item) => item.id === id) || null;
      setSchedule(found);
      const runList = await ScheduleService.listRuns(id);
      setRuns(runList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "스케줄 정보를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleOpenLog = async (executionId: string) => {
    try {
      const execution = await unifiedApiClient.getExecutionById(executionId);
      setSelectedExecution(execution);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그를 불러오지 못했습니다");
    }
  };

  const handleDeleteSchedule = async () => {
    if (!schedule) return;
    const confirmed = await openConfirmModal({ message: "스케줄을 삭제하시겠습니까?", isAlert: false });
    if (!confirmed) return;

    try {
      await ScheduleService.delete(schedule.scenarioId);
      await openConfirmModal({ message: "스케줄이 삭제되었습니다." });
      navigate("/schedules");
    } catch (err) {
      await openConfirmModal({ message: "스케줄 삭제에 실패했습니다." });
    }
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    if (!schedule) return;
    try {
      await ScheduleService.toggle(schedule.scenarioId, enabled);
      setSchedule((prev) => (prev ? { ...prev, enabled } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "스케줄 상태 변경에 실패했습니다");
    }
  };

  const formatFrequency = (frequency: string) => {
    if (frequency === "DAILY") return "매일";
    if (frequency === "WEEKLY") return "매주";
    if (frequency === "MONTHLY") return "매달";
    return frequency;
  };

  const formatTime = (time: string) => {
    const [hh, mm] = time.split(":").map((v) => Number(v));
    const period = hh >= 12 ? "오후" : "오전";
    const hour = hh % 12 === 0 ? 12 : hh % 12;
    return `${period} ${hour}:${mm.toString().padStart(2, "0")}`;
  };

  const formatDayOfWeek = (value?: string | null) => {
    if (!value) return "-";
    const map: Record<string, string> = {
      MON: "월",
      TUE: "화",
      WED: "수",
      THU: "목",
      FRI: "금",
      SAT: "토",
      SUN: "일"
    };
    return value
      .split(",")
      .filter(Boolean)
      .map((day) => map[day] || day)
      .join(", ");
  };

  return (
    <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">스케줄 상세</h1>
          <p className="text-muted-foreground text-sm">
            스케줄 실행 이력과 로그를 확인합니다.
          </p>
        </div>
        <Link to="/schedules">
          <Button variant="outline">목록으로</Button>
        </Link>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !schedule ? (
        <p className="text-sm text-muted-foreground">스케줄을 찾을 수 없습니다.</p>
      ) : (
        <div className="space-y-6">
          <div className="border rounded-lg p-4 space-y-3 relative">
            <h2 className="text-sm font-medium text-muted-foreground">스케줄 정보</h2>
            <div className="absolute right-4 top-3 flex items-center gap-2">
              <Link to={`/schedules/new?edit=${schedule.id}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-1" />
                  편집
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDeleteSchedule}>
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">시나리오</div>
                <div className="font-medium">{schedule.scenarioName}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">URL</div>
                <div className="truncate">{schedule.targetUrl}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">주기</div>
                <div>{formatFrequency(schedule.frequency)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">시간</div>
                <div>{formatTime(schedule.time)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">요일/일자</div>
                <div>
                  {schedule.frequency === "WEEKLY"
                    ? formatDayOfWeek(schedule.dayOfWeek)
                    : schedule.frequency === "MONTHLY"
                      ? `${schedule.dayOfMonth || 1}일`
                      : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">활성화</div>
                <div className="mt-1">
                  <Switch
                    checked={!!schedule.enabled}
                    onCheckedChange={handleToggleSchedule}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">실행 이력</h2>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">실행 이력이 없습니다.</p>
            ) : (
              <div className="border rounded-lg">
                <div className="hidden md:grid grid-cols-[1fr,1.2fr,1.2fr,0.7fr] gap-2 px-3 py-2 text-xs text-muted-foreground border-b">
                  <div>상태</div>
                  <div>시작</div>
                  <div>완료</div>
                  <div>로그</div>
                </div>
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr,1.2fr,1.2fr,0.7fr] gap-2 px-3 py-3 border-b last:border-b-0 text-sm"
                  >
                    <div>
                      {run.status === "PENDING"
                        ? "대기"
                        : run.status === "RUNNING"
                          ? "실행중"
                          : run.status === "SUCCESS"
                            ? "성공"
                            : "실패"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(run.startedAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {run.completedAt ? new Date(run.completedAt).toLocaleString() : "-"}
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenLog(run.executionId)}
                      >
                        로그 보기
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      <ExecutionDetailDialog
        isOpen={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
        execution={selectedExecution}
      />
    </div>
  );
}
