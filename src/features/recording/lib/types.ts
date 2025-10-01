/**
 * 레코딩 세션
 */
export interface RecordingSession {
  sessionId: string;
  status: string;
}

/**
 * 레코딩 모드
 */
export type RecordingMode = 'interactive' | 'headless';

/**
 * 레코딩 시작 데이터
 */
export interface StartRecordingData {
  url: string;
  mode: RecordingMode;
}

/**
 * 레코딩 시작 결과
 */
export interface StartRecordingResult {
  sessionId?: string;
  code?: string;
  mode: RecordingMode;
}

/**
 * 레코딩 중지 데이터
 */
export interface StopRecordingData {
  sessionId: string;
  saveCode: boolean;
}

/**
 * 레코딩 중지 결과
 */
export interface StopRecordingResult {
  code?: string;
}