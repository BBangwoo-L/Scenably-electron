"use client";

import { useState } from 'react';
import type { RecordingSession, RecordingMode } from '../lib';
import { RecordingService } from '../services';

export function useRecording() {
  const [recordingSession, setRecordingSession] = useState<RecordingSession | null>(null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('headless');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting recording for URL:', url, 'Mode:', recordingMode);

      const result = await RecordingService.start({
        url,
        mode: recordingMode,
      });

      console.log('📦 Recording service result:', result);

      if (result.sessionId) {
        setRecordingSession({
          sessionId: result.sessionId,
          status: 'recording',
        });
        console.log('✅ Recording session started with ID:', result.sessionId);
      }

      return result;
    } catch (err) {
      console.error('❌ Recording start failed:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start recording";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      // 성공/실패 관계없이 항상 로딩 상태 해제
      setIsLoading(false);
      console.log('🔄 Loading state cleared');
    }
  };

  const stopRecording = async (saveCode: boolean = true) => {
    if (!recordingSession) {
      throw new Error("No active recording session");
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await RecordingService.stop({
        sessionId: recordingSession.sessionId,
        saveCode,
      });

      setRecordingSession(null);
      return result;
    } catch (err) {
      // Reset UI state even on errors for better UX
      setRecordingSession(null);
      const errorMessage = err instanceof Error ? err.message : "Failed to stop recording";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRecording = async () => {
    try {
      await stopRecording(false);
    } catch (err) {
      // Even if there's an error, reset the UI state
      setRecordingSession(null);
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel recording";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const forceReset = () => {
    setRecordingSession(null);
    setError(null);
  };

  return {
    recordingSession,
    recordingMode,
    isLoading,
    error,
    setRecordingMode,
    startRecording,
    stopRecording,
    cancelRecording,
    forceReset
  };
}