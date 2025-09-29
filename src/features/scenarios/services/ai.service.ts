import type { ModifyCodeData, ModifyCodeResult } from '@/shared/types';

export class AIService {
  static async modifyCode(data: ModifyCodeData): Promise<ModifyCodeResult> {
    const response = await fetch("/api/ai/modify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to modify code with AI");
    }

    return response.json();
  }
}