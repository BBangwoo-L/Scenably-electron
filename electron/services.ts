// Electron 환경에서 사용할 서비스 레이어
import { join } from 'path';

// 서비스들을 지연 로딩하는 팩토리 함수들
export class ElectronServices {
  private static scenarioService: any;
  private static playwrightExecutor: any;
  private static playwrightRecorder: any;

  static async getScenarioService() {
    if (!this.scenarioService) {
      // 런타임에 require를 사용하여 모듈 로드
      const modulePath = join(process.cwd(), 'src/lib/db/scenario');
      this.scenarioService = require(modulePath).ScenarioService;
    }
    return this.scenarioService;
  }

  static async getPlaywrightExecutor() {
    if (!this.playwrightExecutor) {
      const modulePath = join(process.cwd(), 'src/lib/playwright/executor');
      this.playwrightExecutor = require(modulePath).PlaywrightExecutor;
    }
    return this.playwrightExecutor;
  }

  static async getPlaywrightRecorder() {
    if (!this.playwrightRecorder) {
      const modulePath = join(process.cwd(), 'src/lib/playwright/recorder');
      this.playwrightRecorder = require(modulePath).PlaywrightRecorder;
    }
    return this.playwrightRecorder;
  }

  // 대안: 직접 데이터베이스 작업을 수행하는 간단한 구현
  static async getDatabase() {
    const { prisma } = require(join(process.cwd(), 'src/lib/db/prisma'));
    return prisma;
  }
}