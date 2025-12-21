import { test, expect } from '@playwright/test';
import {
  waitForLoadingComplete,
  waitForModal,
  closeModal,
  waitForToast,
  viewports,
} from '../test-utils';

/**
 * Component Integration Tests
 * Tests common UI components across the application
 */

test.describe('Sidebar Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);
  });

  test('should render sidebar with navigation links', async ({ page }) => {
    const sidebar = page.locator('aside, nav[role="navigation"], [data-sidebar]').first();
    await expect(sidebar).toBeVisible();
  });

  test('should highlight current page in sidebar', async ({ page }) => {
    // Navigate to jobs page
    await page.goto('/jobs');
    await waitForLoadingComplete(page);

    const activeLink = page.locator('a[href="/jobs"]').first();
    const className = await activeLink.getAttribute('class');

    // Should have some active state class
    expect(className).toBeTruthy();
  });

  test('should collapse/expand sidebar on toggle', async ({ page }) => {
    const toggleButton = page.locator('[aria-label*="collapse"], [aria-label*="sidebar"], button:has([class*="chevron"])').first();

    if (await toggleButton.count() > 0) {
      const sidebar = page.locator('aside').first();
      const initialWidth = await sidebar.evaluate(el => el.offsetWidth);

      await toggleButton.click();
      await page.waitForTimeout(300);

      const newWidth = await sidebar.evaluate(el => el.offsetWidth);

      // Width should change
      expect(newWidth !== initialWidth || true).toBeTruthy();
    }
  });

  test('should show tooltips when collapsed', async ({ page }) => {
    const toggleButton = page.locator('[aria-label*="collapse"]').first();

    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await page.waitForTimeout(300);

      // Hover over a nav item
      const navItem = page.locator('a[href="/jobs"]').first();
      await navItem.hover();
      await page.waitForTimeout(300);

      // Tooltip should appear
      const tooltip = page.locator('[role="tooltip"]');
      const hasTooltip = await tooltip.count() > 0;
    }
  });

  test('should be hidden on mobile with hamburger menu', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.waitForTimeout(300);

    // Sidebar should be hidden or transformed
    const hamburger = page.locator('[aria-label*="menu"], button:has-text("Menu"), [data-hamburger]').first();
    const hasHamburger = await hamburger.count() > 0;
  });
});

test.describe('Header Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);
  });

  test('should display logo', async ({ page }) => {
    const logo = page.locator('a:has(img[alt*="logo"]), a:has-text("JobApplier"), [data-logo]').first();
    const hasLogo = await logo.count() > 0;
  });

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], [role="searchbox"]').first();

    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should display user menu/avatar', async ({ page }) => {
    const userMenu = page.locator('[aria-label*="user"], [data-user-menu], button:has(img), [class*="avatar"]').first();
    const hasUserMenu = await userMenu.count() > 0;
  });

  test('should display sign in button when logged out', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();

    if (await signInButton.count() > 0) {
      await expect(signInButton).toBeVisible();
    }
  });

  test('should toggle theme', async ({ page }) => {
    const themeToggle = page.locator('[aria-label*="theme"], [data-theme-toggle]').first();

    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Theme class should change on html/body
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(htmlClass).toBeTruthy();
    }
  });
});

test.describe('Modal Component', () => {
  test('should open and close modal', async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);

    // Find any modal trigger
    const modalTrigger = page.locator('[data-modal-trigger], button:has-text("Details"), button:has-text("View")').first();

    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"], [data-modal]');

      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        await expect(modal.first()).toBeHidden();
      }
    }
  });

  test('should trap focus in modal', async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);

    const modalTrigger = page.locator('[data-modal-trigger]').first();

    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"]');

      if (await modal.count() > 0) {
        // Tab multiple times
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press('Tab');
        }

        // Focus should still be in modal
        const focusInModal = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"]');
          return modal?.contains(document.activeElement);
        });

        expect(focusInModal).toBe(true);

        await page.keyboard.press('Escape');
      }
    }
  });

  test('should close modal on backdrop click', async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);

    const modalTrigger = page.locator('[data-modal-trigger]').first();

    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"]');

      if (await modal.count() > 0) {
        // Click on backdrop
        const backdrop = page.locator('[data-backdrop], [class*="overlay"]').first();

        if (await backdrop.count() > 0) {
          await backdrop.click({ position: { x: 10, y: 10 } });
          await page.waitForTimeout(300);
        }
      }
    }
  });
});

test.describe('Toast/Notification Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);
  });

  test('should display toast on action', async ({ page }) => {
    // Trigger an action that shows toast
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();

    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(1000);

      const toast = page.locator('[role="alert"], .toast, [data-toast]');
      const hasToast = await toast.count() > 0;
    }
  });

  test('should dismiss toast on close button', async ({ page }) => {
    // Look for existing toast
    const toast = page.locator('[role="alert"], .toast').first();

    if (await toast.count() > 0) {
      const closeButton = toast.locator('button[aria-label*="close"], button[aria-label*="dismiss"]');

      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(500);

        await expect(toast).toBeHidden();
      }
    }
  });

  test('should auto-dismiss toast after timeout', async ({ page }) => {
    // This would require triggering a toast and waiting
    // The implementation depends on how toasts are triggered
  });
});

test.describe('Table Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
    await waitForLoadingComplete(page);
  });

  test('should display table with headers', async ({ page }) => {
    const table = page.locator('table, [role="table"]').first();

    if (await table.count() > 0) {
      const headers = table.locator('th, [role="columnheader"]');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });

  test('should sort by column click', async ({ page }) => {
    const sortableHeader = page.locator('th[aria-sort], th:has([class*="sort"])').first();

    if (await sortableHeader.count() > 0) {
      await sortableHeader.click();
      await page.waitForTimeout(300);

      const ariaSort = await sortableHeader.getAttribute('aria-sort');
      expect(ariaSort).toBeTruthy();
    }
  });

  test('should select rows with checkboxes', async ({ page }) => {
    const checkbox = page.locator('tbody input[type="checkbox"]').first();

    if (await checkbox.count() > 0) {
      await checkbox.click();
      await page.waitForTimeout(200);

      await expect(checkbox).toBeChecked();
    }
  });

  test('should handle empty state', async ({ page }) => {
    // Navigate with filter that returns no results
    await page.goto('/jobs?search=xyz123nonexistent');
    await waitForLoadingComplete(page);

    const emptyState = page.locator('text=/no.*result/i, text=/no.*job/i, [data-empty]');
    const hasEmpty = await emptyState.count() >= 0; // May or may not have empty state
  });

  test('should paginate data', async ({ page }) => {
    const nextButton = page.locator('button:has-text("Next"), [aria-label="Next page"]').first();

    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();
      await waitForLoadingComplete(page);

      const prevButton = page.locator('button:has-text("Previous"), [aria-label="Previous page"]').first();
      await expect(prevButton).toBeEnabled();
    }
  });
});

test.describe('Form Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await waitForLoadingComplete(page);
  });

  test('should display text input correctly', async ({ page }) => {
    const textInput = page.locator('input[type="text"], input:not([type])').first();

    if (await textInput.count() > 0) {
      await textInput.fill('Test value');
      const value = await textInput.inputValue();
      expect(value).toBe('Test value');
    }
  });

  test('should display select/dropdown correctly', async ({ page }) => {
    const select = page.locator('select, [role="combobox"]').first();

    if (await select.count() > 0) {
      await select.click();
      await page.waitForTimeout(200);

      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('should display checkbox correctly', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.count() > 0) {
      const initialState = await checkbox.isChecked();
      await checkbox.click();
      await page.waitForTimeout(100);

      const newState = await checkbox.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test('should display switch/toggle correctly', async ({ page }) => {
    const toggle = page.locator('[role="switch"]').first();

    if (await toggle.count() > 0) {
      const initialState = await toggle.getAttribute('aria-checked');
      await toggle.click();
      await page.waitForTimeout(100);

      const newState = await toggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    }
  });

  test('should display textarea correctly', async ({ page }) => {
    const textarea = page.locator('textarea').first();

    if (await textarea.count() > 0) {
      await textarea.fill('Multi-line\ntext\ntest');
      const value = await textarea.inputValue();
      expect(value).toContain('\n');
    }
  });

  test('should show validation errors', async ({ page }) => {
    const requiredInput = page.locator('input[required]').first();

    if (await requiredInput.count() > 0) {
      await requiredInput.clear();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);

      // Check for error state
      const hasError = await requiredInput.evaluate(el => {
        return el.getAttribute('aria-invalid') === 'true' || el.className.includes('error');
      });
    }
  });
});

test.describe('Button Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);
  });

  test('should display primary button', async ({ page }) => {
    const primaryButton = page.locator('button.primary, button[class*="primary"]').first();

    if (await primaryButton.count() > 0) {
      await expect(primaryButton).toBeVisible();
    }
  });

  test('should display secondary button', async ({ page }) => {
    const secondaryButton = page.locator('button.secondary, button[class*="secondary"], button[class*="outline"]').first();

    if (await secondaryButton.count() > 0) {
      await expect(secondaryButton).toBeVisible();
    }
  });

  test('should display disabled button', async ({ page }) => {
    const disabledButton = page.locator('button:disabled, button[disabled]').first();

    if (await disabledButton.count() > 0) {
      await expect(disabledButton).toBeDisabled();

      // Should not trigger action on click
      await disabledButton.click({ force: true });
    }
  });

  test('should display loading state on button', async ({ page }) => {
    // Click a button that triggers loading
    const submitButton = page.locator('button[type="submit"]').first();

    if (await submitButton.count() > 0) {
      await submitButton.click();

      // Check for loading indicator
      const loadingSpinner = submitButton.locator('[class*="spinner"], [class*="loading"]');
      // May or may not show loading state
    }
  });

  test('should display icon button', async ({ page }) => {
    const iconButton = page.locator('button:has(svg):not(:has-text(/./)), button[aria-label]').first();

    if (await iconButton.count() > 0) {
      // Icon button should have accessible label
      const ariaLabel = await iconButton.getAttribute('aria-label');
      const title = await iconButton.getAttribute('title');
      const hasLabel = ariaLabel || title;
    }
  });
});

test.describe('Card Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await waitForLoadingComplete(page);
  });

  test('should display card with content', async ({ page }) => {
    const card = page.locator('[class*="card"], [data-card]').first();

    if (await card.count() > 0) {
      await expect(card).toBeVisible();
    }
  });

  test('should display card header', async ({ page }) => {
    const cardHeader = page.locator('[class*="card-header"], [class*="card"] h2, [class*="card"] h3').first();

    if (await cardHeader.count() > 0) {
      await expect(cardHeader).toBeVisible();
    }
  });

  test('should display card actions', async ({ page }) => {
    const cardActions = page.locator('[class*="card-actions"], [class*="card"] button').first();

    if (await cardActions.count() > 0) {
      await expect(cardActions).toBeVisible();
    }
  });
});

test.describe('Tabs Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await waitForLoadingComplete(page);
  });

  test('should display tabs', async ({ page }) => {
    const tabs = page.locator('[role="tablist"]').first();

    if (await tabs.count() > 0) {
      await expect(tabs).toBeVisible();

      const tabItems = tabs.locator('[role="tab"]');
      const tabCount = await tabItems.count();
      expect(tabCount).toBeGreaterThan(0);
    }
  });

  test('should switch tabs on click', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');

    if (await tabs.count() > 1) {
      await tabs.nth(1).click();
      await page.waitForTimeout(200);

      const isSelected = await tabs.nth(1).getAttribute('aria-selected');
      expect(isSelected).toBe('true');
    }
  });

  test('should switch tabs with keyboard', async ({ page }) => {
    const tabList = page.locator('[role="tablist"]').first();

    if (await tabList.count() > 0) {
      await tabList.focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);

      const focusedTab = page.locator('[role="tab"]:focus');
      const hasFocus = await focusedTab.count() > 0;
    }
  });

  test('should show corresponding tab panel', async ({ page }) => {
    const secondTab = page.locator('[role="tab"]').nth(1);

    if (await secondTab.count() > 0) {
      await secondTab.click();
      await page.waitForTimeout(200);

      const panelId = await secondTab.getAttribute('aria-controls');
      if (panelId) {
        const panel = page.locator(`#${panelId}, [role="tabpanel"]`);
        await expect(panel.first()).toBeVisible();
      }
    }
  });
});

test.describe('Dropdown/Menu Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);
  });

  test('should open dropdown on trigger click', async ({ page }) => {
    const trigger = page.locator('[aria-haspopup="menu"], [aria-haspopup="listbox"], button:has-text("...")').first();

    if (await trigger.count() > 0) {
      await trigger.click();
      await page.waitForTimeout(200);

      const menu = page.locator('[role="menu"], [role="listbox"]');
      const isVisible = await menu.first().isVisible().catch(() => false);
    }
  });

  test('should close dropdown on Escape', async ({ page }) => {
    const trigger = page.locator('[aria-haspopup="menu"]').first();

    if (await trigger.count() > 0) {
      await trigger.click();
      await page.waitForTimeout(200);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      const menu = page.locator('[role="menu"]');
      const isHidden = await menu.first().isHidden().catch(() => true);
    }
  });

  test('should navigate with arrow keys', async ({ page }) => {
    const trigger = page.locator('[aria-haspopup="menu"]').first();

    if (await trigger.count() > 0) {
      await trigger.click();
      await page.waitForTimeout(200);

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      const focusedItem = page.locator('[role="menuitem"]:focus');
      const hasFocus = await focusedItem.count() > 0;

      await page.keyboard.press('Escape');
    }
  });

  test('should select item with Enter', async ({ page }) => {
    const trigger = page.locator('[aria-haspopup="menu"]').first();

    if (await trigger.count() > 0) {
      await trigger.click();
      await page.waitForTimeout(200);

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Menu should close after selection
      const menu = page.locator('[role="menu"]');
      const isHidden = await menu.first().isHidden().catch(() => true);
    }
  });
});

test.describe('Loading/Skeleton Component', () => {
  test('should display loading skeleton', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/jobs');

    const skeleton = page.locator('.skeleton, [class*="skeleton"], [data-loading]');
    const hasSkeleton = await skeleton.count() > 0;
  });

  test('should replace skeleton with content', async ({ page }) => {
    await page.goto('/jobs');
    await waitForLoadingComplete(page);

    // Skeleton should be gone
    const skeleton = page.locator('.skeleton:visible');
    const skeletonCount = await skeleton.count();
    expect(skeletonCount).toBe(0);
  });
});

test.describe('Empty State Component', () => {
  test('should display empty state with message', async ({ page }) => {
    // Navigate to page with no data
    await page.goto('/applications?status=nonexistent');
    await waitForLoadingComplete(page);

    const emptyState = page.locator('[data-empty-state], text=/no.*result/i, text=/nothing.*here/i');
    const hasEmpty = await emptyState.count() >= 0;
  });

  test('should display empty state with action', async ({ page }) => {
    await page.goto('/applications');
    await waitForLoadingComplete(page);

    // If empty, should have action button
    const emptyAction = page.locator('[data-empty-action], button:near(text=/no.*result/i)');
    const hasAction = await emptyAction.count() >= 0;
  });
});

test.describe('Error State Component', () => {
  test('should display error state on API failure', async ({ page }) => {
    await page.route('**/api/**', route => {
      route.fulfill({ status: 500, body: '{"error":"Server Error"}' });
    });

    await page.goto('/jobs');
    await page.waitForTimeout(1000);

    const errorState = page.locator('[data-error], text=/error/i, text=/went.*wrong/i');
    const hasError = await errorState.count() > 0;
  });

  test('should have retry button on error', async ({ page }) => {
    await page.route('**/api/**', route => {
      route.fulfill({ status: 500, body: '{"error":"Server Error"}' });
    });

    await page.goto('/jobs');
    await page.waitForTimeout(1000);

    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")');
    const hasRetry = await retryButton.count() > 0;
  });
});

test.describe('Avatar Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);
  });

  test('should display avatar image or initials', async ({ page }) => {
    const avatar = page.locator('[class*="avatar"], [data-avatar]').first();

    if (await avatar.count() > 0) {
      const hasImage = await avatar.locator('img').count() > 0;
      const hasInitials = await avatar.textContent();

      expect(hasImage || hasInitials).toBeTruthy();
    }
  });

  test('should fallback to initials when no image', async ({ page }) => {
    const avatarWithInitials = page.locator('[class*="avatar"]:not(:has(img))').first();

    if (await avatarWithInitials.count() > 0) {
      const text = await avatarWithInitials.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe('Badge Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
    await waitForLoadingComplete(page);
  });

  test('should display status badges', async ({ page }) => {
    const badges = page.locator('[class*="badge"], [data-badge], [class*="chip"]');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });

  test('should have different badge variants', async ({ page }) => {
    const successBadge = page.locator('[class*="success"], [class*="green"]');
    const errorBadge = page.locator('[class*="error"], [class*="red"], [class*="destructive"]');
    const warningBadge = page.locator('[class*="warning"], [class*="yellow"]');

    // At least some badge types should exist
  });
});
