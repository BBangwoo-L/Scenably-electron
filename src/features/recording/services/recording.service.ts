import { apiClient } from '@/shared/lib';
import { RECORDING_API_ENDPOINTS } from '../../scenarios/lib';
import type { StartRecordingData, StartRecordingResult, StopRecordingData, StopRecordingResult } from '../lib';

export class RecordingService {
  static async start(data: StartRecordingData): Promise<StartRecordingResult> {
    return apiClient.post<StartRecordingResult>(RECORDING_API_ENDPOINTS.RECORDING_START, data);
  }

  static async stop(data: StopRecordingData): Promise<StopRecordingResult> {
    return apiClient.post<StopRecordingResult>(RECORDING_API_ENDPOINTS.RECORDING_STOP, data);
  }
}