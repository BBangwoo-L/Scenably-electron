import { spawn } from 'child_process';
import { readFile, unlink, writeFile, access } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { app } from 'electron';
import electronLog from "electron-log";

// 기존 log 함수와 electron-log를 결합
const log = (message?: any, ...optionalParams: any[]) => {
  console.log(message, ...optionalParams);
  electronLog.info(message, ...optionalParams);
};

interface RecordingSession {
  sessionId: string;
  url: string;
  process?: any;
  outputFile: string;
  status: 'starting' | 'recording' | 'stopping' | 'completed' | 'error';
}

export class ElectronPlaywrightRecorder {
  private static sessions: Map<string, RecordingSession> = new Map();
  private static tempDir = path.join(app.getPath('userData'), 'recordings');

  private static findPlaywrightBinary(): string {
    const isWin = process.platform === 'win32';
    const executableName = isWin ? 'playwright.cmd' : 'playwright';

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

    log('execPath:', process.execPath);
    log('cwd:', process.cwd());
    log('resourcesPath:', process.resourcesPath);

    for (const binPath of possiblePaths) {
      log(`Checking Playwright binary at: ${binPath}`);
      if (existsSync(binPath)) {
        log(`✅ Found Playwright binary: ${binPath}`);
        return binPath;
      }
    }

    log('⚠️ No Playwright binary found, using default');
    return executableName; // 기본값으로 system PATH에서 찾기 시도
  }

  static async ensureTempDirectory(): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      log('Temp directory already exists or creation failed:', error);
    }
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

  private static getAvailableChromiumPath(): string | null {
    const browserPath = this.getBrowserPath();

    if (!existsSync(browserPath)) {
      log(`❌ Browser path does not exist: ${browserPath}`);
      return null;
    }

    try {
      const fs = require('fs');
      const chromiumDirs = fs.readdirSync(browserPath).filter((dir: string) =>
        dir.startsWith('chromium-') && fs.statSync(path.join(browserPath, dir)).isDirectory()
      );

      if (chromiumDirs.length === 0) {
        log(`❌ No chromium directories found in: ${browserPath}`);
        return null;
      }

      // 가장 최근 버전을 선택 (번호가 높은 것)
      const latestChromium = chromiumDirs.sort().pop();
      const chromiumPath = path.join(browserPath, latestChromium);

      log(`✅ Selected chromium browser: ${latestChromium} at ${chromiumPath}`);
      return chromiumPath;
    } catch (error) {
      log(`❌ Error finding chromium: ${error}`);
      return null;
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
          path.join(chromiumDir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'), // 크로스 플랫폼
          // Windows에서 headless shell 사용 (더 안정적)
          path.join(browserPath, 'chromium_headless_shell-1193', 'chrome-mac', 'headless_shell'),
        );
      } else if (process.platform === 'darwin') {
        possiblePaths.push(
          path.join(chromiumDir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
          path.join(chromiumDir, 'chrome-win', 'chrome.exe'), // Windows 빌드용
        );
      } else {
        possiblePaths.push(
          path.join(chromiumDir, 'chrome-linux', 'chrome'),
          path.join(chromiumDir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        );
      }

      for (const executablePath of possiblePaths) {
        log(`🔍 Checking executable at: ${executablePath}`);
        if (existsSync(executablePath)) {
          const stats = fs.statSync(executablePath);
          if (stats.size > 1000000) { // 1MB 이상이면 실제 실행파일
            log(`✅ Found executable: ${executablePath} (${stats.size} bytes)`);
            return executablePath;
          } else {
            log(`⚠️ File too small: ${executablePath} (${stats.size} bytes)`);
          }
        } else {
          log(`❌ Not found: ${executablePath}`);
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
          log(`🔍 Checking system Chrome at: ${systemPath}`);
          if (existsSync(systemPath)) {
            log(`✅ Found system Chrome: ${systemPath}`);
            return systemPath;
          }
        }
      }

      log(`❌ No valid executable found in ${chromiumDir}`);
      return null;
    } catch (error) {
      log(`❌ Error finding chromium executable: ${error}`);
      return null;
    }
  }

  private static async ensureBrowsersInstalled(): Promise<boolean> {
    log('🔍 Checking browsers...');

    const browserPath = this.getBrowserPath();
    log(`📂 Checking browsers at: ${browserPath}`);
    log(`🔧 Development mode: ${process.env.NODE_ENV === 'development' || !app.isPackaged}`);

    if (existsSync(browserPath)) {
      // 크로미움 바이너리가 존재하는지 확인
      const fs = require('fs');
      try {
        const chromiumDirs = fs.readdirSync(browserPath).filter((dir: string) =>
          dir.startsWith('chromium-') && fs.statSync(path.join(browserPath, dir)).isDirectory()
        );

        if (chromiumDirs.length > 0) {
          log(`✅ Found browser: ${chromiumDirs[0]}`);

          // 사용 가능한 Chromium 버전을 로그에 출력
          chromiumDirs.forEach(dir => {
            const browserDir = path.join(browserPath, dir);
            log(`📦 Available browser: ${dir} at ${browserDir}`);

            // 실제 실행파일이 있는지 확인 (크로스 플랫폼 지원)
            const possiblePaths = [];
            if (process.platform === 'win32') {
              possiblePaths.push(
                path.join(browserDir, 'chrome-win', 'chrome.exe'),
                path.join(browserDir, 'chrome-mac', 'Chromium.app'), // 개발 시 macOS 브라우저 사용
              );
            } else if (process.platform === 'darwin') {
              possiblePaths.push(
                path.join(browserDir, 'chrome-mac', 'Chromium.app'),
                path.join(browserDir, 'chrome-win', 'chrome.exe'), // Windows 빌드용
              );
            } else {
              possiblePaths.push(
                path.join(browserDir, 'chrome-linux', 'chrome'),
                path.join(browserDir, 'chrome-mac', 'Chromium.app'),
              );
            }

            let foundExecutable = false;
            for (const chromePath of possiblePaths) {
              log(`🔍 Checking Chrome at: ${chromePath}`);
              if (existsSync(chromePath)) {
                log(`✅ Chrome executable found: ${chromePath}`);
                foundExecutable = true;
                break;
              } else {
                log(`❌ Chrome executable NOT found: ${chromePath}`);
              }
            }

            if (!foundExecutable) {
              log(`⚠️ No executable found for ${dir}`);
            }
          });

          return true;
        }
      } catch (error) {
        log(`❌ Error checking browsers: ${error}`);
      }
    }

    log('❌ No browsers found');
    return false;
  }

  static async startRecording(url: string, sessionId: string): Promise<{ sessionId: string; message: string }> {
    try {
      log(`🎬 [Electron] Starting recording for URL: ${url}, Session: ${sessionId}`);
      log(`🔍 [Debug] Process info - execPath: ${process.execPath}`);
      log(`🔍 [Debug] Process info - cwd: ${process.cwd()}`);
      log(`🔍 [Debug] Process info - resourcesPath: ${process.resourcesPath}`);
      log(`🔍 [Debug] Process info - platform: ${process.platform}`);

      await this.ensureTempDirectory();
      log(`📁 [Debug] Temp directory ensured: ${this.tempDir}`);

      if (this.sessions.has(sessionId)) {
        throw new Error('이미 활성화된 레코딩 세션이 있습니다');
      }

      const outputFile = path.join(this.tempDir, `recording-${sessionId}.spec.ts`);
      log(`📄 [Debug] Output file: ${outputFile}`);

      // Create session object
      const session: RecordingSession = {
        sessionId,
        url,
        outputFile,
        status: 'starting'
      };

      this.sessions.set(sessionId, session);
      log(`📝 [Debug] Session created: ${JSON.stringify(session, null, 2)}`);

      // Playwright process를 비동기로 시작하고 즉시 리턴
      log(`🚀 [Debug] Starting Playwright process asynchronously...`);
      this.startPlaywrightProcessAsync(session);

      session.status = 'recording';
      log(`✅ [Debug] Recording session status updated to 'recording'`);

      return {
        sessionId,
        message: '레코딩이 시작되었습니다. 브라우저가 열리면 웹사이트와 상호작용하세요.'
      };

    } catch (error) {
      log('❌ Failed to start recording:', error);
      this.sessions.delete(sessionId);
      throw new Error(`레코딩 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private static async startPlaywrightProcessAsync(session: RecordingSession): Promise<void> {
    // 백그라운드에서 Playwright process 시작
    try {
      // Method 1: 브라우저 설치 상태 확인 및 자동 설치
      log('🔍 브라우저 설치 상태 확인 중...');
      const browserInstalled = await this.ensureBrowsersInstalled();

      if (!browserInstalled) {
        log('❌ 브라우저 설치 실패, 템플릿으로 대체');
        await this.generateTemplateCode(session);
        return;
      }

      // Method 2: Try to use playwright codegen with proper error handling
      const success = await this.tryPlaywrightCodegen(session);
      if (!success) {
        // Method 3: Fallback to template generation
        log('🔄 Codegen failed, falling back to template');
        await this.generateTemplateCode(session);
      }
    } catch (error) {
      log('Codegen error, using template:', error);
      await this.generateTemplateCode(session);
    }
  }

  private static async tryPlaywrightCodegen(session: RecordingSession): Promise<boolean> {
    return new Promise((resolve) => {
      log('🚀 [Debug] Trying Playwright codegen...');

      // 패키징된 앱과 개발 모드 모두 지원하는 경로 탐지
      log('🔍 [Debug] Finding Playwright binary...');
      const playwrightBin = this.findPlaywrightBinary();
      log(`✅ [Debug] Found Playwright binary: ${playwrightBin}`);

      const isNodeJsScript = playwrightBin.endsWith('.js');
      log(`🗋 [Debug] Is Node.js script: ${isNodeJsScript}`);

      let command: string[];
      let executable: string;

      if (isNodeJsScript) {
        // 앱이면 Electron 내장 node 사용
        executable = app.isPackaged ? process.execPath : 'node';
        command = [
          playwrightBin,
          'codegen',
          '--browser', 'chromium',
          '--output', session.outputFile,
          '--target', 'javascript',
          // Windows에서 브라우저 경로 문제가 있는 경우 시스템 Chrome 사용 옵션 추가
          ...(process.platform === 'win32' ? ['--channel', 'chrome'] : []),
          session.url
        ];
      } else {
        // 바이너리로 실행
        executable = playwrightBin;
        command = [
          'codegen',
          '--browser', 'chromium',
          '--output', session.outputFile,
          '--target', 'javascript',
          // Windows에서 브라우저 경로 문제가 있는 경우 시스템 Chrome 사용 옵션 추가
          ...(process.platform === 'win32' ? ['--channel', 'chrome'] : []),
          session.url
        ];
      }

      log('execPath:', process.execPath);
      log('cwd:', process.cwd());
      log('resourcesPath:', process.resourcesPath);
      log('Using executable:', executable);
      log('Command args:', command);

      const childProcess = spawn(executable, command, {
        cwd: process.cwd(), // Use current working directory instead of app path
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false, // Keep attached to parent process
        env: {
          ...process.env,
          NODE_ENV: 'development',
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1', // 브라우저 다운로드 방지
          // 사용 가능한 chromium 브라우저 경로 자동 설정
          PLAYWRIGHT_BROWSERS_PATH: this.getBrowserPath(),
          // chromium 실행파일 경로 직접 지정
          ...(this.getAvailableChromiumExecutablePath() ? {
            PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: this.getAvailableChromiumExecutablePath()
          } : {}),
          // Electron 실행 방지를 위한 환경변수 제거
          ELECTRON_RUN_AS_NODE: '1',
          ELECTRON_NO_ATTACH_CONSOLE: undefined
        }
      });

      let hasOutput = false;

      childProcess.stdout?.on('data', (data) => {
        log(`📤 Playwright stdout: ${data.toString()}`);
        hasOutput = true;
      });

      childProcess.stderr?.on('data', (data) => {
        const errorText = data.toString();
        log(`📤 Playwright stderr: ${errorText}`);

        // 특정 에러가 발생하면 fallback으로 전환
        if (errorText.includes('TargetClosedError') || errorText.includes('Browser closed') || errorText.includes('Process exited')) {
          log('🔄 Playwright process failed, using template fallback');
          childProcess.kill();
          resolve(false);
        }
      });

      childProcess.on('spawn', () => {
        log('✅ Playwright process spawned successfully');
        session.process = childProcess;
        hasOutput = true; // Mark as successful spawn
      });

      childProcess.on('error', (error) => {
        log('❌ [Debug] Playwright spawn error details:');
        log(`❌ [Debug] Error name: ${error.name}`);
        log(`❌ [Debug] Error message: ${error.message}`);
        log(`❌ [Debug] Error stack: ${error.stack}`);
        log(`❌ [Debug] Used executable: ${executable}`);
        log(`❌ [Debug] Used command: ${JSON.stringify(command)}`);
        resolve(false);
      });

      childProcess.on('close', (code) => {
        log(`🏁 Playwright process closed with code: ${code}`);
        if (code === 0) {
          resolve(true); // Successful completion
        } else {
          resolve(false); // Failed
        }
      });

      // timeout 제거 - 사용자가 원하는 만큼 레코딩할 수 있도록 함
    });
  }

  private static async generateTemplateCode(session: RecordingSession): Promise<void> {
    log('📝 Generating template code...');

    const templateCode = `import { test, expect } from '@playwright/test';

test('Recorded test for ${session.url}', async ({ page }) => {
  // Navigate to the website
  await page.goto('${session.url}');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot
  await page.screenshot({ path: 'initial-state.png', fullPage: true });

  // Get page title
  const title = await page.title();
  log('Page title:', title);
  expect(title).toBeTruthy();

  // TODO: 이 부분에 실제 레코딩된 액션들이 들어갑니다.
  // 현재는 Electron 환경에서 자동 레코딩이 제한되어 템플릿을 제공합니다.
  //
  // 수동으로 테스트를 완성하려면:
  // 1. 아래 주석을 해제하고 실제 선택자로 변경하세요
  // 2. 필요한 액션들을 추가하세요

  // 예시 액션들:
  // await page.click('button'); // 버튼 클릭
  // await page.fill('input[name="email"]', 'test@example.com'); // 입력 필드
  // await page.selectOption('select', 'value'); // 드롭다운 선택
  // await expect(page.locator('h1')).toBeVisible(); // 요소 확인

  // Final screenshot
  await page.screenshot({ path: 'final-state.png', fullPage: true });
});

// Additional interactive test template
test('Interactive elements test for ${session.url}', async ({ page }) => {
  await page.goto('${session.url}');

  // Find and test clickable elements
  const buttons = await page.locator('button, [type="button"], [role="button"]').count();
  log(\`Found \${buttons} clickable elements\`);

  // Find and test form inputs
  const inputs = await page.locator('input, textarea, select').count();
  log(\`Found \${inputs} form inputs\`);

  // Find and test links
  const links = await page.locator('a[href]').count();
  log(\`Found \${links} links\`);

  // Test basic accessibility
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  log(\`Found \${headings} headings\`);

  // Performance timing
  const loadTime = await page.evaluate(() => {
    return performance.timing.loadEventEnd - performance.timing.navigationStart;
  });
  log(\`Page load time: \${loadTime}ms\`);

  // Assert reasonable performance
  expect(loadTime).toBeLessThan(5000);
});`;

    await writeFile(session.outputFile, templateCode, 'utf-8');
    log('✅ Template code generated');
  }

  static async stopRecording(sessionId: string): Promise<{ code: string; message: string }> {
    try {
      log(`🛑 Stopping recording for session: ${sessionId}`);

      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('레코딩 세션을 찾을 수 없습니다');
      }

      session.status = 'stopping';

      // Kill process if running
      if (session.process) {
        try {
          session.process.kill('SIGTERM');
          // Wait a bit for graceful shutdown
          await new Promise(resolve => setTimeout(resolve, 2000));

          if (!session.process.killed) {
            session.process.kill('SIGKILL');
          }
        } catch (error) {
          log('Error killing process:', error);
        }
      }

      // Wait for file to be written and read it
      let code = '';
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        try {
          code = await readFile(session.outputFile, 'utf-8');
          break;
        } catch (error) {
          log(`📖 Attempt ${attempts + 1}: File not ready yet...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
      }

      // Clean up
      try {
        await unlink(session.outputFile);
        log('🗑️ Cleaned up temporary file');
      } catch (error) {
        log('File cleanup failed (expected):', error);
      }

      this.sessions.delete(sessionId);
      session.status = 'completed';

      return {
        code: code || this.getDefaultCode(session.url),
        message: code ? '레코딩이 완료되었습니다!' : '레코딩 템플릿이 생성되었습니다. 수동으로 테스트를 완성해주세요.'
      };

    } catch (error) {
      log('❌ Failed to stop recording:', error);
      throw new Error(`레코딩 중지 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private static getDefaultCode(url: string): string {
    return `import { test, expect } from '@playwright/test';

test('Basic test for ${url}', async ({ page }) => {
  await page.goto('${url}');
  await page.waitForLoadState('networkidle');

  const title = await page.title();
  expect(title).toBeTruthy();

  await page.screenshot({ path: 'screenshot.png' });
});`;
  }

  static async getActiveSession(sessionId: string): Promise<RecordingSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  static async getAllActiveSessions(): Promise<RecordingSession[]> {
    return Array.from(this.sessions.values());
  }
}