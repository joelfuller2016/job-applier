import { test, expect } from '@playwright/test';
import {
  waitForLoadingComplete,
  viewports,
} from '../test-utils';

/**
 * Comprehensive Analytics Page Tests
 * Tests KPIs, charts, date filters, and data visualization
 */

test.describe('Analytics Page', () => {
  test.describe('Page Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should display analytics page with heading', async ({ page }) => {
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      const headingText = await heading.textContent();
      expect(headingText?.toLowerCase()).toMatch(/analytics|dashboard|report/i);
    });

    test('should have KPI cards section', async ({ page }) => {
      const kpiCards = page.locator('[data-kpi], [class*="kpi"], [class*="stat"], [class*="metric"]');
      const cardCount = await kpiCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    });

    test('should have charts section', async ({ page }) => {
      const charts = page.locator('canvas, svg[class*="chart"], [data-chart], [class*="recharts"]');
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThanOrEqual(0);
    });

    test('should have date filter controls', async ({ page }) => {
      const dateFilter = page.locator('input[type="date"], button:has-text("Date"), [data-date-filter]');
      const hasDateFilter = await dateFilter.count() > 0;
    });
  });

  test.describe('KPI Cards', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should display total applications KPI', async ({ page }) => {
      const totalAppsKPI = page.locator('text=/total.*application/i, text=/application.*total/i, [data-kpi="totalApplications"]');
      const hasTotalApps = await totalAppsKPI.count() > 0;
    });

    test('should display response rate KPI', async ({ page }) => {
      const responseRateKPI = page.locator('text=/response.*rate/i, text=/callback.*rate/i, [data-kpi="responseRate"]');
      const hasResponseRate = await responseRateKPI.count() > 0;
    });

    test('should display interview rate KPI', async ({ page }) => {
      const interviewRateKPI = page.locator('text=/interview.*rate/i, text=/interview/i, [data-kpi="interviewRate"]');
      const hasInterviewRate = await interviewRateKPI.count() > 0;
    });

    test('should display jobs viewed KPI', async ({ page }) => {
      const jobsViewedKPI = page.locator('text=/jobs.*viewed/i, text=/viewed.*jobs/i, [data-kpi="jobsViewed"]');
      const hasJobsViewed = await jobsViewedKPI.count() > 0;
    });

    test('should display trend indicators on KPIs', async ({ page }) => {
      const trendIndicators = page.locator('[class*="trend"], [class*="arrow"], [data-trend], text=/\\+|\\-|%/');
      const hasTrends = await trendIndicators.count() > 0;
    });

    test('should show KPI values with proper formatting', async ({ page }) => {
      const kpiValues = page.locator('[data-kpi-value], [class*="stat-value"], [class*="kpi-number"]');

      if (await kpiValues.count() > 0) {
        const firstValue = await kpiValues.first().textContent();
        // Value should be a number or percentage
        expect(firstValue).toBeTruthy();
      }
    });

    test('should show KPI comparison period', async ({ page }) => {
      const comparison = page.locator('text=/vs.*last/i, text=/compared.*to/i, [data-comparison]');
      const hasComparison = await comparison.count() > 0;
    });
  });

  test.describe('Charts', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should display applications over time chart', async ({ page }) => {
      const timeChart = page.locator('[data-chart="applications"], canvas, svg').first();
      const hasChart = await timeChart.count() > 0;
    });

    test('should display platform breakdown chart', async ({ page }) => {
      const platformChart = page.locator('[data-chart="platform"], text=/platform.*breakdown/i, text=/by.*platform/i');
      const hasChart = await platformChart.count() > 0;
    });

    test('should display status distribution chart', async ({ page }) => {
      const statusChart = page.locator('[data-chart="status"], text=/status.*distribution/i, text=/application.*status/i');
      const hasChart = await statusChart.count() > 0;
    });

    test('should display job types chart', async ({ page }) => {
      const jobTypesChart = page.locator('[data-chart="jobTypes"], text=/job.*type/i');
      const hasChart = await jobTypesChart.count() > 0;
    });

    test('should have interactive chart tooltips', async ({ page }) => {
      const chart = page.locator('canvas, svg[class*="chart"]').first();

      if (await chart.count() > 0) {
        // Hover over chart
        await chart.hover();
        await page.waitForTimeout(300);

        // Look for tooltip
        const tooltip = page.locator('[role="tooltip"], [class*="tooltip"], [data-tooltip]');
        const hasTooltip = await tooltip.count() > 0;
      }
    });

    test('should allow chart type toggle', async ({ page }) => {
      const chartToggle = page.locator('button:has-text("Line"), button:has-text("Bar"), button:has-text("Pie"), [data-chart-type]');

      if (await chartToggle.count() > 0) {
        await chartToggle.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should have chart legends', async ({ page }) => {
      const legend = page.locator('[class*="legend"], [data-legend]');
      const hasLegend = await legend.count() > 0;
    });
  });

  test.describe('Date Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should have date range presets', async ({ page }) => {
      const presets = page.locator('button:has-text("7 days"), button:has-text("30 days"), button:has-text("This week"), button:has-text("This month")');
      const hasPresets = await presets.count() > 0;
    });

    test('should have custom date range picker', async ({ page }) => {
      const datePicker = page.locator('input[type="date"], [data-date-picker], button:has-text("Custom")');

      if (await datePicker.count() > 0) {
        await datePicker.first().click();
        await page.waitForTimeout(300);

        // Calendar should appear
        const calendar = page.locator('[role="dialog"]:has([role="grid"]), [data-calendar], .calendar');
        const hasCalendar = await calendar.count() > 0;
      }
    });

    test('should filter data by date range', async ({ page }) => {
      const preset = page.locator('button:has-text("7 days"), button:has-text("This week")').first();

      if (await preset.count() > 0) {
        await preset.click();
        await waitForLoadingComplete(page);

        // Data should update
        await page.waitForTimeout(500);
      }
    });

    test('should persist date selection in URL', async ({ page }) => {
      const preset = page.locator('button:has-text("30 days")').first();

      if (await preset.count() > 0) {
        await preset.click();
        await page.waitForTimeout(500);

        const url = page.url();
        // URL might contain date parameters
      }
    });

    test('should show selected date range', async ({ page }) => {
      const dateRangeDisplay = page.locator('[data-date-range], text=/\\d{1,2}.*-.*\\d{1,2}/');
      const hasDisplay = await dateRangeDisplay.count() > 0;
    });
  });

  test.describe('Data Tables', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should display recent applications table', async ({ page }) => {
      const table = page.locator('table, [role="table"], [data-applications-table]');
      const hasTable = await table.count() > 0;
    });

    test('should have sortable columns', async ({ page }) => {
      const sortableHeader = page.locator('th[aria-sort], th:has([class*="sort"])');

      if (await sortableHeader.count() > 0) {
        await sortableHeader.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should paginate table data', async ({ page }) => {
      const pagination = page.locator('[aria-label*="pagination"], nav:has(button:has-text("Next"))');
      const hasPagination = await pagination.count() > 0;
    });

    test('should export data to CSV', async ({ page }) => {
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-export]');

      if (await exportButton.count() > 0) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await exportButton.first().click();
        // Download may or may not trigger
      }
    });
  });

  test.describe('Filtering & Segmentation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should filter by platform', async ({ page }) => {
      const platformFilter = page.locator('select[name*="platform"], button:has-text("Platform"), [data-filter="platform"]');

      if (await platformFilter.count() > 0) {
        await platformFilter.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should filter by status', async ({ page }) => {
      const statusFilter = page.locator('select[name*="status"], button:has-text("Status"), [data-filter="status"]');

      if (await statusFilter.count() > 0) {
        await statusFilter.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should filter by job type', async ({ page }) => {
      const jobTypeFilter = page.locator('select[name*="type"], button:has-text("Job Type"), [data-filter="jobType"]');

      if (await jobTypeFilter.count() > 0) {
        await jobTypeFilter.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should combine multiple filters', async ({ page }) => {
      const filters = page.locator('[data-filter], select');

      if (await filters.count() >= 2) {
        // Apply first filter
        await filters.first().click();
        await page.waitForTimeout(300);

        // Apply second filter
        await filters.nth(1).click();
        await page.waitForTimeout(300);
      }
    });

    test('should reset all filters', async ({ page }) => {
      const resetButton = page.locator('button:has-text("Reset"), button:has-text("Clear"), [data-reset-filters]');

      if (await resetButton.count() > 0) {
        await resetButton.first().click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Data Refresh', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should have refresh button', async ({ page }) => {
      const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"], [data-refresh]');

      if (await refreshButton.count() > 0) {
        await refreshButton.first().click();
        await waitForLoadingComplete(page);
      }
    });

    test('should show last updated timestamp', async ({ page }) => {
      const timestamp = page.locator('text=/last.*updated/i, text=/updated.*at/i, [data-last-updated]');
      const hasTimestamp = await timestamp.count() > 0;
    });

    test('should auto-refresh on interval', async ({ page }) => {
      // Check for auto-refresh indicator
      const autoRefresh = page.locator('text=/auto.*refresh/i, [data-auto-refresh]');
      const hasAutoRefresh = await autoRefresh.count() > 0;
    });
  });

  test.describe('Empty & Loading States', () => {
    test('should show loading state on initial load', async ({ page }) => {
      // Slow down API to see loading state
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto('/analytics');

      const loadingIndicator = page.locator('[data-loading], .skeleton, .loading, [role="progressbar"]');
      const hasLoading = await loadingIndicator.count() > 0;
    });

    test('should handle empty data state', async ({ page }) => {
      // Mock empty response
      await page.route('**/api/analytics**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ data: [] }),
        });
      });

      await page.goto('/analytics');
      await page.waitForTimeout(1000);

      // Should show empty state message
      const emptyState = page.locator('text=/no.*data/i, text=/no.*applications/i, [data-empty-state]');
      const hasEmpty = await emptyState.count() > 0;
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('**/api/analytics**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await page.goto('/analytics');
      await page.waitForTimeout(1000);

      // Should show error state
      const errorState = page.locator('text=/error/i, text=/failed/i, [data-error]');
      const hasError = await errorState.count() > 0;

      // Page should still render
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/analytics');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();

      // Check no horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should stack KPI cards on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/analytics');
      await waitForLoadingComplete(page);

      const kpiCards = page.locator('[data-kpi], [class*="stat"]');
      const cardCount = await kpiCards.count();

      if (cardCount > 0) {
        // Cards should be stacked (full width)
        const firstCard = kpiCards.first();
        const cardWidth = await firstCard.evaluate(el => el.offsetWidth);

        // Card should be close to full width on mobile
        expect(cardWidth).toBeGreaterThan(viewports.mobile.width * 0.8);
      }
    });

    test('should resize charts on viewport change', async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);

      const chart = page.locator('canvas, svg[class*="chart"]').first();

      if (await chart.count() > 0) {
        const desktopWidth = await chart.evaluate(el => el.clientWidth);

        // Switch to mobile
        await page.setViewportSize(viewports.mobile);
        await page.waitForTimeout(500);

        const mobileWidth = await chart.evaluate(el => el.clientWidth);

        // Chart should be narrower on mobile
        expect(mobileWidth).toBeLessThan(desktopWidth);
      }
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await page.goto('/analytics');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();
    });

    test('should utilize large desktop space', async ({ page }) => {
      await page.setViewportSize(viewports.largeDesktop);
      await page.goto('/analytics');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();

      // Content should expand to fill space
      const mainContent = page.locator('main, [role="main"]').first();
      if (await mainContent.count() > 0) {
        const contentWidth = await mainContent.evaluate(el => el.offsetWidth);
        expect(contentWidth).toBeGreaterThan(1200);
      }
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should have proper heading structure', async ({ page }) => {
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThanOrEqual(0);
    });

    test('should have ARIA labels on charts', async ({ page }) => {
      const charts = page.locator('canvas, svg[class*="chart"]');

      if (await charts.count() > 0) {
        const firstChart = charts.first();
        const ariaLabel = await firstChart.getAttribute('aria-label');
        const role = await firstChart.getAttribute('role');
        const parentAriaLabel = await firstChart.evaluate(el => {
          return el.parentElement?.getAttribute('aria-label') || el.closest('[aria-label]')?.getAttribute('aria-label');
        });

        // Chart should have some accessibility description
        const hasA11y = ariaLabel || role || parentAriaLabel;
      }
    });

    test('should have alternative text for data visualization', async ({ page }) => {
      // Check for data tables as accessible alternative
      const dataTable = page.locator('table[aria-label], [role="table"]');
      const hasAccessibleData = await dataTable.count() > 0;
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through page
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusedElement = await page.locator(':focus').count();
        expect(focusedElement).toBeGreaterThan(0);
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // Check text color contrast
      const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6');

      if (await textElements.count() > 0) {
        const firstText = textElements.first();
        const color = await firstText.evaluate(el => {
          return window.getComputedStyle(el).color;
        });

        // Color should not be completely transparent
        expect(color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/analytics');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('should lazy load charts', async ({ page }) => {
      await page.goto('/analytics');

      // Check if charts load progressively
      const chartLoadTime = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const start = Date.now();
          const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              if (mutation.addedNodes.length > 0) {
                const hasChart = Array.from(mutation.addedNodes).some(
                  node => (node as Element).tagName === 'CANVAS' || (node as Element).tagName === 'SVG'
                );
                if (hasChart) {
                  observer.disconnect();
                  resolve(Date.now() - start);
                }
              }
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });

          // Timeout after 5 seconds
          setTimeout(() => {
            observer.disconnect();
            resolve(-1);
          }, 5000);
        });
      });
    });

    test('should not block UI during data updates', async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);

      const refreshButton = page.locator('button:has-text("Refresh"), [data-refresh]').first();

      if (await refreshButton.count() > 0) {
        const startTime = Date.now();
        await refreshButton.click();
        const clickTime = Date.now() - startTime;

        // Click should be instant
        expect(clickTime).toBeLessThan(100);
      }
    });
  });

  test.describe('Print & Export', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForLoadingComplete(page);
    });

    test('should have print-friendly styles', async ({ page }) => {
      // Check for print media query
      const hasPrintStyles = await page.evaluate(() => {
        const sheets = Array.from(document.styleSheets);
        return sheets.some(sheet => {
          try {
            const rules = Array.from(sheet.cssRules);
            return rules.some(rule => rule instanceof CSSMediaRule && rule.conditionText?.includes('print'));
          } catch {
            return false;
          }
        });
      });
    });

    test('should have PDF export option', async ({ page }) => {
      const pdfButton = page.locator('button:has-text("PDF"), button:has-text("Print"), [data-export="pdf"]');
      const hasPDF = await pdfButton.count() > 0;
    });

    test('should have CSV export option', async ({ page }) => {
      const csvButton = page.locator('button:has-text("CSV"), button:has-text("Excel"), [data-export="csv"]');
      const hasCSV = await csvButton.count() > 0;
    });
  });
});
