// 변환 테스트용 코드
const testCodegen = `const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://online.metlife.co.kr/');
  await page.getByRole('button', { name: '오늘 하루 보지않기' }).click();
  await page.getByRole('button', { name: '고마워요 소방관보험' }).click();
  await page.getByRole('button', { name: '보험료 간편계산' }).click();
  await page.getByRole('textbox', { name: '생년월일' }).fill('19970629');
  await page.getByRole('button', { name: '보험료 확인하기' }).click();
  await page.close();
  // ---------------------
  await context.close();
  await browser.close();
})();`;

// 변환 함수 (디버거에서 가져옴)
function convertCodegenToTest(codegenCode) {
    const lines = codegenCode.split('\n');
    const actionLines = [];
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

console.log('=== Original Codegen ===');
console.log(testCodegen);
console.log('\n=== Converted Test ===');
console.log(convertCodegenToTest(testCodegen));