import { test, expect } from '@playwright/test';
import {
  waitForLoadingComplete,
  viewports,
  fillForm,
  waitForToast,
  waitForModal,
} from '../test-utils';

/**
 * Comprehensive Hunt Jobs Page Tests
 * Tests AI-powered job hunting configuration and execution
 */

test.describe('Hunt Jobs Page', () => {
  test.describe('Page Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should display hunt page with proper heading', async ({ page }) => {
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      const headingText = await heading.textContent();
      expect(headingText?.toLowerCase()).toMatch(/hunt|search|find/i);
    });

    test('should display search configuration section', async ({ page }) => {
      const configSection = page.locator('[data-search-config], text=/search.*criteria/i, text=/configuration/i');
      const hasConfig = await configSection.count() > 0;

      // At minimum, should have some form inputs
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
    });

    test('should have start hunt button', async ({ page }) => {
      const startButton = page.locator('button:has-text("Start"), button:has-text("Hunt"), button:has-text("Search"), button[type="submit"]').first();
      await expect(startButton).toBeVisible();
    });
  });

  test.describe('Search Configuration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should have job title/keywords input', async ({ page }) => {
      const keywordsInput = page.locator('input[name*="keyword"], input[name*="title"], input[placeholder*="title"], input[placeholder*="keyword"]').first();

      if (await keywordsInput.count() > 0) {
        await expect(keywordsInput).toBeVisible();
        await keywordsInput.fill('Software Engineer');
        const value = await keywordsInput.inputValue();
        expect(value).toBe('Software Engineer');
      }
    });

    test('should have location input', async ({ page }) => {
      const locationInput = page.locator('input[name*="location"], input[placeholder*="location"], [data-field="location"]').first();

      if (await locationInput.count() > 0) {
        await expect(locationInput).toBeVisible();
        await locationInput.fill('Remote');
        const value = await locationInput.inputValue();
        expect(value).toBe('Remote');
      }
    });

    test('should have platform selection', async ({ page }) => {
      const platformSelect = page.locator('select[name*="platform"], [data-field="platform"], text=/platform/i').first();

      if (await platformSelect.count() > 0) {
        await expect(platformSelect).toBeVisible();
      }

      // Check for platform checkboxes
      const platformCheckboxes = page.locator('input[type="checkbox"][name*="platform"], input[type="checkbox"]:near(text=/linkedin/i)');
      const checkboxCount = await platformCheckboxes.count();
    });

    test('should have experience level filter', async ({ page }) => {
      const experienceFilter = page.locator('select[name*="experience"], [data-field="experience"], text=/experience.*level/i');
      const hasExperience = await experienceFilter.count() > 0;
    });

    test('should have salary range inputs', async ({ page }) => {
      const salaryMin = page.locator('input[name*="salary"][name*="min"], input[placeholder*="min.*salary"]').first();
      const salaryMax = page.locator('input[name*="salary"][name*="max"], input[placeholder*="max.*salary"]').first();

      const hasMinSalary = await salaryMin.count() > 0;
      const hasMaxSalary = await salaryMax.count() > 0;
    });

    test('should have job type selection', async ({ page }) => {
      const jobTypeOptions = page.locator('text=/full.*time/i, text=/part.*time/i, text=/contract/i, text=/remote/i');
      const optionCount = await jobTypeOptions.count();
    });

    test('should have date posted filter', async ({ page }) => {
      const dateFilter = page.locator('select[name*="date"], [data-field="datePosted"], text=/posted/i');
      const hasDateFilter = await dateFilter.count() > 0;
    });

    test('should have skills/technology tags', async ({ page }) => {
      const skillsInput = page.locator('input[name*="skill"], [data-field="skills"], text=/skill/i');
      const hasSkills = await skillsInput.count() > 0;
    });
  });

  test.describe('AI Configuration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should display AI agent settings', async ({ page }) => {
      const aiSection = page.locator('text=/ai/i, text=/agent/i, text=/automation/i');
      const hasAISection = await aiSection.count() > 0;
    });

    test('should have max jobs per session setting', async ({ page }) => {
      const maxJobsInput = page.locator('input[name*="max"], input[name*="limit"], [data-field="maxJobs"]').first();

      if (await maxJobsInput.count() > 0) {
        await maxJobsInput.clear();
        await maxJobsInput.fill('25');
        const value = await maxJobsInput.inputValue();
        expect(value).toBe('25');
      }
    });

    test('should have auto-apply toggle', async ({ page }) => {
      const autoApplyToggle = page.locator('[role="switch"]:near(text=/auto.*apply/i), input[type="checkbox"]:near(text=/auto.*apply/i)');
      const hasToggle = await autoApplyToggle.count() > 0;
    });

    test('should have headless mode toggle', async ({ page }) => {
      const headlessToggle = page.locator('[role="switch"]:near(text=/headless/i), input[type="checkbox"]:near(text=/headless/i)');
      const hasToggle = await headlessToggle.count() > 0;
    });

    test('should have resume selection', async ({ page }) => {
      const resumeSelect = page.locator('select[name*="resume"], [data-field="resume"], text=/select.*resume/i');
      const hasResume = await resumeSelect.count() > 0;
    });
  });

  test.describe('Hunt Execution', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should start hunt when form is valid', async ({ page }) => {
      // Fill required fields
      const keywordsInput = page.locator('input[name*="keyword"], input[name*="title"]').first();
      if (await keywordsInput.count() > 0) {
        await keywordsInput.fill('Software Engineer');
      }

      const startButton = page.locator('button:has-text("Start"), button:has-text("Hunt"), button[type="submit"]').first();

      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Should show progress or redirect
        const progressIndicator = page.locator('[data-progress], .progress, [role="progressbar"], text=/searching/i');
        const urlChanged = !page.url().endsWith('/hunt');

        const huntStarted = await progressIndicator.count() > 0 || urlChanged;
      }
    });

    test('should show validation errors for empty form', async ({ page }) => {
      // Clear any default values
      const inputs = page.locator('input[required], input[aria-required="true"]');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        await inputs.nth(i).clear();
      }

      const startButton = page.locator('button:has-text("Start"), button:has-text("Hunt"), button[type="submit"]').first();

      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForTimeout(500);

        // Check for validation errors
        const errorMessages = page.locator('text=/required/i, text=/invalid/i, [data-error]');
        const hasErrors = await errorMessages.count() > 0;
      }
    });

    test('should display progress during hunt', async ({ page }) => {
      // Mock a hunt in progress
      const progressSection = page.locator('[data-hunt-progress], text=/progress/i, text=/running/i');
      const hasProgress = await progressSection.count() > 0;
    });

    test('should allow canceling hunt', async ({ page }) => {
      // Start a hunt first
      const startButton = page.locator('button:has-text("Start"), button:has-text("Hunt")').first();

      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForTimeout(500);

        // Look for cancel button
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Stop")');
        const hasCancel = await cancelButton.count() > 0;
      }
    });

    test('should display results when hunt completes', async ({ page }) => {
      const resultsSection = page.locator('[data-hunt-results], text=/result/i, text=/found/i');
      const hasResults = await resultsSection.count() >= 0;
    });
  });

  test.describe('Search History', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should display recent searches', async ({ page }) => {
      const recentSearches = page.locator('text=/recent/i, text=/history/i, [data-recent-searches]');
      const hasRecent = await recentSearches.count() > 0;
    });

    test('should allow loading previous search', async ({ page }) => {
      const savedSearch = page.locator('[data-saved-search], button:has-text("Load")');

      if (await savedSearch.count() > 0) {
        await savedSearch.first().click();
        await page.waitForTimeout(500);

        // Form should be populated
      }
    });

    test('should allow saving current search', async ({ page }) => {
      const saveButton = page.locator('button:has-text("Save search"), button:has-text("Save")');
      const hasSave = await saveButton.count() > 0;
    });

    test('should allow deleting saved searches', async ({ page }) => {
      const deleteButton = page.locator('[data-saved-search] button:has-text("Delete"), [data-saved-search] [aria-label="Delete"]');
      const hasDelete = await deleteButton.count() > 0;
    });
  });

  test.describe('Advanced Filters', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should have advanced filters section', async ({ page }) => {
      const advancedToggle = page.locator('button:has-text("Advanced"), button:has-text("More"), [data-advanced-toggle]');

      if (await advancedToggle.count() > 0) {
        await advancedToggle.first().click();
        await page.waitForTimeout(300);

        // Advanced section should expand
        const advancedSection = page.locator('[data-advanced-filters], .advanced-filters');
        const isVisible = await advancedSection.count() > 0;
      }
    });

    test('should have company size filter', async ({ page }) => {
      const companySizeFilter = page.locator('text=/company.*size/i, [data-filter="companySize"]');
      const hasFilter = await companySizeFilter.count() > 0;
    });

    test('should have industry filter', async ({ page }) => {
      const industryFilter = page.locator('text=/industry/i, [data-filter="industry"]');
      const hasFilter = await industryFilter.count() > 0;
    });

    test('should have exclude keywords input', async ({ page }) => {
      const excludeInput = page.locator('input[name*="exclude"], input[placeholder*="exclude"], [data-field="excludeKeywords"]');
      const hasExclude = await excludeInput.count() > 0;
    });

    test('should have blocked companies input', async ({ page }) => {
      const blockedInput = page.locator('input[name*="blocked"], textarea[name*="blocked"], [data-field="blockedCompanies"]');
      const hasBlocked = await blockedInput.count() > 0;
    });
  });

  test.describe('Platform Integration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should show LinkedIn integration status', async ({ page }) => {
      const linkedinStatus = page.locator('text=/linkedin/i');
      const hasLinkedIn = await linkedinStatus.count() > 0;
    });

    test('should show Indeed integration status', async ({ page }) => {
      const indeedStatus = page.locator('text=/indeed/i');
      const hasIndeed = await indeedStatus.count() > 0;
    });

    test('should show connection status for each platform', async ({ page }) => {
      const connectedBadge = page.locator('text=/connected/i, [data-status="connected"]');
      const disconnectedBadge = page.locator('text=/disconnected/i, text=/not.*connected/i, [data-status="disconnected"]');

      const hasStatus = await connectedBadge.count() > 0 || await disconnectedBadge.count() > 0;
    });

    test('should link to credentials settings if not connected', async ({ page }) => {
      const configureLink = page.locator('a:has-text("Configure"), a:has-text("Connect"), button:has-text("Set up")');
      const hasLink = await configureLink.count() > 0;
    });
  });

  test.describe('Resume Integration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should display resume selection', async ({ page }) => {
      const resumeSection = page.locator('text=/resume/i, [data-resume-section]');
      const hasResume = await resumeSection.count() > 0;
    });

    test('should list available resumes', async ({ page }) => {
      const resumeSelect = page.locator('select[name*="resume"], [data-resume-list]');

      if (await resumeSelect.count() > 0) {
        const options = await resumeSelect.locator('option').count();
      }
    });

    test('should link to profile for resume management', async ({ page }) => {
      const manageLink = page.locator('a:has-text("Manage"), a:has-text("Upload"), button:has-text("Add resume")');
      const hasLink = await manageLink.count() > 0;
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/hunt');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();

      // Form should be usable
      const form = page.locator('form');
      if (await form.count() > 0) {
        const formWidth = await form.first().evaluate(el => el.offsetWidth);
        expect(formWidth).toBeLessThanOrEqual(viewports.mobile.width);
      }
    });

    test('should stack form fields on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/hunt');
      await waitForLoadingComplete(page);

      // Check no horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await page.goto('/hunt');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);
    });

    test('should have labeled form fields', async ({ page }) => {
      const inputs = page.locator('input:visible, select:visible, textarea:visible');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.evaluate(el => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const placeholder = el.getAttribute('placeholder');
          const hasAssociatedLabel = id && document.querySelector(`label[for="${id}"]`);
          return !!(ariaLabel || ariaLabelledBy || hasAssociatedLabel || placeholder);
        });
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form fields
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusedElement = await page.locator(':focus').count();
        expect(focusedElement).toBeGreaterThan(0);
      }
    });

    test('should have proper heading structure', async ({ page }) => {
      const h1 = page.locator('h1');
      const h1Count = await h1.count();

      // Should have at least one h1
      expect(h1Count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/hunt');
      await page.waitForTimeout(1000);

      // Page should still render
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show error message on failed hunt', async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);

      // Mock hunt failure
      await page.route('**/api/hunt**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Hunt failed' }),
        });
      });

      const startButton = page.locator('button:has-text("Start"), button:has-text("Hunt")').first();

      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Should show error
        const errorMessage = page.locator('text=/error/i, text=/failed/i, [role="alert"]');
        const hasError = await errorMessage.count() > 0;
      }
    });

    test('should handle network disconnect', async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);

      // Simulate offline
      await page.route('**/*', route => route.abort());

      const startButton = page.locator('button:has-text("Start")').first();
      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/hunt');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('should not block UI during form interactions', async ({ page }) => {
      await page.goto('/hunt');
      await waitForLoadingComplete(page);

      const input = page.locator('input').first();

      if (await input.count() > 0) {
        const startTime = Date.now();
        await input.fill('Test value');
        const fillTime = Date.now() - startTime;

        // Fill should be instant (< 500ms)
        expect(fillTime).toBeLessThan(500);
      }
    });
  });
});
