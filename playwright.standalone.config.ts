import { defineConfig, devices } from '@playwright/test';

// 독립적인 테스트용 설정 (webServer 없이)
export default defineConfig({
  testDir: './temp',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000, // 30초 타임아웃
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true, // 기본적으로 headless
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer 제거 - 외부 사이트 테스트용
});