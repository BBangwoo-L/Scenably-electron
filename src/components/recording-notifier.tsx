"use client";

import { useEffect } from "react";
import { unifiedApiClient } from "@/shared/lib/electron-api-client";
import { useToastStore } from "@/stores/toast-store";

export function RecordingNotifier() {
  const { showToast } = useToastStore();

  useEffect(() => {
    const cleanup = unifiedApiClient.onRecordingError((data: any) => {
      const message = data?.message || "레코딩 중 오류가 발생했습니다.";
      showToast({
        title: "레코딩 오류",
        message,
        type: "error",
        duration: 5000
      });
    });

    return cleanup;
  }, [showToast]);

  return null;
}
