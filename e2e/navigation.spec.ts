import { test, expect } from '@playwright/test';
import { mockUSGSAPI } from './helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockUSGSAPI(page);
  });

  test('should navigate to stats', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.locator('.page-title')).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('.settings-page')).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.feed-btn').first()).toBeVisible();
  });
});
