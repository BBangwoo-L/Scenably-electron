import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스들을 병합하고 충돌을 해결합니다.
 * clsx와 tailwind-merge를 결합하여 조건부 클래스와 중복 제거를 모두 처리합니다.
 *
 * @param inputs - 병합할 클래스들 (문자열, 객체, 배열 등)
 * @returns 병합되고 중복이 제거된 클래스 문자열
 *
 * @example
 * cn("px-2 py-1", "px-4", { "bg-red-500": isError }) // "py-1 px-4 bg-red-500"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 *
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @param options - Intl.DateTimeFormatOptions (선택사항)
 * @returns 포맷팅된 날짜 문자열
 *
 * @example
 * formatDate("2024-01-01") // "2024년 1월 1일"
 * formatDate(new Date(), { month: 'long' }) // "2024년 1월 1일"
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return dateObj.toLocaleDateString('ko-KR', defaultOptions);
}

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅합니다.
 *
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @returns 날짜와 시간이 포함된 포맷팅된 문자열
 *
 * @example
 * formatDateTime("2024-01-01T10:30:00") // "2024년 1월 1일 10:30"
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 텍스트를 지정된 길이로 자르고 "..."을 추가합니다.
 *
 * @param text - 자를 텍스트
 * @param maxLength - 최대 길이
 * @returns 자른 텍스트 (필요시 "..." 포함)
 *
 * @example
 * truncateText("Very long text here", 10) // "Very long..."
 * truncateText("Short", 10) // "Short"
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 함수의 실행을 지연시키는 디바운스 함수를 생성합니다.
 * 연속된 호출에서 마지막 호출만 실행되도록 합니다.
 *
 * @param func - 디바운스할 함수
 * @param delay - 지연 시간 (밀리초)
 * @returns 디바운스된 함수
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 *
 * debouncedSearch('a'); // 실행되지 않음
 * debouncedSearch('ab'); // 실행되지 않음
 * debouncedSearch('abc'); // 300ms 후 실행됨
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 문자열이 유효한 URL인지 검증합니다.
 *
 * @param url - 검증할 URL 문자열
 * @returns URL이 유효하면 true, 그렇지 않으면 false
 *
 * @example
 * isValidUrl("https://example.com") // true
 * isValidUrl("not-a-url") // false
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 지정된 시간만큼 실행을 지연시킵니다.
 *
 * @param ms - 지연할 시간 (밀리초)
 * @returns Promise<void>
 *
 * @example
 * await sleep(1000); // 1초 대기
 * console.log('1초 후 실행됨');
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 간단한 랜덤 ID를 생성합니다.
 *
 * @returns 9자리 랜덤 문자열
 *
 * @example
 * generateId() // "k2j5h8x9m"
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * 텍스트를 클립보드에 복사합니다.
 * 최신 브라우저와 구형 브라우저를 모두 지원합니다.
 *
 * @param text - 복사할 텍스트
 * @returns Promise<void>
 *
 * @example
 * await copyToClipboard("복사할 텍스트");
 * console.log('클립보드에 복사됨');
 */
export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);

  return Promise.resolve();
}