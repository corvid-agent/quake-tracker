import { test, expect } from '@playwright/test';
import { mockUSGSAPI } from './helpers';

test.describe('Earthquake List & Detail', () => {
  test.beforeEach(async ({ page }) => {
    await mockUSGSAPI(page);
  });

  test('should show earthquake list', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.quake-item').first()).toBeVisible();
  });

  test('should show earthquake place', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.quake-place').first()).toBeVisible();
  });

  test('should show magnitude badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mag-badge').first()).toBeVisible();
  });

  test('should navigate to quake detail', async ({ page }) => {
    await page.goto('/');
    await page.locator('.quake-item').first().click();
    await expect(page.locator('.detail-card')).toBeVisible();
  });

  test('should show detail info', async ({ page }) => {
    await page.goto('/quake/us7000test0');
    await expect(page.locator('.detail-grid')).toBeVisible();
  });

  test('should have back button on detail', async ({ page }) => {
    await page.goto('/quake/us7000test0');
    await expect(page.locator('.back-btn')).toBeVisible();
  });
});
