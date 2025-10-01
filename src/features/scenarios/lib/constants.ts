/**
 * 시나리오 관련 API 엔드포인트
 */
export const SCENARIO_API_ENDPOINTS = {
  SCENARIOS: '/api/scenarios',
  SCENARIO_BY_ID: (id: string) => `/api/scenarios/${id}`,
  SCENARIO_EXECUTE: (id: string) => `/api/scenarios/${id}/execute`,
  SCENARIO_DEBUG: (id: string) => `/api/scenarios/${id}/debug`,
} as const;

/**
 * 레코딩 관련 API 엔드포인트
 */
export const RECORDING_API_ENDPOINTS = {
  RECORDING_START: '/api/recording/start',
  RECORDING_STOP: '/api/recording/stop',
} as const;

/**
 * AI 관련 API 엔드포인트
 */
export const AI_API_ENDPOINTS = {
  AI_MODIFY: '/api/ai/modify',
} as const;

/**
 * 시나리오 상태 옵션
 */
export const SCENARIO_STATUS_OPTIONS = [
  { value: "all", label: "모든 상태" },
  { value: "SUCCESS", label: "성공" },
  { value: "FAILED", label: "실패" },
  { value: "RUNNING", label: "실행중" },
  { value: "PENDING", label: "대기중" }
] as const;

/**
 * 시나리오 정렬 옵션 (기본 옵션 + 상태별 정렬)
 */
export const SCENARIO_SORT_OPTIONS = [
  { value: "name", label: "이름" },
  { value: "updatedAt", label: "수정일" },
  { value: "createdAt", label: "생성일" },
  { value: "status", label: "상태" }
] as const;

/**
 * 시나리오 그룹화 옵션
 */
export const SCENARIO_GROUP_OPTIONS = [
  { value: "none", label: "그룹 없음" },
  { value: "domain", label: "도메인별" },
  { value: "status", label: "상태별" }
] as const;

/**
 * 시나리오 실행 상태
 */
export const SCENARIO_EXECUTION_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
} as const;

/**
 * 시나리오 관련 타임아웃 설정
 */
export const SCENARIO_TIMEOUTS = {
  EXECUTION: 60000, // 1분
  DEBUG_SESSION: 300000, // 5분
  CODE_GENERATION: 30000 // 30초
} as const;