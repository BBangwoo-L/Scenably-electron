"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { ScheduleService, type ScenarioScheduleWithScenario } from "@/features/scenarios/services";
import { isElectron } from "@/shared/lib/electron-api-client";
import { Filter, Search, Link as LinkIcon, Plus } from "lucide-react";

export default function ScheduleManagementPage() {
  const [schedules, setSchedules] = useState<ScenarioScheduleWithScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    enabled: "all",
    domain: "all",
    frequency: "all",
    sort: "next"
  });

  const isWindows = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.userAgent.toLowerCase().includes("windows");
  }, []);

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

  const formatStatus = (status?: string | null) => {
    if (!status) return "대기";
    if (status === "PENDING") return "대기";
    if (status === "RUNNING") return "실행중";
    if (status === "SUCCESS") return "성공";
    if (status === "FAILURE") return "실패";
    return status;
  };

  const extractDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return "알 수 없는 도메인";
    }
  };

  const computeNextRun = (schedule: ScenarioScheduleWithScenario) => {
    const [hh, mm] = schedule.time.split(":").map((v) => Number(v));
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);

    if (schedule.frequency === "DAILY") {
      return base > now ? base : new Date(base.getTime() + 24 * 60 * 60 * 1000);
    }

    if (schedule.frequency === "WEEKLY") {
      const days = (schedule.dayOfWeek || "MON").split(",").filter(Boolean);
      const dayMap: Record<string, number> = {
        SUN: 0,
        MON: 1,
        TUE: 2,
        WED: 3,
        THU: 4,
        FRI: 5,
        SAT: 6
      };
      for (let i = 0; i < 7; i++) {
        const candidate = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
        const key = Object.keys(dayMap).find((k) => dayMap[k] === candidate.getDay());
        if (key && days.includes(key) && candidate > now) {
          return candidate;
        }
      }
      return base;
    }

    const day = schedule.dayOfMonth || 1;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const safeDay = Math.min(day, daysInMonth);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), safeDay, hh, mm, 0, 0);
    if (thisMonth > now) return thisMonth;
    const nextMonthDays = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate();
    const nextSafeDay = Math.min(day, nextMonthDays);
    return new Date(now.getFullYear(), now.getMonth() + 1, nextSafeDay, hh, mm, 0, 0);
  };

  const fetchSchedules = async () => {
    if (!isElectron) return;
    try {
      setLoading(true);
      setError(null);
      const result = await ScheduleService.list();
      setSchedules(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "스케줄 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleToggle = async (scenarioId: string, enabled: boolean) => {
    try {
      await ScheduleService.toggle(scenarioId, enabled);
      setSchedules((prev) =>
        prev.map((item) =>
          item.scenarioId === scenarioId ? { ...item, enabled } : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "스케줄 상태 변경에 실패했습니다");
    }
  };

  const filteredSchedules = useMemo(() => {
    const nextMap = new Map(
      schedules.map((s) => [s.id, computeNextRun(s)])
    );
    return schedules
      .filter((s) => {
        const matchesSearch =
          !filters.search ||
          s.scenarioName.toLowerCase().includes(filters.search.toLowerCase()) ||
          s.targetUrl.toLowerCase().includes(filters.search.toLowerCase());
        const matchesDomain =
          filters.domain === "all" ||
          extractDomain(s.targetUrl) === filters.domain;
        const matchesEnabled =
          filters.enabled === "all" ||
          (filters.enabled === "enabled" ? !!s.enabled : !s.enabled);
        const matchesFrequency =
          filters.frequency === "all" ||
          s.frequency === filters.frequency;
        const status = (s.lastStatus || "PENDING").toUpperCase();
        const matchesStatus =
          filters.status === "all" ||
          status === filters.status;
        return matchesSearch && matchesDomain && matchesEnabled && matchesFrequency && matchesStatus;
      })
      .sort((a, b) => {
        if (filters.sort === "name") {
          return a.scenarioName.localeCompare(b.scenarioName);
        }
        if (filters.sort === "last") {
          return (b.lastStartedAt || "").localeCompare(a.lastStartedAt || "");
        }
        const aNext = nextMap.get(a.id)?.getTime() || 0;
        const bNext = nextMap.get(b.id)?.getTime() || 0;
        return aNext - bNext;
      });
  }, [schedules, filters]);

  const upcoming = useMemo(() => {
    return [...filteredSchedules]
      .filter((s) => !!s.enabled)
      .map((s) => ({ ...s, nextRun: computeNextRun(s) }))
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
      .slice(0, 5);
  }, [filteredSchedules]);

  const groupedByDomain = useMemo(() => {
    const groups: Record<string, ScenarioScheduleWithScenario[]> = {};
    filteredSchedules.forEach((schedule) => {
      const domain = extractDomain(schedule.targetUrl);
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(schedule);
    });
    return groups;
  }, [filteredSchedules]);

  const domainOptions = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((schedule) => {
      set.add(extractDomain(schedule.targetUrl));
    });
    return Array.from(set).sort();
  }, [schedules]);

  return (
    <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">스케줄 관리</h1>
          <p className="text-muted-foreground text-sm">
            등록된 시나리오 스케줄을 한눈에 확인하고 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/schedules/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              스케줄 등록
            </Button>
          </Link>
        </div>
      </header>

      <div className="space-y-6">
        <div className="space-y-3">
          {!isElectron ? (
            <p className="text-sm text-muted-foreground">
              스케줄 관리는 데스크탑 앱에서만 사용할 수 있습니다.
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
            <>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="시나리오/URL 검색"
                      value={filters.search}
                      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters((prev) => !prev)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden xs:inline">필터</span>
                    {(filters.status !== "all" || filters.enabled !== "all" || filters.frequency !== "all") && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                </div>

                {showFilters && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm font-medium whitespace-nowrap">도메인:</span>
                      <Select value={filters.domain} onValueChange={(value) => setFilters((prev) => ({ ...prev, domain: value }))}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {domainOptions.map((domain) => (
                            <SelectItem key={domain} value={domain}>
                              {domain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm font-medium whitespace-nowrap">상태:</span>
                      <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                        <SelectTrigger className="w-full sm:w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="RUNNING">실행중</SelectItem>
                          <SelectItem value="SUCCESS">성공</SelectItem>
                          <SelectItem value="FAILURE">실패</SelectItem>
                          <SelectItem value="PENDING">대기</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm font-medium whitespace-nowrap">활성:</span>
                      <Select value={filters.enabled} onValueChange={(value) => setFilters((prev) => ({ ...prev, enabled: value }))}>
                        <SelectTrigger className="w-full sm:w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="enabled">활성</SelectItem>
                          <SelectItem value="disabled">비활성</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm font-medium whitespace-nowrap">주기:</span>
                      <Select value={filters.frequency} onValueChange={(value) => setFilters((prev) => ({ ...prev, frequency: value }))}>
                        <SelectTrigger className="w-full sm:w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="DAILY">매일</SelectItem>
                          <SelectItem value="WEEKLY">매주</SelectItem>
                          <SelectItem value="MONTHLY">매달</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm font-medium whitespace-nowrap">정렬:</span>
                      <Select value={filters.sort} onValueChange={(value) => setFilters((prev) => ({ ...prev, sort: value }))}>
                        <SelectTrigger className="w-full sm:w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="next">다가오는 순</SelectItem>
                          <SelectItem value="last">최근 실행 순</SelectItem>
                          <SelectItem value="name">이름 순</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="text-sm text-muted-foreground">
                  검색 결과 {filteredSchedules.length}개
                </div>

                {filteredSchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">등록된 스케줄이 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedByDomain).map(([domain, group]) => (
                      <div key={domain} className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          {domain}
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm table-fixed">
                            <thead className="text-xs text-muted-foreground border-b">
                              <tr>
                                <th className="text-left px-4 py-2 w-[260px]">시나리오</th>
                                <th className="text-left px-3 py-2">주기</th>
                                <th className="text-left px-3 py-2">시간</th>
                                <th className="text-left px-3 py-2">요일/일자</th>
                                <th className="text-left px-3 py-2">상태</th>
                                <th className="text-left px-3 py-2">활성화</th>
                                <th className="text-left px-3 py-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.map((schedule) => (
                                <tr key={schedule.id} className="border-b last:border-b-0">
                                  <td className="px-4 py-3">
                                    <div className="min-w-0 flex items-center gap-2">
                                      <div
                                        className="font-medium truncate"
                                        title={schedule.scenarioName}
                                      >
                                        {schedule.scenarioName}
                                      </div>
                                      <Link to={`/scenario/edit/${schedule.scenarioId}`} className="text-muted-foreground hover:text-foreground">
                                        <LinkIcon className="h-4 w-4" />
                                      </Link>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">{formatFrequency(schedule.frequency)}</td>
                                  <td className="px-3 py-3">{formatTime(schedule.time)}</td>
                                  <td className="px-3 py-3">
                                    {schedule.frequency === "WEEKLY"
                                      ? formatDayOfWeek(schedule.dayOfWeek)
                                      : schedule.frequency === "MONTHLY"
                                        ? `${schedule.dayOfMonth || 1}일`
                                        : "-"}
                                  </td>
                                  <td className="px-3 py-3">{formatStatus(schedule.lastStatus)}</td>
                                  <td className="px-3 py-3">
                                    <Switch
                                      checked={!!schedule.enabled}
                                      onCheckedChange={(value) => handleToggle(schedule.scenarioId, value)}
                                      disabled={!isElectron}
                                    />
                                  </td>
                                  <td className="px-3 py-3">
                                    <Link to={`/schedules/${schedule.id}`}>
                                      <Button variant="outline" size="sm">
                                        상세
                                      </Button>
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>곧 실행될 스케줄</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">예정된 스케줄이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((item) => (
                  <div key={item.id} className="text-sm flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.scenarioName}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.targetUrl}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {computeNextRun(item).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
