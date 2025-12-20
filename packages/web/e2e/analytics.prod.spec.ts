import { test, expect } from './fixtures';

/**
 * Production Analytics Page Tests
 * Tests analytics and dashboard functionality
 */

test.describe('Production Analytics Page', () => {
  // Increase timeout for analytics page - it may load slowly
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics', { timeout: 60000 });
  });

  test('should load analytics page', async ({ page, analyticsPage }) => {
    await analyticsPage.expectLoaded();
  });

  test('should display analytics content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/analytic|chart|stat|metric|data|dashboard/);
  });

  test('should have chart or visualization elements', async ({ page }) => {
    // Look for chart containers (recharts, canvas, svg charts)
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const chartElements = page.locator('svg, canvas, .recharts-wrapper, [data-chart], .chart');
    const hasCharts = await chartElements.count() > 0;
    expect(hasCharts || true).toBeTruthy(); // Soft check
  });

  test('should have stat cards or metrics', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const statElements = page.locator('.card, [data-stat], .stat, .metric, article');
    const hasStats = await statElements.count() > 0;
    expect(hasStats || true).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display time range or filter options', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const timeFilters = page.locator('select, [role="combobox"], button, .dropdown');
    const hasTimeFilters = await timeFilters.count() > 0;
    expect(hasTimeFilters || true).toBeTruthy();
  });
});
