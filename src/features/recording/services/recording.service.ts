import type { StartRecordingData, StartRecordingResult, StopRecordingData, StopRecordingResult } from '@/shared/types';

export class RecordingService {
  static async start(data: StartRecordingData): Promise<StartRecordingResult> {
    const response = await fetch("/api/recording/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to start recording");
    }

    return response.json();
  }

  static async stop(data: StopRecordingData): Promise<StopRecordingResult> {
    const response = await fetch("/api/recording/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to stop recording");
    }

    return response.json();
  }
}