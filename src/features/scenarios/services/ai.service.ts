import { unifiedApiClient } from '@/shared/lib/electron-api-client';
import type { ModifyCodeData, ModifyCodeResult } from '../lib';

export class AIService {
  static async modifyCode(data: ModifyCodeData): Promise<ModifyCodeResult> {
    return unifiedApiClient.modifyCode(data.code, data.instruction);
  }
}