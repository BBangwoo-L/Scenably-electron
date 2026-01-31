import { unifiedApiClient } from '@/shared/lib/electron-api-client';
import type { StartRecordingData, StartRecordingResult, StopRecordingData, StopRecordingResult } from '../lib';

export class RecordingService {
  static async start(data: StartRecordingData): Promise<StartRecordingResult> {
    return unifiedApiClient.startRecording(data.url);
  }

  static async stop(data: StopRecordingData): Promise<StopRecordingResult> {
    return unifiedApiClient.stopRecording(data.sessionId);
  }
}