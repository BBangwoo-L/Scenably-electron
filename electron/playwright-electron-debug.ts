import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { app } from 'electron';

interface DebugSession {
  sessionId: string;
  code: string;
  process?: any;
  tempFile: string;
  status: 'starting' | 'running' | 'completed' | 'error';
}

export class ElectronPlaywrightDebugger {
  private static sessions: Map<string, DebugSession> = new Map();
  private static tempDir = path.join(process.cwd(), 'tests', 'debug');

  static async ensureTempDirectory(): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.log('Debug temp directory already exists or creation failed:', error);
    }
  }

  static async startDebugSession(code: string, sessionId: string): Promise<{ sessionId: string; message: string }> {
    try {
      console.log(`🐞 [Debug] Starting debug session: ${sessionId}`);

      await this.ensureTempDirectory();

      if (this.sessions.has(sessionId)) {
        throw new Error('이미 활성화된 디버그 세션이 있습니다');
      }

      // 코드 형태 감지 및 변환 (모든 코드를 Test 형태로 통일)
      const processedCode = this.processCodeForDebug(code);

      // Test 형태로 통일하므로 항상 .spec.ts 파일로 생성
      const tempFile = path.join(this.tempDir, `debug-${sessionId}.spec.ts`);
      await writeFile(tempFile, processedCode, 'utf-8');

      // Create session object
      const session: DebugSession = {
        sessionId,
        code: processedCode,
        tempFile,
        status: 'starting'
      };

      this.sessions.set(sessionId, session);

      // 항상 Playwright Test로 실행
      const success = await this.runPlaywrightTest(session);

      if (success) {
        session.status = 'completed';
        return {
          sessionId,
          message: '디버그 실행이 완료되었습니다!'
        };
      } else {
        session.status = 'error';
        throw new Error('디버그 실행 중 오류가 발생했습니다');
      }

    } catch (error) {
      console.error('❌ Failed to start debug session:', error);
      this.sessions.delete(sessionId);
      throw new Error(`디버그 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private static async runPlaywrightTest(session: DebugSession): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🚀 Running Playwright test in debug mode...');

      const playwrightBin = path.resolve(
        process.cwd(),
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'playwright.cmd' : 'playwright'
      );

      const command = [
        'test',
        '--headed', // Run in headed mode so user can see the browser
        '--project=chromium',
        '--timeout=60000',
        session.tempFile
      ];

      console.log('Debug command:', playwrightBin, command.join(' '));

      const childProcess = spawn(playwrightBin, command, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '0'
        }
      });

      session.process = childProcess;
      session.status = 'running';

      let outputLog = '';

      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`📤 Debug stdout: ${output}`);
        outputLog += output;
      });

      childProcess.stderr?.on('data', (data) => {
        const errorText = data.toString();
        console.error(`📤 Debug stderr: ${errorText}`);
        outputLog += errorText;
      });

      childProcess.on('spawn', () => {
        console.log('✅ Debug process spawned successfully');
      });

      childProcess.on('error', (error) => {
        console.error('❌ Debug spawn error:', error);
        resolve(false);
      });

      childProcess.on('close', async (code) => {
        console.log(`🏁 Debug process closed with code: ${code}`);

        // Clean up temporary file
        try {
          await unlink(session.tempFile);
          console.log('🗑️ Cleaned up debug temp file');
        } catch (error) {
          console.log('Debug temp file cleanup failed:', error);
        }

        // Remove session
        this.sessions.delete(session.sessionId);

        resolve(code === 0);
      });
    });
  }

  private static processCodeForDebug(code: string): string {
    console.log('🔍 Processing code for debug:', code.substring(0, 100) + '...');

    // 유효하지 않은 코드 확인
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      throw new Error('유효하지 않은 코드입니다.');
    }

    // 시나리오 ID만 전달된 경우 감지
    if (code.trim().match(/^[a-z0-9]+$/i) && code.trim().length < 50) {
      throw new Error('시나리오 ID가 전달되었습니다. 시나리오 코드를 전달해주세요.');
    }

    // 코드가 이미 Test 형태인 경우 그대로 반환
    if (code.includes('import') && code.includes('test(')) {
      console.log('📝 Detected Playwright Test format');
      return code;
    }

    // Codegen 형태를 Test 형태로 변환
    if (code.includes('const { chromium }') || code.includes('require(\'playwright\')')) {
      console.log('🔄 Converting Codegen to Test format');
      return this.convertCodegenToTest(code);
    }

    // 알 수 없는 형태의 코드는 에러 발생
    throw new Error('지원하지 않는 코드 형태입니다. Playwright Test 또는 Codegen 형태의 코드를 입력해주세요.');
  }

  private static convertCodegenToTest(codegenCode: string): string {
    // Codegen 코드에서 브라우저 설정과 실제 액션 부분 추출
    const lines = codegenCode.split('\n');

    // 브라우저 설정 추출 (headless 설정)
    let isHeadless = true;
    const headlessMatch = codegenCode.match(/headless:\s*(false|true)/);
    if (headlessMatch) {
      isHeadless = headlessMatch[1] === 'true';
    }

    // 액션 코드 추출 (page.로 시작하는 라인들)
    const actionLines: string[] = [];
    let insideAsyncFunction = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes('(async () => {')) {
        insideAsyncFunction = true;
        continue;
      }

      if (insideAsyncFunction) {
        if (trimmed.startsWith('const browser') ||
            trimmed.startsWith('const context') ||
            trimmed.startsWith('const page')) {
          // 브라우저, 컨텍스트, 페이지 생성 라인은 제외 (Playwright Test에서 자동 제공)
          continue;
        }

        if (trimmed.startsWith('await page.close()') ||
            trimmed.startsWith('await context.close()') ||
            trimmed.startsWith('await browser.close()')) {
          // 정리 코드도 제외 (Playwright Test에서 자동 처리)
          continue;
        }

        if (trimmed.startsWith('})();')) {
          break;
        }

        if (trimmed.startsWith('await page.')) {
          actionLines.push(line);
        }
      }
    }

    // Test 형태로 변환
    const testCode = `import { test, expect } from '@playwright/test';

test('시나리오 테스트', async ({ page }) => {
${actionLines.join('\n')}
});`;

    console.log('✅ Converted code:', testCode.substring(0, 200) + '...');
    return testCode;
  }

  private static async runPlaywrightScript(session: DebugSession): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🚀 Running Playwright script in debug mode...');

      const command = [
        session.tempFile
      ];

      console.log('Debug script command:', 'node', command.join(' '));

      const childProcess = spawn('node', command, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '0'
        }
      });

      session.process = childProcess;
      session.status = 'running';

      let outputLog = '';

      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`📤 Debug script stdout: ${output}`);
        outputLog += output;
      });

      childProcess.stderr?.on('data', (data) => {
        const errorText = data.toString();
        console.error(`📤 Debug script stderr: ${errorText}`);
        outputLog += errorText;
      });

      childProcess.on('spawn', () => {
        console.log('✅ Debug script process spawned successfully');
      });

      childProcess.on('error', (error) => {
        console.error('❌ Debug script spawn error:', error);
        resolve(false);
      });

      childProcess.on('close', async (code) => {
        console.log(`🏁 Debug script process closed with code: ${code}`);

        // Clean up temporary file
        try {
          await unlink(session.tempFile);
          console.log('🗑️ Cleaned up debug temp file');
        } catch (error) {
          console.log('Debug temp file cleanup failed:', error);
        }

        // Remove session
        this.sessions.delete(session.sessionId);

        resolve(code === 0);
      });
    });
  }

  static async getActiveSession(sessionId: string): Promise<DebugSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  static async getAllActiveSessions(): Promise<DebugSession[]> {
    return Array.from(this.sessions.values());
  }

  static async stopDebugSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    if (session.process) {
      try {
        session.process.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!session.process.killed) {
          session.process.kill('SIGKILL');
        }
      } catch (error) {
        console.error('Error killing debug process:', error);
      }
    }

    // Clean up temp file
    try {
      await unlink(session.tempFile);
    } catch (error) {
      console.log('Debug temp file cleanup failed:', error);
    }

    this.sessions.delete(sessionId);
    return true;
  }
}