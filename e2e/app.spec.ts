import { test, expect } from '@playwright/test';
import { mockUSGSAPI } from './helpers';

test.describe('App', () => {
  test('should load dashboard', async ({ page }) => {
    await mockUSGSAPI(page);
    await page.goto('/');
    await expect(page.locator('.quake-list')).toBeVisible();
  });

  test('should show top bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.top-bar')).toBeVisible();
  });

  test('should show stat cards', async ({ page }) => {
    await mockUSGSAPI(page);
    await page.goto('/');
    await expect(page.locator('.stat-card').first()).toBeVisible();
  });
});
