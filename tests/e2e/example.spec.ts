import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('http://localhost:5174/');
    await expect(page).toHaveTitle(/.+/);
  });

  test('should have visible main list', async ({ page }) => {
    await page.goto('http://localhost:5174/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should have visible brand header', async ({ page }) => {
    await page.goto('http://localhost:5174/');
    await expect(page.getByRole('img', { name: 'logo' })).toBeVisible();
  });
});