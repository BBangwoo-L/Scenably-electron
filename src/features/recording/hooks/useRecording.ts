import { useState } from 'react';
import type { RecordingSession, RecordingMode } from '@/shared/types';
import { RecordingService } from '../services';

export function useRecording() {
  const [recordingSession, setRecordingSession] = useState<RecordingSession | null>(null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('headless');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await RecordingService.start({
        url,
        mode: recordingMode,
      });

      if (result.mode === 'interactive' && result.sessionId) {
        setRecordingSession({
          sessionId: result.sessionId,
          status: 'recording',
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start recording";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
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