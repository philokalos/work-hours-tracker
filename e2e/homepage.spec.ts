import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});

test('main content is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
