import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  screenshots?: string[];
}

interface DebugSession {
  sessionId: string;
  process: any;
  tempFile: string;
}

export class PlaywrightExecutor {
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp');
  private static debugSessions: Map<string, DebugSession> = new Map();

  static async executeScenario(code: string, scenarioId: string): Promise<ExecutionResult> {
    const tempFileName = `scenario-${scenarioId}-${Date.now()}.spec.ts`;
    const tempFilePath = path.join(this.TEMP_DIR, tempFileName);

    try {
      // Ensure temp directory exists
      await execAsync(`mkdir -p ${this.TEMP_DIR}`);

      // Write the test code to a temporary file
      console.log(`📝 Writing test code to: ${tempFilePath}`);
      console.log(`📝 Code length: ${code.length} characters`);
      await writeFile(tempFilePath, code);

      // Verify file was created
      try {
        const fileContent = await readFile(tempFilePath, 'utf-8');
        console.log(`✅ File created successfully, length: ${fileContent.length}`);
        console.log(`📄 File preview: ${fileContent.substring(0, 200)}...`);
      } catch (fileError) {
        console.error(`❌ Failed to verify temp file: ${fileError}`);
      }

      // Execute the Playwright test - try multiple approaches
      let command;

      // First try: Use local node_modules
      const playwrightBin = path.join(process.cwd(), 'node_modules', '.bin', 'playwright');
      const nodeModulesExists = await execAsync('ls node_modules/.bin/playwright', { cwd: process.cwd() }).then(() => true).catch(() => false);

      // Use standalone config to avoid webServer conflicts
      if (nodeModulesExists) {
        command = `"${playwrightBin}" test "${tempFilePath}" --config=playwright.standalone.config.ts --reporter=json --project=chromium`;
        console.log('📦 Using local playwright binary with standalone config');
      } else {
        // Fallback: try npx
        command = `npx --yes playwright test "${tempFilePath}" --config=playwright.standalone.config.ts --reporter=json --project=chromium`;
        console.log('🌐 Using npx playwright with standalone config');
      }
      console.log(`🚀 Executing command: ${command}`);
      console.log(`📁 Working directory: ${process.cwd()}`);
      console.log(`📄 Temp file path: ${tempFilePath}`);

      // Check Playwright installation
      try {
        console.log('🔍 Checking Playwright installation...');

        // Try to run a simple command first
        const { stdout: versionOutput } = await execAsync('node -e "console.log(require(\'@playwright/test\').version || \'installed\')"', {
          timeout: 10000,
          cwd: process.cwd()
        });
        console.log('✅ Playwright module available:', versionOutput.trim());

        // Try to ensure browsers are available (but don't fail if they're not)
        try {
          await execAsync('npx playwright install chromium --force', {
            timeout: 60000,
            cwd: process.cwd()
          });
          console.log('✅ Chromium browser ensured');
        } catch (browserError) {
          console.log('⚠️ Browser installation may have issues, but continuing...');
        }
      } catch (versionError) {
        console.error('❌ Playwright check failed:', versionError);
        // Don't throw error, try to continue anyway
        console.log('⚠️ Continuing without Playwright check...');
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 180000, // 3 minute timeout
        env: {
          ...process.env,
          CI: 'true', // Force headless mode
          PWDEBUG: '', // Disable debug mode
          PW_EXPERIMENTAL_SERVICE_WORKER_HANDLER: 'allow' // Allow service workers
        }
      });

      console.log(`📤 Command stdout length: ${stdout.length}`);
      console.log(`📤 Command stderr length: ${stderr.length}`);
      console.log(`📤 stdout preview: ${stdout.substring(0, 500)}...`);
      if (stderr) {
        console.log(`📤 stderr content: ${stderr}`);
      }

      // Parse the results
      let testResults;
      try {
        testResults = JSON.parse(stdout);
      } catch {
        // If JSON parsing fails, treat as raw output
        testResults = { rawOutput: stdout };
      }

      const success = !stderr && testResults.stats && testResults.stats.unexpected === 0;

      return {
        success,
        output: JSON.stringify(testResults, null, 2),
        error: stderr || undefined,
      };

    } catch (error) {
      console.error('❌ Playwright execution error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));

      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }

      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown execution error',
      };
    } finally {
      // Clean up temporary file
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  static async validateScenarioCode(code: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic syntax validation
    if (!code.includes('import') || !code.includes('@playwright/test')) {
      errors.push('Missing Playwright test imports');
    }

    if (!code.includes('test(')) {
      errors.push('No test function found');
    }

    if (!code.includes('page.goto')) {
      errors.push('No navigation command found');
    }

    // Check for potential security issues
    if (code.includes('eval(') || code.includes('exec(')) {
      errors.push('Potentially unsafe code detected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static async startDebugMode(code: string, scenarioId: string, targetUrl?: string): Promise<{ sessionId: string; message: string }> {
    try {
      console.log(`🐛 Starting debug mode for scenario: ${scenarioId}, targetUrl: ${targetUrl}`);
      console.log(`📝 Test code preview: ${code.substring(0, 200)}...`);

      // Ensure temp directory exists
      await execAsync(`mkdir -p ${this.TEMP_DIR}`);

      const sessionId = `debug-${scenarioId}-${Date.now()}`;
      const tempFileName = `debug-${sessionId}.spec.ts`;
      const tempFilePath = path.join(this.TEMP_DIR, tempFileName);

      // Write the test code to a temporary file
      await writeFile(tempFilePath, code);
      console.log(`📝 Debug test file created: ${tempFilePath}`);

      // Start Playwright in debug mode with standalone config
      const debugProcess = spawn('npx', [
        'playwright',
        'test',
        tempFilePath,
        '--config=playwright.standalone.config.ts',
        '--debug'
      ], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          PWDEBUG: '1',  // Enable Playwright debug mode
        }
      });

      console.log(`🔢 Debug process PID: ${debugProcess.pid}`);

      // Store debug session
      this.debugSessions.set(sessionId, {
        sessionId,
        process: debugProcess,
        tempFile: tempFilePath,
      });

      // Handle process events
      debugProcess.stdout?.on('data', (data) => {
        console.log(`🐛 Debug stdout: ${data.toString()}`);
      });

      debugProcess.stderr?.on('data', (data) => {
        console.error(`🐛 Debug stderr: ${data.toString()}`);
      });

      debugProcess.on('close', async (code) => {
        console.log(`🏁 Debug process ended with code: ${code}`);

        // Clean up
        this.debugSessions.delete(sessionId);
        try {
          await unlink(tempFilePath);
          console.log(`🗑️ Debug temp file cleaned up: ${tempFilePath}`);
        } catch (error) {
          console.error('Failed to cleanup debug temp file:', error);
        }
      });

      debugProcess.on('error', (error) => {
        console.error(`❌ Debug process error:`, error);
        this.debugSessions.delete(sessionId);
      });

      return {
        sessionId,
        message: '디버그 모드가 시작되었습니다. 브라우저에서 단계별로 테스트를 실행할 수 있습니다.',
      };

    } catch (error) {
      console.error('❌ Failed to start debug mode:', error);
      throw new Error(`디버그 모드 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  static async stopDebugSession(sessionId: string): Promise<{ message: string }> {
    try {
      console.log(`🛑 Stopping debug session: ${sessionId}`);

      const session = this.debugSessions.get(sessionId);
      if (!session) {
        throw new Error('디버그 세션을 찾을 수 없습니다');
      }

      if (session.process) {
        session.process.kill('SIGTERM');
        console.log('🔪 Debug process killed');
      }

      // Clean up temp file
      try {
        await unlink(session.tempFile);
        console.log('🗑️ Debug temp file cleaned up');
      } catch (error) {
        console.error('Failed to cleanup debug temp file:', error);
      }

      this.debugSessions.delete(sessionId);

      return {
        message: '디버그 세션이 종료되었습니다',
      };

    } catch (error) {
      console.error('❌ Failed to stop debug session:', error);
      throw error;
    }
  }

  static getActiveDebugSessions(): string[] {
    return Array.from(this.debugSessions.keys());
  }
}