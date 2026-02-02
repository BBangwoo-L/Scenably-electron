const { chromium } = require('playwright');
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
})();