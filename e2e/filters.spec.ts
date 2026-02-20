import { test, expect } from '@playwright/test';
import { mockUSGSAPI } from './helpers';

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockUSGSAPI(page);
    await page.goto('/');
  });

  test('should show feed buttons', async ({ page }) => {
    await expect(page.locator('.feed-btn').first()).toBeVisible();
  });

  test('should have active feed button', async ({ page }) => {
    await expect(page.locator('.feed-btn.active')).toBeVisible();
  });

  test('should click different feed button', async ({ page }) => {
    const buttons = page.locator('.feed-btn');
    const count = await buttons.count();
    if (count > 1) {
      await buttons.nth(1).click();
      await expect(buttons.nth(1)).toHaveClass(/active/);
    }
  });

  test('should show magnitude filter', async ({ page }) => {
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });

  test('should show stats on dashboard', async ({ page }) => {
    await expect(page.locator('.stat-card').first()).toBeVisible();
  });
});
