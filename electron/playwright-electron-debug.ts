import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { app } from 'electron';
import electronLog from "electron-log";

// 기존 log 함수와 electron-log를 결합
const log = (message?: any, ...optionalParams: any[]) => {
  console.log(message, ...optionalParams);
  electronLog.info(message, ...optionalParams);
};

interface DebugSession {
  sessionId: string;
  code: string;
  process?: any;
  tempFile: string;
  tempConfigFile: string;
  status: 'starting' | 'running' | 'completed' | 'error';
}

export class ElectronPlaywrightDebugger {
  private static sessions: Map<string, DebugSession> = new Map();
  private static tempDir = path.join(app.getPath('userData'), 'tests', 'debug');

  private static buildNodePath(): string {
    const entries = [
      path.resolve(process.cwd(), 'node_modules'),
      path.resolve(process.resourcesPath, 'app.asar.unpacked', 'node_modules'),
      path.resolve(process.resourcesPath, 'app', 'node_modules'),
      path.resolve(process.resourcesPath, 'node_modules')
    ];
    if (process.env.NODE_PATH) {
      entries.push(process.env.NODE_PATH);
    }
    return entries.join(path.delimiter);
  }

  private static findPlaywrightBinary(): string {
    const isWin = process.platform === 'win32';
    const executableName = isWin ? 'playwright.cmd' : 'playwright';
    const nodeExecutable = isWin ? 'node.exe' : 'node';

    // 가능한 경로들을 순서대로 확인
    const possiblePaths = [
      // 1. 개발 모드: 프로젝트 루트의 node_modules
      path.resolve(process.cwd(), 'node_modules', '.bin', executableName),

      // 2. ASAR 압축 해제된 경로 (asarUnpack 설정으로 압축 해제됨)
      path.resolve(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.bin', executableName),
      path.resolve(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'playwright', 'cli.js'),
      path.resolve(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@playwright', 'test', 'cli.js'),

      // 3. 패키징된 앱: resources/app 내부 (Windows 전용 경로 추가)
      path.resolve(process.resourcesPath, 'app', 'node_modules', '.bin', executableName),
      ...(isWin ? [
        path.resolve(process.resourcesPath, 'app', 'node_modules', '.bin', 'playwright.cmd')
      ] : []),

      // 4. 패키징된 앱: extraResources (Node.js로 직접 실행)
      path.resolve(process.resourcesPath, 'app', 'node_modules', 'playwright', 'cli.js'),
      path.resolve(process.resourcesPath, 'app', 'node_modules', '@playwright', 'test', 'cli.js'),

      // 5. Windows 패키징: 다른 가능한 경로들
      ...(isWin ? [
        path.resolve(process.resourcesPath, 'node_modules', '@playwright', 'test', 'cli.js'),
        path.resolve(process.resourcesPath, 'node_modules', 'playwright', 'cli.js'),
        path.resolve(path.dirname(process.execPath), 'resources', 'app', 'node_modules', '@playwright', 'test', 'cli.js')
      ] : []),

      // 6. 전역 설치된 playwright
      'playwright'
    ];

    log('🔍 [Debug] execPath:', process.execPath);
    log('🔍 [Debug] cwd:', process.cwd());
    log('🔍 [Debug] resourcesPath:', process.resourcesPath);

    for (const binPath of possiblePaths) {
      log(`🔍 [Debug] Checking Playwright binary at: ${binPath}`);
      if (existsSync(binPath)) {
        log(`✅ [Debug] Found Playwright binary: ${binPath}`);
        return binPath;
      }
    }

    log('⚠️ [Debug] No Playwright binary found, using default');
    return executableName; // 기본값으로 system PATH에서 찾기 시도
  }

  private static getBrowserPath(): string {
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                         process.execPath.includes('electron') ||
                         !app.isPackaged;

    if (isDevelopment) {
      // 개발 모드: 프로젝트의 browsers 폴더 사용
      return path.resolve(process.cwd(), 'browsers');
    } else {
      // 패키징 모드: resources의 browsers 폴더 사용
      return path.resolve(process.resourcesPath, 'browsers');
    }
  }

  private static getAvailableChromiumExecutablePath(): string | null {
    const browserPath = this.getBrowserPath();

    if (!existsSync(browserPath)) {
      log(`❌ Browser path does not exist: ${browserPath}`);
      return null;
    }

    try {
      const fs = require('fs');
      // Windows 패키징 환경에서는 시스템 Chrome을 우선 사용 (번들 브라우저 이슈 회피)
      if (process.platform === 'win32' && app.isPackaged) {
        const systemPaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          path.join(require('os').homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
        ];
        for (const systemPath of systemPaths) {
          if (existsSync(systemPath)) {
            log(`✅ Found system Chrome for debug: ${systemPath}`);
            return systemPath;
          }
        }
      }

      const chromiumDirs = fs.readdirSync(browserPath).filter((dir: string) =>
        dir.startsWith('chromium-') && fs.statSync(path.join(browserPath, dir)).isDirectory()
      );

      if (chromiumDirs.length === 0) {
        log(`❌ No chromium directories found in: ${browserPath}`);
        return null;
      }

      // 가장 최근 버전을 선택
      const latestChromium = chromiumDirs.sort().pop();
      const chromiumDir = path.join(browserPath, latestChromium);

      // 플랫폼별 실행파일 경로 확인
      const possiblePaths = [];
      if (process.platform === 'win32') {
        possiblePaths.push(
          path.join(chromiumDir, 'chrome-win', 'chrome.exe'),
          // Windows에서 headless shell 사용 (더 안정적)
          path.join(browserPath, 'chromium_headless_shell-1193', 'chrome-mac', 'headless_shell'),
        );
      } else if (process.platform === 'darwin') {
        possiblePaths.push(
          path.join(chromiumDir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        );
      } else {
        possiblePaths.push(
          path.join(chromiumDir, 'chrome-linux', 'chrome'),
        );
      }

      for (const executablePath of possiblePaths) {
        log(`🔍 Checking debug executable at: ${executablePath}`);
        if (existsSync(executablePath)) {
          const stats = fs.statSync(executablePath);
          if (stats.size > 1000000) { // 1MB 이상이면 실제 실행파일
            log(`✅ Found debug executable: ${executablePath} (${stats.size} bytes)`);
            return executablePath;
          } else {
            log(`⚠️ Debug file too small: ${executablePath} (${stats.size} bytes)`);
          }
        } else {
          log(`❌ Debug not found: ${executablePath}`);
        }
      }

      // Windows에서 시스템에 설치된 Chrome 찾기
      if (process.platform === 'win32') {
        const systemPaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          path.join(require('os').homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
        ];

        for (const systemPath of systemPaths) {
          log(`🔍 Checking system Chrome for debug at: ${systemPath}`);
          if (existsSync(systemPath)) {
            log(`✅ Found system Chrome for debug: ${systemPath}`);
            return systemPath;
          }
        }
      }

      log(`❌ No valid debug executable found in ${chromiumDir}`);
      return null;
    } catch (error) {
      log(`❌ Error finding debug chromium executable: ${error}`);
      return null;
    }
  }

  static async ensureTempDirectory(): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      log('Debug temp directory already exists or creation failed:', error);
    }
  }

  private static logChromiumDiagnostics(executablePath: string): void {
    try {
      const fs = require('fs');
      const dir = path.dirname(executablePath);
      const requiredFiles = [
        'icudtl.dat',
        'chrome_elf.dll',
        'v8_context_snapshot.bin',
        'resources.pak'
      ];

      log(`🔍 [Debug] Chromium 실행 파일 경로: ${executablePath}`);
      log(`🔍 [Debug] Chromium 디렉토리: ${dir}`);

      for (const file of requiredFiles) {
        const fullPath = path.join(dir, file);
        const exists = fs.existsSync(fullPath);
        log(`🔍 [Debug] 필수 파일 ${file}: ${exists ? '존재' : '없음'} (${fullPath})`);
      }
    } catch (error) {
      log(`⚠️ [Debug] Chromium 진단 중 오류: ${error}`);
    }
  }

  private static async probeChromiumExecutable(executablePath: string): Promise<void> {
    if (process.env.SCENABLY_CHROMIUM_PROBE !== '1') {
      return;
    }
    return new Promise((resolve) => {
      try {
        const child = spawn(executablePath, ['--version'], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        let stdout = '';
        let stderr = '';

        const timeout = setTimeout(() => {
          try { child.kill(); } catch {}
          log('⚠️ [Debug] Chromium --version 타임아웃');
          resolve();
        }, 5000);

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        child.on('error', (error) => {
          clearTimeout(timeout);
          log(`❌ [Debug] Chromium --version 실행 실패: ${error}`);
          resolve();
        });
        child.on('close', (code) => {
          clearTimeout(timeout);
          log(`🔍 [Debug] Chromium --version 종료 코드: ${code}`);
          if (stdout.trim()) log(`🔍 [Debug] Chromium --version stdout: ${stdout.trim()}`);
          if (stderr.trim()) log(`🔍 [Debug] Chromium --version stderr: ${stderr.trim()}`);
          resolve();
        });
      } catch (error) {
        log(`⚠️ [Debug] Chromium --version 진단 중 오류: ${error}`);
        resolve();
      }
    });
  }

  static async startDebugSession(code: string, sessionId: string): Promise<{ sessionId: string; message: string }> {
    try {
      log(`🐞 [Debug] Starting debug session: ${sessionId}`);

      await this.ensureTempDirectory();

      if (this.sessions.has(sessionId)) {
        throw new Error('이미 활성화된 디버그 세션이 있습니다');
      }

      // 코드 형태 감지 및 변환 (모든 코드를 Test 형태로 통일)
      const processedCode = this.processCodeForDebug(code);

      // Test 형태로 통일하므로 항상 .spec.ts 파일로 생성
      const tempFile = path.join(this.tempDir, `debug-${sessionId}.spec.ts`);
      await writeFile(tempFile, processedCode, 'utf-8');

      // 디버그 전용 임시 playwright config 생성
      const tempConfigFile = path.join(this.tempDir, `playwright.config.debug-${sessionId}.ts`);
      const chromiumPath = this.getAvailableChromiumExecutablePath();
      if (chromiumPath) {
        this.logChromiumDiagnostics(chromiumPath);
        await this.probeChromiumExecutable(chromiumPath);
      }
      const configContent = `export default {
  testDir: '.',
  use: {
    browserName: 'chromium',
    ${chromiumPath ? `launchOptions: { executablePath: ${JSON.stringify(chromiumPath)} },` : ''}
  },
};
`;
      await writeFile(tempConfigFile, configContent, 'utf-8');
      log('📝 Created temp debug config:', tempConfigFile);

      // Create session object
      const session: DebugSession = {
        sessionId,
        code: processedCode,
        tempFile,
        tempConfigFile,
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
      log('❌ Failed to start debug session:', error);
      this.sessions.delete(sessionId);
      throw new Error(`디버그 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private static async runPlaywrightTest(session: DebugSession): Promise<boolean> {
    return new Promise((resolve) => {
      log('🚀 Running Playwright test in debug mode...');

      // 패키징된 앱과 개발 모드 모두 지원하는 경로 탐지
      const playwrightBin = this.findPlaywrightBinary();
      const isNodeJsScript = playwrightBin.endsWith('.js');

      let command: string[];
      let executable: string;

      // Playwright test 커맨드의 파일 인자는 정규식 패턴으로 사용됨
      // 절대경로 전달 시 Windows 백슬래시가 정규식 특수문자로 해석되어 매칭 실패
      // testDir: '.' 이 config와 같은 디렉토리이므로 파일명만 전달
      const testFileName = path.basename(session.tempFile);
      const configFileName = path.basename(session.tempConfigFile);

      if (isNodeJsScript) {
        // electron app은 내장 Nodejs로 실행
        executable = app.isPackaged ? process.execPath : 'node';
        command = [
          playwrightBin,
          'test',
          '--debug',
          `--config=${configFileName}`,
          testFileName
        ];
      } else {
        // 바이너리로 실행
        executable = playwrightBin;
        command = [
          'test',
          '--debug',
          `--config=${configFileName}`,
          testFileName
        ];
      }

      log('🔧 Debug browser path:', this.getBrowserPath());
      log('🔧 Debug executable:', executable);
      log('🔧 Debug command:', command.join(' '));

      const childProcess = spawn(executable, command, {
        cwd: this.tempDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          NODE_PATH: this.buildNodePath(),
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1', // 브라우저 다운로드 방지
          // 브라우저 경로 설정 (개발/패키징 모드 자동 분리)
          PLAYWRIGHT_BROWSERS_PATH: this.getBrowserPath(),
          // chromium 실행파일 경로 직접 지정
          ...(this.getAvailableChromiumExecutablePath() ? {
            PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: this.getAvailableChromiumExecutablePath()
          } : {}),
          ELECTRON_RUN_AS_NODE: '1',
          ELECTRON_NO_ATTACH_CONSOLE: undefined
        }
      });

      session.process = childProcess;
      session.status = 'running';

      let outputLog = '';

      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        log(`📤 Debug stdout: ${output}`);
        outputLog += output;
      });

      childProcess.stderr?.on('data', (data) => {
        const errorText = data.toString();
        log(`📤 Debug stderr: ${errorText}`);
        outputLog += errorText;
      });

      childProcess.on('spawn', () => {
        log('✅ Debug process spawned successfully');
      });

      childProcess.on('error', (error) => {
        log('❌ Debug spawn error:', error);
        resolve(false);
      });

      childProcess.on('close', async (code) => {
        log(`🏁 Debug process closed with code: ${code}`);

        // Clean up temporary files
        try {
          await unlink(session.tempFile);
          log('🗑️ Cleaned up debug temp file');
        } catch (error) {
          log('Debug temp file cleanup failed:', error);
        }
        try {
          await unlink(session.tempConfigFile);
          log('🗑️ Cleaned up debug temp config file');
        } catch (error) {
          log('Debug temp config file cleanup failed:', error);
        }

        // Remove session
        this.sessions.delete(session.sessionId);

        resolve(code === 0);
      });
    });
  }

  private static processCodeForDebug(code: string): string {
    log('🔍 Processing code for debug:', code.substring(0, 100) + '...');

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
      log('📝 Detected Playwright Test format');
      return code;
    }

    // Codegen 형태를 Test 형태로 변환
    if (code.includes('const { chromium }') || code.includes('require(\'playwright\')')) {
      log('🔄 Converting Codegen to Test format');
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

    log('✅ Converted code:', testCode.substring(0, 200) + '...');
    return testCode;
  }

  private static async runPlaywrightScript(session: DebugSession): Promise<boolean> {
    return new Promise((resolve) => {
      log('🚀 Running Playwright script in debug mode...');

      const command = [
        session.tempFile
      ];

      log('Debug script command:', 'node', command.join(' '));

      const childProcess = spawn(
          app.isPackaged ? process.execPath : 'node',
          command, {
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
        log(`📤 Debug script stdout: ${output}`);
        outputLog += output;
      });

      childProcess.stderr?.on('data', (data) => {
        const errorText = data.toString();
        log(`📤 Debug script stderr: ${errorText}`);
        outputLog += errorText;
      });

      childProcess.on('spawn', () => {
        log('✅ Debug script process spawned successfully');
      });

      childProcess.on('error', (error) => {
        log('❌ Debug script spawn error:', error);
        resolve(false);
      });

      childProcess.on('close', async (code) => {
        log(`🏁 Debug script process closed with code: ${code}`);

        // Clean up temporary file
        try {
          await unlink(session.tempFile);
          log('🗑️ Cleaned up debug temp file');
        } catch (error) {
          log('Debug temp file cleanup failed:', error);
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
        log('Error killing debug process:', error);
      }
    }

    // Clean up temp files
    try {
      await unlink(session.tempFile);
    } catch (error) {
      log('Debug temp file cleanup failed:', error);
    }
    try {
      await unlink(session.tempConfigFile);
    } catch (error) {
      log('Debug temp config file cleanup failed:', error);
    }

    this.sessions.delete(sessionId);
    return true;
  }
}
