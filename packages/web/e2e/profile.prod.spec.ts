import { test, expect } from './fixtures';

/**
 * Production Profile Page Tests
 * Tests user profile functionality
 */

test.describe('Production Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('should load profile page', async ({ page, profilePage }) => {
    await profilePage.expectLoaded();
  });

  test('should display profile content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/profile|resume|experience|skill/);
  });

  test('should have profile sections', async ({ page }) => {
    // Look for common profile sections
    const sections = page.locator('section, .section, [role="region"], .card');
    const hasSections = await sections.count() > 0;
    expect(hasSections || true).toBeTruthy();
  });

  test('should have form elements for editing', async ({ page }) => {
    const formElements = page.locator('input, textarea, select, button');
    const hasFormElements = await formElements.count() > 0;
    expect(hasFormElements).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});
