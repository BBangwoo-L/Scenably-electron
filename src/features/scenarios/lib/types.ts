import type { BaseFilterOptions, SortOrder, ViewModeOption } from '@/shared/lib';

/**
 * 시나리오 엔티티
 */
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  targetUrl: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  executions: Array<{
    id: string;
    status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
    startedAt: string;
  }>;
}

/**
 * 시나리오 생성 데이터
 */
export interface CreateScenarioData {
  name: string;
  description?: string;
  targetUrl: string;
  code: string;
}

/**
 * 시나리오 업데이트 데이터
 */
export interface UpdateScenarioData extends Partial<CreateScenarioData> {
  id: string;
}

/**
 * 시나리오 실행 결과
 */
export interface ExecutionResult {
  executionId: string;
  status: string;
  success?: boolean;
  error?: string;
}

/**
 * AI 코드 수정 요청 데이터
 */
export interface ModifyCodeData {
  currentCode: string;
  modificationRequest: string;
  targetUrl: string;
}

/**
 * AI 코드 수정 결과
 */
export interface ModifyCodeResult {
  modifiedCode: string;
  explanation: string;
}

/**
 * 시나리오 필터 옵션
 * 기본 필터 옵션을 확장하여 시나리오 특화 필터 추가
 */
export interface ScenarioFilterOptions extends BaseFilterOptions {
  status: string;
  category: string;
}

/**
 * 시나리오 그룹화 옵션
 */
export type ScenarioGroupByOption = "none" | "domain" | "status";

/**
 * 시나리오 필터 바 컴포넌트 Props
 */
export interface ScenarioFilterBarProps {
  onFilterChange: (filters: ScenarioFilterOptions) => void;
  onGroupByChange?: (groupBy: ScenarioGroupByOption) => void;
  onViewModeChange?: (viewMode: ViewModeOption) => void;
  viewMode?: ViewModeOption;
  totalCount: number;
  filteredCount: number;
}

/**
 * 시나리오 아이템 컴포넌트 Props
 */
export interface ScenarioItemProps {
  scenario: Scenario;
  isLoading?: boolean;
  onRun: (scenarioId: string) => void;
  onEdit: (scenario: Scenario) => void;
  onDebug: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

/**
 * 시나리오 그룹 컴포넌트 Props
 */
export interface ScenarioGroupProps {
  title: string;
  scenarios: Scenario[];
  isLoading?: boolean;
  onRun: (scenarioId: string) => void;
  onEdit: (scenario: Scenario) => void;
  onDebug: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

/**
 * 시나리오 테이블 뷰 컴포넌트 Props
 */
export interface ScenarioTableViewProps {
  scenarios: Scenario[];
  isLoading?: boolean;
  onRun: (scenarioId: string) => void;
  onEdit: (scenario: Scenario) => void;
  onDebug: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

/**
 * 시나리오 액션 결과
 */
export interface ScenarioActionResult {
  success: boolean;
  message?: string;
  executionId?: string;
  sessionId?: string;
  error?: string;
}