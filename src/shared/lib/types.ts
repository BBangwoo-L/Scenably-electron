/**
 * 정렬 순서를 나타내는 타입
 */
export type SortOrder = "asc" | "desc";

/**
 * 뷰 모드 옵션 (카드형 또는 테이블형)
 */
export type ViewModeOption = "card" | "table";

/**
 * API 응답의 기본 구조
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}

/**
 * 페이지네이션 매개변수
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
}

/**
 * 검색 매개변수
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
}

/**
 * 비동기 상태를 나타내는 타입
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * 기본 필터 옵션 인터페이스
 */
export interface BaseFilterOptions {
  search: string;
  sortBy: string;
  sortOrder: SortOrder;
}

/**
 * 토스트 알림 옵션
 */
export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}