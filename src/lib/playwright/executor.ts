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

      // Process file upload paths in code
      let processedCode = code;

      // Import TestFileManager if setInputFiles is used but not imported
      if (code.includes('setInputFiles') && !code.includes('TestFileManager')) {
        // Add require at the top with absolute path
        const importLines = `
const path = require('path');
const helperPath = path.join(process.cwd(), 'temp', 'test-utils', 'file-helpers');
console.log('시도할 파일 경로:', helperPath);
const { TestFileManager } = require(helperPath);
`;
        processedCode = importLines + processedCode;

        // Add file manager setup in test
        processedCode = processedCode.replace(
          /test\(['"`]([^'"`]+)['"`],\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{/,
          `test('$1', async ({ page }) => {
  const fileManager = new TestFileManager();

  try {`
        );

        // Add cleanup at the end
        processedCode = processedCode.replace(/}\);$/, `  } finally {
    await fileManager.cleanup();
  }
});`);

        // Replace static file paths with dynamic file creation and fix selectors
        processedCode = processedCode.replace(
          /(await\s+page\..*?)\.setInputFiles\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
          (match, selector, filePath) => {
            const fileName = filePath.split('/').pop()?.split('.')[0] || 'test-file';
            const extension = filePath.split('.').pop() || 'png';

            // Create appropriate file based on extension
            let fileCreationMethod = '';
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension.toLowerCase())) {
              fileCreationMethod = `await fileManager.createTestImage({ filename: '${fileName}', extension: '${extension}' })`;
            } else if (extension.toLowerCase() === 'pdf') {
              fileCreationMethod = `await fileManager.createTestPDF({ filename: '${fileName}' })`;
            } else {
              fileCreationMethod = `await fileManager.createTestTextFile({ filename: '${fileName}', extension: '${extension}' })`;
            }

            return `// 숨겨진 파일 input 자동 감지 및 업로드
    const fileInputs = await page.locator('input[type="file"]').all();
    const visibleFileInput = await fileInputs.find(async (input) => {
      const isVisible = await input.isVisible();
      return isVisible;
    });

    const hiddenFileInput = await fileInputs.find(async (input) => {
      const isHidden = !(await input.isVisible());
      return isHidden;
    });

    const targetInput = visibleFileInput || hiddenFileInput || fileInputs[0];
    if (targetInput) {
      // 파일 업로드 시도
      await targetInput.setInputFiles(${fileCreationMethod});

      // 파일 업로드 검증 및 재시도 로직
      let uploadSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!uploadSuccess && retryCount < maxRetries) {
        // 파일이 제대로 들어갔는지 확인
        const uploadedFiles = await targetInput.evaluate((input: HTMLInputElement) => {
          return {
            fileCount: input.files?.length || 0,
            fileName: input.files?.[0]?.name || '',
            fileSize: input.files?.[0]?.size || 0
          };
        });

        console.log(\`업로드 시도 \${retryCount + 1}: 파일 수=\${uploadedFiles.fileCount}, 파일명=\${uploadedFiles.fileName}\`);

        if (uploadedFiles.fileCount > 0) {
          console.log('✅ 파일 업로드 성공!');
          uploadSuccess = true;
        } else {
          console.warn(\`❌ 파일 업로드 실패 (시도 \${retryCount + 1}/\${maxRetries})\`);
          retryCount++;

          if (retryCount < maxRetries) {
            // 잠시 대기 후 재시도
            await page.waitForTimeout(500);
            console.log('🔄 파일 업로드 재시도 중...');

            // 다른 input 요소들도 시도해보기
            if (retryCount === 1 && hiddenFileInput && targetInput !== hiddenFileInput) {
              console.log('숨겨진 input으로 재시도...');
              await hiddenFileInput.setInputFiles(${fileCreationMethod});
              const retryResult = await hiddenFileInput.evaluate((input: HTMLInputElement) => input.files?.length || 0);
              if (retryResult > 0) {
                console.log('✅ 숨겨진 input으로 업로드 성공!');
                uploadSuccess = true;
              }
            } else if (retryCount === 2 && visibleFileInput && targetInput !== visibleFileInput) {
              console.log('보이는 input으로 재시도...');
              await visibleFileInput.setInputFiles(${fileCreationMethod});
              const retryResult = await visibleFileInput.evaluate((input: HTMLInputElement) => input.files?.length || 0);
              if (retryResult > 0) {
                console.log('✅ 보이는 input으로 업로드 성공!');
                uploadSuccess = true;
              }
            } else {
              // 동일한 input으로 재시도
              await targetInput.setInputFiles(${fileCreationMethod});
            }
          }
        }
      }

      if (!uploadSuccess) {
        console.error('❌ 모든 재시도 실패: 파일 업로드를 완료할 수 없습니다.');
      }
    } else {
      console.warn('파일 input을 찾을 수 없습니다.');
    }`;
          }
        );
      }

      // Write the processed test code to a temporary file
      console.log(`📝 Writing test code to: ${tempFilePath}`);
      console.log(`📝 Code length: ${processedCode.length} characters`);
      await writeFile(tempFilePath, processedCode);

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
        '--debug',
        '--headed',
        '--max-failures=0'  // Don't stop on failures
      ], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          PWDEBUG: 'console',  // Keep browser open even after failures
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