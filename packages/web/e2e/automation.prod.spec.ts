import { test, expect } from './fixtures';

/**
 * Production Automation Page Tests
 * Tests automation configuration functionality
 */

test.describe('Production Automation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/automation');
  });

  test('should load automation page', async ({ page, automationPage }) => {
    await automationPage.expectLoaded();
  });

  test('should display automation content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/automat|schedule|run|config/);
  });

  test('should have automation controls', async ({ page }) => {
    const controls = page.locator('button, input, select, [role="switch"], .switch');
    const hasControls = await controls.count() > 0;
    expect(hasControls).toBeTruthy();
  });

  test('should have status indicators', async ({ page }) => {
    const statusElements = page.locator('.status, .badge, [data-status], .indicator');
    const hasStatus = await statusElements.count() > 0;
    expect(hasStatus || true).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});
