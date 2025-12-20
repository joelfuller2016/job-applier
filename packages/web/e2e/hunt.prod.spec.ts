import { test, expect } from './fixtures';

/**
 * Production Hunt Page Tests
 * Tests job hunting functionality
 */

test.describe('Production Hunt Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hunt');
  });

  test('should load hunt page', async ({ page, huntPage }) => {
    await huntPage.expectLoaded();
  });

  test('should display hunt content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/hunt|search|find|discover/);
  });

  test('should have search or hunt controls', async ({ page }) => {
    const controls = page.locator('input, button, select, [role="searchbox"]');
    const hasControls = await controls.count() > 0;
    expect(hasControls).toBeTruthy();
  });

  test('should have action buttons', async ({ page }) => {
    const buttons = page.locator('button');
    const hasButtons = await buttons.count() > 0;
    expect(hasButtons).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});
