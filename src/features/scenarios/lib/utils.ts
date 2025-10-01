import type { SortOrder } from '@/shared/lib';
import type { Scenario, ScenarioFilterOptions, ScenarioGroupByOption } from './types';

/**
 * 시나리오 목록을 검색어와 상태로 필터링합니다.
 *
 * @param scenarios - 필터링할 시나리오 배열
 * @param filters - 필터 옵션 (검색어, 상태 등)
 * @returns 필터링된 시나리오 배열
 *
 * @example
 * const filtered = filterScenarios(scenarios, {
 *   search: "로그인",
 *   status: "SUCCESS",
 *   category: "all",
 *   sortBy: "name",
 *   sortOrder: "asc"
 * });
 */
export function filterScenarios(scenarios: Scenario[], filters: ScenarioFilterOptions): Scenario[] {
  return scenarios.filter((scenario) => {
    const matchesSearch = filters.search === "" ||
      scenario.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      scenario.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      scenario.targetUrl.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = filters.status === "all" ||
      (scenario.executions.length > 0 && scenario.executions[0].status === filters.status);

    return matchesSearch && matchesStatus;
  });
}

/**
 * 시나리오 배열을 지정된 기준으로 정렬합니다.
 *
 * @param scenarios - 정렬할 시나리오 배열
 * @param sortBy - 정렬 기준 (name, status, createdAt, updatedAt)
 * @param sortOrder - 정렬 순서 (asc 또는 desc)
 * @returns 정렬된 시나리오 배열
 *
 * @example
 * const sorted = sortScenarios(scenarios, "updatedAt", "desc");
 */
export function sortScenarios(scenarios: Scenario[], sortBy: string, sortOrder: SortOrder): Scenario[] {
  return [...scenarios].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "status":
        aValue = a.executions.length > 0 ? a.executions[0].status : "PENDING";
        bValue = b.executions.length > 0 ? b.executions[0].status : "PENDING";
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "updatedAt":
      default:
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
}

/**
 * 시나리오를 지정된 기준으로 그룹화합니다.
 *
 * @param scenarios - 그룹화할 시나리오 배열
 * @param groupBy - 그룹화 기준 (none, domain, status)
 * @returns 그룹화된 시나리오 객체 또는 null (groupBy가 "none"인 경우)
 *
 * @example
 * const grouped = groupScenarios(scenarios, "domain");
 * // 결과: { "example.com": [scenario1, scenario2], "test.com": [scenario3] }
 */
export function groupScenarios(scenarios: Scenario[], groupBy: ScenarioGroupByOption): Record<string, Scenario[]> | null {
  if (groupBy === "none") {
    return null;
  }

  const groups: Record<string, Scenario[]> = {};

  scenarios.forEach((scenario) => {
    let groupKey: string;

    if (groupBy === "domain") {
      groupKey = extractDomainFromUrl(scenario.targetUrl);
    } else if (groupBy === "status") {
      groupKey = scenario.executions.length > 0
        ? scenario.executions[0].status
        : "PENDING";
    } else {
      groupKey = "기타";
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(scenario);
  });

  return groups;
}

/**
 * URL에서 도메인을 추출합니다.
 *
 * @param url - 도메인을 추출할 URL 문자열
 * @returns 추출된 도메인 또는 "잘못된 URL"
 *
 * @example
 * extractDomainFromUrl("https://example.com/path") // "example.com"
 * extractDomainFromUrl("invalid-url") // "잘못된 URL"
 */
export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "잘못된 URL";
  }
}

/**
 * 시나리오 실행 상태에 따른 CSS 클래스를 반환합니다.
 *
 * @param status - 시나리오 실행 상태
 * @returns 상태에 맞는 CSS 클래스 문자열
 *
 * @example
 * getScenarioStatusColor("SUCCESS") // "bg-green-100 text-green-800"
 * getScenarioStatusColor("FAILED") // "bg-red-100 text-red-800"
 */
export function getScenarioStatusColor(status: string): string {
  const statusColors = {
    SUCCESS: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    PENDING: 'bg-gray-100 text-gray-800'
  };

  return statusColors[status as keyof typeof statusColors] || statusColors.PENDING;
}

/**
 * 시나리오 실행 상태를 한국어 라벨로 변환합니다.
 *
 * @param status - 시나리오 실행 상태
 * @returns 한국어 상태 라벨
 *
 * @example
 * getScenarioStatusLabel("SUCCESS") // "성공"
 * getScenarioStatusLabel("RUNNING") // "실행중"
 */
export function getScenarioStatusLabel(status: string): string {
  const statusLabels = {
    SUCCESS: '성공',
    FAILED: '실패',
    RUNNING: '실행중',
    PENDING: '대기중'
  };

  return statusLabels[status as keyof typeof statusLabels] || '알 수 없음';
}