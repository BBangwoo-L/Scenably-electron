import { apiClient } from '@/shared/lib';
import { AI_API_ENDPOINTS } from '../lib';
import type { ModifyCodeData, ModifyCodeResult } from '../lib';

export class AIService {
  static async modifyCode(data: ModifyCodeData): Promise<ModifyCodeResult> {
    return apiClient.post<ModifyCodeResult>(AI_API_ENDPOINTS.AI_MODIFY, data);
  }
}