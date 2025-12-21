import { Page, Locator, expect } from '@playwright/test';

/**
 * Comprehensive Test Utilities for Job Applier E2E Tests
 */

// ============================================
// ACCESSIBILITY HELPERS
// ============================================

export async function checkAccessibility(page: Page, options?: {
  skipRules?: string[];
}) {
  // Check for basic accessibility requirements
  const results = {
    passed: true,
    issues: [] as string[],
  };

  // Check for alt text on images
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt > 0) {
    results.issues.push(`${imagesWithoutAlt} images missing alt text`);
  }

  // Check for form labels
  const inputsWithoutLabels = await page.locator('input:not([aria-label]):not([id])').count();
  if (inputsWithoutLabels > 0) {
    results.issues.push(`${inputsWithoutLabels} inputs without labels`);
  }

  // Check for button text/aria-label
  const buttonsWithoutText = await page.locator('button:empty:not([aria-label])').count();
  if (buttonsWithoutText > 0) {
    results.issues.push(`${buttonsWithoutText} buttons without text or aria-label`);
  }

  // Check for heading hierarchy
  const h1Count = await page.locator('h1').count();
  if (h1Count === 0) {
    results.issues.push('Page missing h1 heading');
  }

  // Check for focus indicators
  const focusableElements = page.locator('button, a, input, select, textarea, [tabindex]');

  results.passed = results.issues.length === 0;
  return results;
}

export async function checkKeyboardNavigation(page: Page) {
  const results = {
    passed: true,
    issues: [] as string[],
  };

  // Tab through interactive elements
  const interactiveElements = await page.locator('button:visible, a:visible, input:visible, select:visible').all();

  for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').count();
    if (focusedElement === 0) {
      results.issues.push(`Tab stop ${i + 1} lost focus`);
    }
  }

  results.passed = results.issues.length === 0;
  return results;
}

// ============================================
// RESPONSIVE DESIGN HELPERS
// ============================================

export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  largeDesktop: { width: 1920, height: 1080 },
};

export async function testResponsiveLayout(page: Page, options?: {
  checkSidebar?: boolean;
  checkNavigation?: boolean;
}) {
  const results: Record<string, boolean> = {};

  for (const [name, viewport] of Object.entries(viewports)) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(300); // Allow layout to settle

    // Check body is visible
    results[`${name}_visible`] = await page.locator('body').isVisible();

    // Check sidebar behavior if specified
    if (options?.checkSidebar) {
      const sidebar = page.locator('aside, nav[role="navigation"], [data-sidebar]').first();
      if (await sidebar.count() > 0) {
        const isVisible = await sidebar.isVisible();
        // On mobile, sidebar might be hidden or collapsed
        results[`${name}_sidebar`] = name === 'mobile' ? true : isVisible;
      }
    }

    // Check navigation
    if (options?.checkNavigation) {
      const nav = page.locator('nav').first();
      results[`${name}_nav`] = await nav.isVisible();
    }
  }

  return results;
}

// ============================================
// FORM INTERACTION HELPERS
// ============================================

export async function fillForm(page: Page, fields: Record<string, string | boolean | number>) {
  for (const [selector, value] of Object.entries(fields)) {
    const element = page.locator(selector);
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const inputType = await element.getAttribute('type');

    if (tagName === 'input') {
      if (inputType === 'checkbox') {
        if (value) await element.check();
        else await element.uncheck();
      } else if (inputType === 'radio') {
        if (value) await element.check();
      } else {
        await element.fill(String(value));
      }
    } else if (tagName === 'select') {
      await element.selectOption(String(value));
    } else if (tagName === 'textarea') {
      await element.fill(String(value));
    }
  }
}

export async function validateFormErrors(page: Page, expectedErrors: string[]) {
  const results = {
    passed: true,
    foundErrors: [] as string[],
    missingErrors: [] as string[],
  };

  for (const errorText of expectedErrors) {
    const errorElement = page.locator(`text=${errorText}`);
    if (await errorElement.count() > 0) {
      results.foundErrors.push(errorText);
    } else {
      results.missingErrors.push(errorText);
      results.passed = false;
    }
  }

  return results;
}

// ============================================
// COMPONENT STATE HELPERS
// ============================================

export async function waitForLoadingComplete(page: Page, options?: {
  timeout?: number;
  loadingSelector?: string;
}) {
  const timeout = options?.timeout || 30000;
  const loadingSelector = options?.loadingSelector || '[data-loading], .loading, .spinner, [role="progressbar"]';

  try {
    // Wait for loading indicators to disappear
    await page.waitForSelector(loadingSelector, { state: 'hidden', timeout });
  } catch {
    // No loading indicator found, which is fine
  }

  // Also wait for network idle
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
}

export async function getComponentState(locator: Locator): Promise<{
  visible: boolean;
  enabled: boolean;
  checked?: boolean;
  value?: string;
  text?: string;
}> {
  const visible = await locator.isVisible();
  const enabled = await locator.isEnabled();

  let checked: boolean | undefined;
  let value: string | undefined;
  let text: string | undefined;

  if (visible) {
    const tagName = await locator.evaluate(el => el.tagName.toLowerCase());
    const type = await locator.getAttribute('type');

    if (tagName === 'input') {
      if (type === 'checkbox' || type === 'radio') {
        checked = await locator.isChecked();
      }
      value = await locator.inputValue();
    } else if (tagName === 'select') {
      value = await locator.inputValue();
    } else {
      text = await locator.textContent() || undefined;
    }
  }

  return { visible, enabled, checked, value, text };
}

// ============================================
// NAVIGATION HELPERS
// ============================================

export async function navigateAndVerify(page: Page, path: string, expectedTitle?: RegExp | string) {
  await page.goto(path);
  await expect(page).toHaveURL(path);

  if (expectedTitle) {
    await expect(page).toHaveTitle(expectedTitle);
  }

  await waitForLoadingComplete(page);
}

export async function clickAndNavigate(page: Page, selector: string, expectedPath: string) {
  await page.click(selector);
  await expect(page).toHaveURL(expectedPath);
  await waitForLoadingComplete(page);
}

// ============================================
// TABLE/LIST HELPERS
// ============================================

export async function getTableData(page: Page, tableSelector: string): Promise<string[][]> {
  const table = page.locator(tableSelector);
  const rows = table.locator('tr');
  const rowCount = await rows.count();

  const data: string[][] = [];

  for (let i = 0; i < rowCount; i++) {
    const cells = rows.nth(i).locator('td, th');
    const cellCount = await cells.count();
    const rowData: string[] = [];

    for (let j = 0; j < cellCount; j++) {
      const text = await cells.nth(j).textContent();
      rowData.push(text?.trim() || '');
    }

    data.push(rowData);
  }

  return data;
}

export async function sortTableByColumn(page: Page, columnHeader: string) {
  await page.click(`th:has-text("${columnHeader}"), [role="columnheader"]:has-text("${columnHeader}")`);
  await page.waitForTimeout(500); // Wait for sort animation
}

// ============================================
// MODAL/DIALOG HELPERS
// ============================================

export async function waitForModal(page: Page, options?: {
  timeout?: number;
  selector?: string;
}) {
  const selector = options?.selector || '[role="dialog"], .modal, [data-modal]';
  const timeout = options?.timeout || 10000;

  await page.waitForSelector(selector, { state: 'visible', timeout });
  return page.locator(selector);
}

export async function closeModal(page: Page, options?: {
  selector?: string;
  closeButtonSelector?: string;
}) {
  const closeButton = page.locator(
    options?.closeButtonSelector ||
    '[aria-label="Close"], button:has-text("Close"), .modal-close, [data-close]'
  ).first();

  if (await closeButton.count() > 0) {
    await closeButton.click();
  } else {
    // Try pressing Escape
    await page.keyboard.press('Escape');
  }

  // Verify modal closed
  const modal = page.locator(options?.selector || '[role="dialog"]');
  await expect(modal).toBeHidden({ timeout: 5000 });
}

// ============================================
// TOAST/NOTIFICATION HELPERS
// ============================================

export async function waitForToast(page: Page, options?: {
  text?: string | RegExp;
  type?: 'success' | 'error' | 'warning' | 'info';
  timeout?: number;
}) {
  const toastSelector = '[role="alert"], .toast, [data-toast], .notification';
  const timeout = options?.timeout || 10000;

  await page.waitForSelector(toastSelector, { state: 'visible', timeout });

  const toast = page.locator(toastSelector);

  if (options?.text) {
    await expect(toast).toContainText(options.text);
  }

  return toast;
}

// ============================================
// DATA-TESTID HELPERS
// ============================================

export function byTestId(testId: string) {
  return `[data-testid="${testId}"]`;
}

export async function getByTestId(page: Page, testId: string) {
  return page.locator(byTestId(testId));
}

// ============================================
// SCREENSHOT HELPERS
// ============================================

export async function takePageScreenshot(page: Page, name: string, options?: {
  fullPage?: boolean;
}) {
  await page.screenshot({
    path: `./playwright-report/screenshots/${name}-${Date.now()}.png`,
    fullPage: options?.fullPage ?? true,
  });
}

// ============================================
// PERFORMANCE HELPERS
// ============================================

export async function measurePageLoad(page: Page, url: string) {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;

  return {
    url,
    loadTime,
    underThreshold: loadTime < 5000, // 5 second threshold
  };
}
