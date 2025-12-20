import { test, expect } from './fixtures';

/**
 * Production Navigation Tests
 * Tests real application navigation without mock data
 */

test.describe('Production Navigation', () => {
  test('should load home page', async ({ page, homePage }) => {
    await homePage.goto();
    await homePage.expectLoaded();
    
    // Check for main UI elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to all main pages', async ({ page }) => {
    // Increase timeout for this comprehensive test
    test.setTimeout(120000);

    // Home
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Jobs
    await page.goto('/jobs');
    await expect(page).toHaveURL('/jobs');
    await expect(page.locator('body')).toBeVisible();

    // Applications
    await page.goto('/applications');
    await expect(page).toHaveURL('/applications');
    await expect(page.locator('body')).toBeVisible();

    // Analytics - may be slow
    await page.goto('/analytics', { timeout: 60000 });
    await expect(page).toHaveURL('/analytics');
    await expect(page.locator('body')).toBeVisible();

    // Profile
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('body')).toBeVisible();

    // Automation
    await page.goto('/automation');
    await expect(page).toHaveURL('/automation');
    await expect(page.locator('body')).toBeVisible();

    // Hunt
    await page.goto('/hunt');
    await expect(page).toHaveURL('/hunt');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working sidebar navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check sidebar exists and has navigation links
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    await expect(sidebar).toBeVisible();
  });
});
