import { test, expect } from '@playwright/test';

test('시나리오 테스트', async ({ page }) => {
  await page.goto('https://online.metlife.co.kr/');
  await page.getByRole('button', { name: '오늘 하루 보지않기' }).click();
  await page.getByRole('button', { name: '고마워요 소방관보험' }).click();
  await page.getByRole('button', { name: '보험료 간편계산' }).click();
  await page.getByRole('textbox', { name: '생년월일' }).fill('19970629');
  await page.getByRole('button', { name: '보험료 확인하기' }).click();
  await page.getByRole('button', { name: '가입하기' }).click();
  await page.getByRole('button', { name: '확인' }).click();
  await page.locator('input[type="text"]').fill('이병우');
  await page.locator('input[type="text"]').press('Tab');
  await page.locator('input[type="text"]').fill('이병우');
  await page.getByRole('button', { name: '내국인' }).press('Tab');
  await page.getByRole('button', { name: '외국인' }).press('Tab');
  await page.getByText('010').press('Tab');
  await page.getByRole('textbox').nth(2).fill('9235');
  await page.getByRole('textbox').nth(3).fill('0972');
});