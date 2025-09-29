import {exec, spawn} from 'child_process';
import {promisify} from 'util';
import {readFile, unlink} from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface ActiveProcess {
  sessionId: string;
  process: any;
  url?: string;
}

export class PlaywrightRecorder {
  private static activeProcesses: Map<string, ActiveProcess> = new Map();
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp');

  private static async killPlaywrightProcesses(): Promise<void> {
    console.log('🔪 Killing all Playwright-related processes...');

    try {
      if (process.platform === 'darwin' || process.platform === 'linux') {
        // Unix systems
        const commands = [
          'pkill -f "playwright.*codegen" || true',
          'pkill -f "chromium.*--remote-debugging-port" || true',
          'pkill -f "chrome.*--remote-debugging-port" || true',
          'pkill -f "firefox.*--remote-debugging-port" || true',
          'pkill -f "webkit.*--remote-debugging-port" || true',
          'pkill -f "node.*playwright" || true'
        ];

        for (const cmd of commands) {
          try {
            await execAsync(cmd);
            console.log(`✅ Executed: ${cmd}`);
          } catch (error) {
            console.log(`⚠️ Command failed (expected): ${cmd}`);
          }
        }
      } else if (process.platform === 'win32') {
        // Windows
        const commands = [
          'taskkill /F /IM chrome.exe /T 2>nul || echo "No chrome processes"',
          'taskkill /F /IM chromium.exe /T 2>nul || echo "No chromium processes"',
          'taskkill /F /IM firefox.exe /T 2>nul || echo "No firefox processes"',
          'wmic process where "commandline like \'%playwright%\'" delete 2>nul || echo "No playwright processes"',
          'wmic process where "commandline like \'%codegen%\'" delete 2>nul || echo "No codegen processes"'
        ];

        for (const cmd of commands) {
          try {
            await execAsync(cmd);
            console.log(`✅ Executed: ${cmd}`);
          } catch (error) {
            console.log(`⚠️ Command failed (expected): ${cmd}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in killPlaywrightProcesses:', error);
    }
  }

  static async startRecording(url: string, sessionId: string): Promise<{ sessionId: string; message: string }> {
    try {
      console.log(`🎬 Starting recording for URL: ${url}, Session: ${sessionId}`);

      // Clean up old sessions first (temporarily disabled for debugging)
      console.log('🧹 Skipping cleanup for now...');
      // await RecordingService.cleanupOldSessions();

      // Check if there's already an active session (simplified)
      if (this.activeProcesses.has(sessionId)) {
        console.log('❌ Active session already exists');
        throw new Error('이미 활성화된 레코딩 세션이 있습니다');
      }

      // Ensure temp directory exists
      console.log(`📁 Creating temp directory: ${this.TEMP_DIR}`);
      await execAsync(`mkdir -p ${this.TEMP_DIR}`);

      const outputFile = path.join(this.TEMP_DIR, `recording-${sessionId}.spec.ts`);
      console.log(`📝 Output file: ${outputFile}`);

      // Simple session object (no database for now)
      const session = {
        id: sessionId,
        url,
        outputFile,
        status: 'starting' as const
      };
      console.log(`✅ Session created with ID: ${session.id}`);

      // Start Playwright codegen in the background
      const command = [
        'playwright',
        'codegen',
        url,
        '--output',
        outputFile,
        '--browser',
        'chromium',
        '--viewport-size=1280,720'
      ];

      // For macOS, try without DISPLAY variable first
      const isMac = process.platform === 'darwin';
      if (isMac) {
        console.log('🍎 Detected macOS, adjusting command...');
      }

      console.log(`🚀 Starting Playwright command: npx ${command.join(' ')}`);
      console.log(`📍 Platform: ${process.platform}`);
      console.log(`📁 Working directory: ${process.cwd()}`);

      const codegenProcess = spawn('npx', command, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin, pipe stdout and stderr
        detached: process.platform !== 'win32', // Detach on Unix systems for better process group management
        env: {
          ...process.env,
          ...(isMac ? {
            // macOS specific environment variables for better browser window handling
            PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '',
          } : {
            DISPLAY: process.env.DISPLAY || ':0'
          }),
        }
      });

      console.log(`🔢 Process PID: ${codegenProcess.pid}`);

      // Store active process BEFORE setting up event handlers
      const activeProcessEntry = {
        sessionId: session.id,
        process: codegenProcess,
        url: url,
      };

      this.activeProcesses.set(session.id, activeProcessEntry);
      console.log(`📝 Stored active process for session: ${session.id}`);

      // Handle process events
      codegenProcess.stdout?.on('data', (data) => {
        console.log(`📤 Playwright stdout: ${data.toString()}`);
      });

      codegenProcess.stderr?.on('data', (data) => {
        console.error(`📤 Playwright stderr: ${data.toString()}`);
      });

      codegenProcess.on('close', async (code) => {
        console.log(`🏁 Process ended with code: ${code} for session: ${session.id}`);
        // Don't delete immediately - let the stop function handle it
        // this.activeProcesses.delete(session.id);
      });

      codegenProcess.on('error', async (error) => {
        console.error(`❌ Process error for session ${session.id}:`, error);
        // Only delete on actual error, not on normal close
        this.activeProcesses.delete(session.id);
      });

      codegenProcess.on('spawn', () => {
        console.log(`✅ Playwright process spawned successfully for session: ${session.id}`);
        console.log(`📊 Active processes count: ${this.activeProcesses.size}`);
      });

      return {
        sessionId: session.id,
        message: '레코딩이 시작되었습니다. 열린 브라우저에서 웹사이트와 상호작용하세요.',
      };

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw new Error(`레코딩 세션 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  static async stopRecording(sessionId: string, saveCode: boolean = true): Promise<{ code: string; message: string }> {
    try {
      console.log(`🛑 Stopping recording for session: ${sessionId}, saveCode: ${saveCode}`);
      console.log(`📊 Current active processes: ${Array.from(this.activeProcesses.keys()).join(', ')}`);
      console.log(`📊 Total active processes count: ${this.activeProcesses.size}`);

      // Get active process
      const activeProcess = this.activeProcesses.get(sessionId);
      const outputFile = path.join(this.TEMP_DIR, `recording-${sessionId}.spec.ts`);

      if (!activeProcess) {
        console.log('⚠️ Active process not found, attempting cleanup anyway...');
        console.log(`🔍 Available sessions: ${Array.from(this.activeProcesses.keys()).join(', ')}`);

        // Even if the process is not found, try to read any existing file first
        let generatedCode = '';
        if (saveCode) {
          try {
            console.log(`📖 Attempting to read file without active process: ${outputFile}`);
            generatedCode = await readFile(outputFile, 'utf-8');
            console.log(`✅ Successfully read file, length: ${generatedCode.length}`);
          } catch (readError) {
            console.log('📖 No file found to read:', readError.message);
          }
        }

        // Clean up temp file
        try {
          await unlink(outputFile);
          console.log('🗑️ Cleaned up temp file');
        } catch (unlinkError) {
          console.log('No temp file to clean up');
        }

        // Try to kill any remaining playwright processes
        await this.killPlaywrightProcesses();

        return {
          code: generatedCode,
          message: saveCode ? (generatedCode ? '레코딩이 완료되었습니다' : '레코딩 파일을 찾을 수 없습니다') : '레코딩이 취소되었습니다',
        };
      }

      if (activeProcess.process) {
        // Kill the process
        console.log('🔪 Killing Playwright process...');
        try {
          // First try graceful termination
          activeProcess.process.kill('SIGTERM');
          console.log('📤 Sent SIGTERM to process');

          // Wait a bit and then force kill if needed
          await new Promise(resolve => setTimeout(resolve, 2000));

          if (activeProcess.process && !activeProcess.process.killed) {
            console.log('🔪 Force killing process with SIGKILL...');
            activeProcess.process.kill('SIGKILL');
          }

          // Also kill any child processes (browser instances)
          if (activeProcess.process.pid) {
            try {
              if (process.platform === 'darwin' || process.platform === 'linux') {
                // Kill the entire process group
                await execAsync(`pkill -P ${activeProcess.process.pid} || true`);
                console.log(`🔪 Killed child processes of PID ${activeProcess.process.pid}`);

                // For detached processes, also try to kill the process group
                if (activeProcess.process.detached) {
                  try {
                    process.kill(-activeProcess.process.pid, 'SIGTERM');
                    console.log(`🔪 Killed process group ${activeProcess.process.pid}`);
                  } catch (pgKillError) {
                    console.log('Process group kill failed (expected):', pgKillError.message);
                  }
                }
              } else if (process.platform === 'win32') {
                // Windows - kill child processes
                await execAsync(`wmic process where ParentProcessId=${activeProcess.process.pid} delete || echo "No child processes"`);
              }
            } catch (childKillError) {
              console.error('Error killing child processes:', childKillError);
            }
          }

        } catch (killError) {
          console.error('Error killing process:', killError);
        }

        this.activeProcesses.delete(sessionId);

        // Additional cleanup - kill any remaining playwright/browser processes
        await this.killPlaywrightProcesses();

        // Wait a moment for the file to be written and poll for file existence
        console.log('⏱️ Waiting for file to be written...');

        // Poll for file existence with timeout
        let fileExists = false;
        const maxWaitTime = 10000; // 10 seconds
        const pollInterval = 500; // 500ms
        const startTime = Date.now();

        while (!fileExists && (Date.now() - startTime) < maxWaitTime) {
          try {
            await readFile(outputFile, 'utf-8');
            fileExists = true;
            console.log('✅ File detected and readable');
          } catch {
            console.log(`⏳ File not ready yet, waiting... (${Math.round((Date.now() - startTime) / 1000)}s)`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        }

        if (!fileExists) {
          console.log('⚠️ File was not created within timeout period');
        }
      }

      // Try to read the generated code if saveCode is true
      let generatedCode = '';
      if (saveCode) {
        try {
          console.log(`📖 Reading generated code from: ${outputFile}`);
          generatedCode = await readFile(outputFile, 'utf-8');
          console.log(`✅ Code read successfully, length: ${generatedCode.length}`);
        } catch (readError) {
          console.error('Failed to read generated code:', readError);
          console.log('🔄 Using default template instead');
          // Use the original URL from the session if available
          const urlFromSession = this.getSessionUrl(sessionId) || 'https://example.com';
          generatedCode = this.getDefaultTestCode(urlFromSession);
        }
      }

      // Clean up temporary file
      try {
        await unlink(outputFile);
        console.log('🗑️ Temporary file cleaned up');
      } catch (unlinkError) {
        console.error('Failed to cleanup temp file:', unlinkError);
      }

      console.log(`📤 Returning result: saveCode=${saveCode}, codeLength=${generatedCode.length}`);

      return {
        code: generatedCode,
        message: saveCode ? '레코딩이 중지되고 코드가 생성되었습니다' : '레코딩이 취소되었습니다',
      };

    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      throw error;
    }
  }

  static async getRecordingStatus(sessionId: string) {
    try {
      const activeProcess = this.activeProcesses.get(sessionId);
      if (!activeProcess) {
        return null;
      }

      return {
        sessionId: sessionId,
        status: 'RECORDING',
        url: 'unknown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to get recording status:', error);
      return null;
    }
  }

  static async startHeadlessRecording(url: string): Promise<string> {
    try {
      const sessionId = `headless-${Date.now()}`;
      const outputFile = path.join(this.TEMP_DIR, `headless-${sessionId}.spec.ts`);

      // Ensure temp directory exists
      await execAsync(`mkdir -p ${this.TEMP_DIR}`);

      // Generate basic interaction code using Playwright's browser automation
      const code = await this.generateInteractiveCode(url);

      return code;

    } catch (error) {
      console.error('Failed to generate headless recording:', error);
      throw new Error('Failed to generate interactive code');
    }
  }

  private static async generateInteractiveCode(url: string): Promise<string> {
    // This creates a more interactive template that users can build upon
    return `import { test, expect } from '@playwright/test';

test('Interactive test for ${url}', async ({ page }) => {
  // Navigate to the website
  await page.goto('${url}');

  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');

  // Take a screenshot of the initial state
  await page.screenshot({ path: 'initial-state.png', fullPage: true });

  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  expect(title).toBeTruthy();

  // Example interactions - customize these based on your needs:

  // 1. Find and interact with common elements
  // await page.click('button'); // Click a button
  // await page.fill('input[name="email"]', 'test@example.com'); // Fill input
  // await page.selectOption('select', 'value'); // Select dropdown option

  // 2. Wait for specific elements
  // await page.waitForSelector('h1'); // Wait for heading
  // await page.waitForText('Welcome'); // Wait for text

  // 3. Assert content exists
  // await expect(page.locator('h1')).toBeVisible();
  // await expect(page).toHaveURL(/.*dashboard.*/);

  // 4. Handle forms
  // await page.fill('input[type="text"]', 'test input');
  // await page.click('button[type="submit"]');
  // await page.waitForSelector('.success-message');

  // 5. Navigation testing
  // await page.click('a[href="/about"]');
  // await expect(page).toHaveURL(/.*about.*/);

  // Take a final screenshot
  await page.screenshot({ path: 'final-state.png', fullPage: true });
});

// Additional test for form interactions
test('Form interaction test for ${url}', async ({ page }) => {
  await page.goto('${url}');

  // Look for forms on the page
  const forms = await page.locator('form').count();
  console.log('Number of forms found:', forms);

  if (forms > 0) {
    // Test the first form found
    const firstForm = page.locator('form').first();

    // Find input fields in the form
    const inputs = await firstForm.locator('input').count();
    console.log('Number of inputs in first form:', inputs);

    // Example: Fill the first input if it exists
    if (inputs > 0) {
      const firstInput = firstForm.locator('input').first();
      const inputType = await firstInput.getAttribute('type');

      if (inputType === 'email') {
        await firstInput.fill('test@example.com');
      } else if (inputType === 'text' || inputType === 'search') {
        await firstInput.fill('test input');
      }
    }
  }
});

// Test for accessibility and performance
test('Accessibility and performance test for ${url}', async ({ page }) => {
  await page.goto('${url}');

  // Check for basic accessibility features
  const hasHeadings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  console.log('Number of headings found:', hasHeadings);

  // Check for alt attributes on images
  const images = await page.locator('img').count();
  const imagesWithAlt = await page.locator('img[alt]').count();
  console.log(\`Images: \${images}, Images with alt text: \${imagesWithAlt}\`);

  // Basic performance check
  const navigationTiming = await page.evaluate(() => {
    return {
      loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
    };
  });

  console.log('Page load timing:', navigationTiming);

  // Assert reasonable load time (less than 5 seconds)
  expect(navigationTiming.loadComplete).toBeLessThan(5000);
});`;
  }

  private static getSessionUrl(sessionId: string): string | null {
    const activeProcess = this.activeProcesses.get(sessionId);
    return activeProcess?.url || null;
  }

  private static getDefaultTestCode(url: string): string {
    return `import { test, expect } from '@playwright/test';

test('Basic test for ${url}', async ({ page }) => {
  await page.goto('${url}');
  await page.waitForLoadState('networkidle');

  const title = await page.title();
  expect(title).toBeTruthy();

  await page.screenshot({ path: 'screenshot.png' });
});`;
  }
}