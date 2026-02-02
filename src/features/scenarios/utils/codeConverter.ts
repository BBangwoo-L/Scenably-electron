/**
 * Playwright 코드 변환 유틸리티
 */

/**
 * Codegen 형태의 코드를 Test 형태로 변환
 */
export function convertCodegenToTest(codegenCode: string): string {
  console.log('🔄 Converting Codegen to Test format');

  const lines = codegenCode.split('\n');
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
        continue;
      }

      if (trimmed.startsWith('await page.close()') ||
          trimmed.startsWith('await context.close()') ||
          trimmed.startsWith('await browser.close()')) {
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

  const testCode = `import { test, expect } from '@playwright/test';

test('시나리오 테스트', async ({ page }) => {
${actionLines.join('\n')}
});`;

  return testCode;
}

/**
 * 코드가 Codegen 형태인지 확인
 */
export function isCodegenFormat(code: string): boolean {
  return (
    code.includes('const { chromium }') ||
    code.includes('require(\'playwright\')') ||
    code.includes('const browser = await chromium.launch')
  );
}

/**
 * 코드가 Test 형태인지 확인
 */
export function isTestFormat(code: string): boolean {
  return (
    code.includes('import { test, expect }') &&
    code.includes('test(') &&
    code.includes('async ({ page }) =>')
  );
}

/**
 * 저장 전 코드 정규화 - Codegen을 Test로 자동 변환
 */
export function normalizeCodeForSaving(code: string): string {
  console.log('🔍 normalizeCodeForSaving called with code:', code.substring(0, 100) + '...');

  // 이미 Test 형태면 그대로 반환
  if (isTestFormat(code)) {
    console.log('✅ Code is already in Test format');
    return code;
  }

  // Codegen 형태면 Test로 변환
  if (isCodegenFormat(code)) {
    console.log('🔄 Converting Codegen to Test format for saving');
    const converted = convertCodegenToTest(code);
    console.log('✅ Conversion completed:', converted.substring(0, 100) + '...');
    return converted;
  }

  // 알 수 없는 형태면 그대로 반환 (사용자가 직접 작성한 코드일 수 있음)
  console.log('⚠️ Unknown code format, saving as-is');
  return code;
}