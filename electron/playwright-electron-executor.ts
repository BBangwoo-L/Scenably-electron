import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import electronLog from 'electron-log';
import { getDatabase } from './database-sqlite';

const log = (message?: any, ...optionalParams: any[]) => {
  console.log(message, ...optionalParams);
  electronLog.info(message, ...optionalParams);
};

export class ElectronPlaywrightExecutor {
  private static tempDir = path.join(app.getPath('userData'), 'tests', 'execute');

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

    const possiblePaths = [
      path.resolve(process.cwd(), 'node_modules', '.bin', executableName),
      path.resolve(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.bin', executableName),
      path.resolve(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'playwright', 'cli.js'),
      path.resolve(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@playwright', 'test', 'cli.js'),
      path.resolve(process.resourcesPath, 'app', 'node_modules', '.bin', executableName),
      path.resolve(process.resourcesPath, 'app', 'node_modules', 'playwright', 'cli.js'),
      path.resolve(process.resourcesPath, 'app', 'node_modules', '@playwright', 'test', 'cli.js'),
      'playwright'
    ];

    for (const binPath of possiblePaths) {
      if (existsSync(binPath)) {
        log(`✅ [Executor] Found Playwright binary: ${binPath}`);
        return binPath;
      }
    }

    return executableName;
  }

  private static getBrowserPath(): string {
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                         process.execPath.includes('electron') ||
                         !app.isPackaged;

    if (isDevelopment) {
      return path.resolve(process.cwd(), 'browsers');
    } else {
      return path.resolve(process.resourcesPath, 'browsers');
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

      log(`🔍 [Executor] Chromium 실행 파일 경로: ${executablePath}`);
      log(`🔍 [Executor] Chromium 디렉토리: ${dir}`);

      for (const file of requiredFiles) {
        const fullPath = path.join(dir, file);
        const exists = fs.existsSync(fullPath);
        log(`🔍 [Executor] 필수 파일 ${file}: ${exists ? '존재' : '없음'} (${fullPath})`);
      }
    } catch (error) {
      log(`⚠️ [Executor] Chromium 진단 중 오류: ${error}`);
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
          log('⚠️ [Executor] Chromium --version 타임아웃');
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
          log(`❌ [Executor] Chromium --version 실행 실패: ${error}`);
          resolve();
        });
        child.on('close', (code) => {
          clearTimeout(timeout);
          log(`🔍 [Executor] Chromium --version 종료 코드: ${code}`);
          if (stdout.trim()) log(`🔍 [Executor] Chromium --version stdout: ${stdout.trim()}`);
          if (stderr.trim()) log(`🔍 [Executor] Chromium --version stderr: ${stderr.trim()}`);
          resolve();
        });
      } catch (error) {
        log(`⚠️ [Executor] Chromium --version 진단 중 오류: ${error}`);
        resolve();
      }
    });
  }

  private static getAvailableChromiumExecutablePath(): string | null {
    const browserPath = this.getBrowserPath();

    if (!existsSync(browserPath)) return null;

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
          if (existsSync(systemPath)) return systemPath;
        }
      }

      const chromiumDirs = fs.readdirSync(browserPath).filter((dir: string) =>
        dir.startsWith('chromium-') && fs.statSync(path.join(browserPath, dir)).isDirectory()
      );

      if (chromiumDirs.length === 0) return null;

      const latestChromium = chromiumDirs.sort().pop();
      const chromiumDir = path.join(browserPath, latestChromium);

      const possiblePaths: string[] = [];
      if (process.platform === 'win32') {
        possiblePaths.push(path.join(chromiumDir, 'chrome-win', 'chrome.exe'));
      } else if (process.platform === 'darwin') {
        possiblePaths.push(path.join(chromiumDir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'));
      } else {
        possiblePaths.push(path.join(chromiumDir, 'chrome-linux', 'chrome'));
      }

      for (const executablePath of possiblePaths) {
        if (existsSync(executablePath)) {
          const stats = fs.statSync(executablePath);
          if (stats.size > 1000000) {
            return executablePath;
          }
        }
      }

      // Fallback: system Chrome on Windows
      if (process.platform === 'win32') {
        const systemPaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          path.join(require('os').homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
        ];
        for (const systemPath of systemPaths) {
          if (existsSync(systemPath)) return systemPath;
        }
      }

      return null;
    } catch (error) {
      log(`❌ [Executor] Error finding chromium executable: ${error}`);
      return null;
    }
  }

  private static async ensureTempDirectory(): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      // directory already exists
    }
  }

  static async executeInBackground(
    executionId: string,
    scenarioId: string,
    code: string,
    onComplete?: (status: 'SUCCESS' | 'FAILURE') => void
  ): Promise<void> {
    try {
      log(`🚀 [Executor] Starting background execution: ${executionId}`);

      await this.ensureTempDirectory();

      const tempFile = path.join(this.tempDir, `exec-${executionId}.spec.ts`);
      await writeFile(tempFile, code, 'utf-8');

      const tempConfigFile = path.join(this.tempDir, `playwright.config.exec-${executionId}.ts`);
      const chromiumPath = this.getAvailableChromiumExecutablePath();
      if (chromiumPath) {
        this.logChromiumDiagnostics(chromiumPath);
        await this.probeChromiumExecutable(chromiumPath);
      }
      const configContent = `export default {
  testDir: '.',
  use: {
    browserName: 'chromium',
    headless: true,
    ${chromiumPath ? `launchOptions: { executablePath: ${JSON.stringify(chromiumPath)} },` : ''}
  },
};
`;
      await writeFile(tempConfigFile, configContent, 'utf-8');

      const playwrightBin = this.findPlaywrightBinary();
      const isNodeJsScript = playwrightBin.endsWith('.js');

      let executable: string;
      let command: string[];

      // Playwright test 커맨드의 파일 인자는 정규식 패턴으로 사용됨
      // Windows 절대경로 백슬래시 문제 방지를 위해 파일명만 전달
      const testFileName = path.basename(tempFile);
      const configFileName = path.basename(tempConfigFile);

      if (isNodeJsScript) {
        executable = app.isPackaged ? process.execPath : 'node';
        command = [playwrightBin, 'test', `--config=${configFileName}`, testFileName];
      } else {
        executable = playwrightBin;
        command = ['test', `--config=${configFileName}`, testFileName];
      }

      log('🔧 [Executor] executable:', executable);
      log('🔧 [Executor] command:', command.join(' '));

      const childProcess = spawn(executable, command, {
        cwd: this.tempDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          NODE_PATH: this.buildNodePath(),
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
          PLAYWRIGHT_BROWSERS_PATH: this.getBrowserPath(),
          ELECTRON_RUN_AS_NODE: '1',
          ELECTRON_NO_ATTACH_CONSOLE: undefined
        }
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        log(`📤 [Executor] stdout: ${output}`);
        stdout += output;
      });

      childProcess.stderr?.on('data', (data) => {
        const errorText = data.toString();
        log(`📤 [Executor] stderr: ${errorText}`);
        stderr += errorText;
      });

      childProcess.on('error', (error) => {
        log('❌ [Executor] spawn error:', error);
        this.updateExecutionResult(executionId, 'FAILURE', {
          error: error.message,
          stdout,
          stderr
        });
      });

      childProcess.on('close', async (exitCode) => {
        log(`🏁 [Executor] Process closed with code: ${exitCode}`);

        const status = exitCode === 0 ? 'SUCCESS' : 'FAILURE';
        this.updateExecutionResult(executionId, status, {
          exitCode,
          stdout,
          stderr
        });
        if (onComplete) {
          onComplete(status);
        }

        // Cleanup temp files
        try { await unlink(tempFile); } catch {}
        try { await unlink(tempConfigFile); } catch {}
      });

    } catch (error) {
      log('❌ [Executor] Failed to start execution:', error);
      this.updateExecutionResult(executionId, 'FAILURE', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private static updateExecutionResult(
    executionId: string,
    status: 'SUCCESS' | 'FAILURE',
    result: any
  ): void {
    try {
      const db = getDatabase();
      db.updateExecution(executionId, {
        status,
        result: JSON.stringify(result),
        completedAt: new Date().toISOString()
      });

      // Notify renderer process
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].webContents.send('execution:statusChanged', {
          executionId,
          status,
          result
        });
      }

      log(`✅ [Executor] Updated execution ${executionId} to ${status}`);
    } catch (error) {
      log(`❌ [Executor] Failed to update execution result: ${error}`);
    }
  }
}
