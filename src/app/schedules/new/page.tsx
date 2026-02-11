"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Switch } from "@/shared/ui";
import { ScheduleService, ScenarioService, type ScenarioSchedule } from "@/features/scenarios/services";
import type { Scenario } from "@/features/scenarios/lib";
import { isElectron } from "@/shared/lib/electron-api-client";
import { useLocation, useNavigate } from "react-router-dom";
import { useConfirmModalStore } from "@/stores/confirm-modal-store";

export default function ScheduleCreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openConfirmModal } = useConfirmModalStore();
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get("edit");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ScenarioSchedule>({
    scenarioId: "",
    enabled: true,
    frequency: "DAILY",
    time: "09:00",
    dayOfWeek: "MON",
    dayOfMonth: 1
  });
  const [isEditMode, setIsEditMode] = useState(false);

  const isWindows = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.userAgent.toLowerCase().includes("windows");
  }, []);

  useEffect(() => {
    const fetchScenarios = async () => {
      if (!isElectron) return;
      try {
        const result = await ScenarioService.getAll();
        setScenarios(result);
        if (!form.scenarioId && result.length > 0) {
          setForm((prev) => ({ ...prev, scenarioId: result[0].id }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "시나리오 목록을 불러오지 못했습니다");
      }
    };

    fetchScenarios();
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!editId) {
        setIsEditMode(false);
        return;
      }
      try {
        const list = await ScheduleService.list();
        const target = list.find((item) => item.id === editId);
        if (!target) {
          setError("스케줄을 찾을 수 없습니다.");
          return;
        }
        setIsEditMode(true);
        setForm({
          scenarioId: target.scenarioId,
          enabled: !!target.enabled,
          frequency: target.frequency,
          time: target.time,
          dayOfWeek: target.dayOfWeek || "MON",
          dayOfMonth: target.dayOfMonth || 1
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "스케줄 정보를 불러오지 못했습니다");
      }
    };

    fetchSchedule();
  }, [editId]);

  const handleSave = async () => {
    if (!form.scenarioId) return;
    try {
      setLoading(true);
      setError(null);
      await ScheduleService.save(form);
      if (isWindows) {
        await openConfirmModal({ message: isEditMode ? "스케줄이 편집되었습니다." : "스케줄이 등록되었습니다." });
        navigate("/schedules");
        return;
      }
      setError("macOS에서는 등록만 가능하며 실제 실행은 Windows 앱에서만 가능합니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "스케줄 저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? "스케줄 편집" : "스케줄 등록"}</h1>
          <p className="text-muted-foreground text-sm">
            시나리오에 반복 실행 스케줄을 등록합니다.
          </p>
        </div>
        <Link to="/schedules">
          <Button variant="outline">목록으로</Button>
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>스케줄 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isElectron && (
            <p className="text-sm text-muted-foreground">
              스케줄 등록은 데스크탑 앱에서만 사용할 수 있습니다.
            </p>
          )}

          {isElectron && !isWindows && (
            <p className="text-sm text-muted-foreground">
              macOS에서는 등록만 가능하며, 실제 실행은 Windows 앱에서만 가능합니다.
            </p>
          )}

          <div className="space-y-2">
            <Label>시나리오</Label>
            <select
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.scenarioId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, scenarioId: e.target.value }))
              }
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>반복 주기</Label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={form.frequency}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, frequency: e.target.value as ScenarioSchedule["frequency"] }))
                }
              >
                <option value="DAILY">매일</option>
                <option value="WEEKLY">매주</option>
                <option value="MONTHLY">매달</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>시간</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </div>

            {form.frequency === "WEEKLY" && (
              <div className="space-y-2">
                <Label>요일</Label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { key: "MON", label: "월" },
                    { key: "TUE", label: "화" },
                    { key: "WED", label: "수" },
                    { key: "THU", label: "목" },
                    { key: "FRI", label: "금" },
                    { key: "SAT", label: "토" },
                    { key: "SUN", label: "일" },
                  ].map((day) => {
                    const selected = (form.dayOfWeek || "MON").split(",").includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        className={`rounded-md border px-2 py-1 ${selected ? "border-blue-400 bg-blue-50 text-blue-700" : "border-input"}`}
                        onClick={() => {
                          setForm((prev) => {
                            const current = new Set((prev.dayOfWeek || "MON").split(",").filter(Boolean));
                            if (current.has(day.key)) {
                              current.delete(day.key);
                            } else {
                              current.add(day.key);
                            }
                            const next = Array.from(current);
                            return { ...prev, dayOfWeek: next.length ? next.join(",") : "MON" };
                          });
                        }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {form.frequency === "MONTHLY" && (
              <div className="space-y-2">
                <Label>일자 (1-31)</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.dayOfMonth || 1}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dayOfMonth: Number(e.target.value) }))
                  }
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>스케줄 활성화</Label>
            <Switch
              checked={form.enabled}
              onCheckedChange={(value) =>
                setForm((prev) => ({ ...prev, enabled: value }))
              }
            />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {isEditMode ? "편집 완료" : "등록"}
          </Button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
