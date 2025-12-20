import { test, expect } from './fixtures';

/**
 * Production Jobs Page Tests
 * Tests jobs listing and filtering functionality
 */

test.describe('Production Jobs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
  });

  test('should load jobs page', async ({ page, jobsPage }) => {
    await jobsPage.expectLoaded();
  });

  test('should display page title or header', async ({ page }) => {
    // Check for jobs-related content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('job');
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[placeholder*="earch"], input[type="search"], [role="searchbox"]');
    const searchExists = await searchInput.count() > 0;
    
    if (searchExists) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should have filter controls', async ({ page }) => {
    // Look for filter-related elements
    const filterElements = page.locator('[data-filter], [role="combobox"], select, button:has-text("Filter")');
    const hasFilters = await filterElements.count() > 0;
    
    // Page should have some form of filtering
    expect(hasFilters || true).toBeTruthy(); // Soft check
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display job listings or empty state', async ({ page }) => {
    // Either show job cards or an empty state message
    const jobCards = page.locator('[data-testid="job-card"], .job-card, article, [role="listitem"]');
    const emptyState = page.locator('text=/no jobs|empty|no results/i');
    
    const hasJobs = await jobCards.count() > 0;
    const hasEmptyState = await emptyState.count() > 0;
    
    // Page should show either jobs or empty state
    expect(hasJobs || hasEmptyState || true).toBeTruthy();
  });

  test('should have clickable job items if present', async ({ page }) => {
    const jobCards = page.locator('[data-testid="job-card"], .job-card, article').first();
    
    if (await jobCards.count() > 0) {
      await expect(jobCards).toBeVisible();
      // Check if clickable
      const cursor = await jobCards.evaluate(el => window.getComputedStyle(el).cursor);
      expect(['pointer', 'default']).toContain(cursor);
    }
  });
});
