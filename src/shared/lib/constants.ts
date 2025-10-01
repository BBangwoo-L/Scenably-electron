/**
 * HTTP 상태 코드 상수
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

/**
 * 기본 타임아웃 설정 (밀리초)
 */
export const DEFAULT_TIMEOUTS = {
  API_REQUEST: 10000, // 10초
  FILE_UPLOAD: 30000, // 30초
  USER_INTERACTION: 5000 // 5초
} as const;

/**
 * 뷰 모드 옵션
 */
export const VIEW_MODE_OPTIONS = [
  { value: "card", label: "카드" },
  { value: "table", label: "테이블" }
] as const;

/**
 * 기본 정렬 옵션
 */
export const BASE_SORT_OPTIONS = [
  { value: "name", label: "이름" },
  { value: "updatedAt", label: "수정일" },
  { value: "createdAt", label: "생성일" }
] as const;