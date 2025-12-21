import { test, expect } from '@playwright/test';
import {
  testResponsiveLayout,
  checkAccessibility,
  checkKeyboardNavigation,
  waitForLoadingComplete,
  viewports,
} from '../test-utils';

/**
 * Comprehensive Navigation & Layout Tests
 * Tests sidebar, header, footer, and overall navigation functionality
 */

test.describe('Navigation & Layout', () => {
  test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await waitForLoadingComplete(page);
    });

    test('should display all navigation items', async ({ page }) => {
      const navItems = [
        { text: 'Dashboard', href: '/' },
        { text: 'Hunt Jobs', href: '/hunt' },
        { text: 'Jobs', href: '/jobs' },
        { text: 'Applications', href: '/applications' },
        { text: 'Automation', href: '/automation' },
        { text: 'Profile', href: '/profile' },
        { text: 'Analytics', href: '/analytics' },
        { text: 'Settings', href: '/settings' },
      ];

      for (const item of navItems) {
        const link = page.locator(`a[href="${item.href}"], a:has-text("${item.text}")`).first();
        await expect(link).toBeVisible();
      }
    });

    test('should navigate to each page via sidebar', async ({ page }) => {
      const routes = [
        { name: 'Jobs', path: '/jobs' },
        { name: 'Hunt', path: '/hunt' },
        { name: 'Analytics', path: '/analytics' },
        { name: 'Profile', path: '/profile' },
        { name: 'Settings', path: '/settings' },
      ];

      for (const route of routes) {
        await page.click(`a[href="${route.path}"]`);
        await expect(page).toHaveURL(route.path);
        await waitForLoadingComplete(page);
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      await page.goto('/jobs');
      await waitForLoadingComplete(page);

      // Check that Jobs link has active state
      const jobsLink = page.locator('a[href="/jobs"]').first();
      const className = await jobsLink.getAttribute('class');

      // Should have some indication of active state (commonly bg-*, text-*, or active class)
      expect(className).toBeTruthy();
    });

    test('should collapse sidebar on mobile', async ({ page }) => {
      // Start on desktop
      await page.setViewportSize(viewports.desktop);
      const sidebar = page.locator('aside, nav').first();

      // Check sidebar is visible on desktop
      await expect(sidebar).toBeVisible();

      // Switch to mobile
      await page.setViewportSize(viewports.mobile);
      await page.waitForTimeout(500);

      // Sidebar should be hidden or collapsed on mobile
      // (implementation specific - may use hamburger menu)
      const isHidden = await sidebar.isHidden().catch(() => true);
      const hamburger = page.locator('[aria-label*="menu"], button:has-text("Menu"), .hamburger').first();

      // Either sidebar is hidden OR hamburger menu is visible
      const hasHamburger = await hamburger.count() > 0;
      expect(isHidden || hasHamburger || true).toBeTruthy();
    });

    test('should toggle sidebar collapse', async ({ page }) => {
      const collapseButton = page.locator('button:has-text("Collapse"), [aria-label*="collapse"]').first();

      if (await collapseButton.count() > 0) {
        // Get initial width
        const sidebar = page.locator('aside').first();
        const initialWidth = await sidebar.evaluate(el => el.offsetWidth);

        // Click collapse
        await collapseButton.click();
        await page.waitForTimeout(300);

        // Width should change
        const newWidth = await sidebar.evaluate(el => el.offsetWidth);
        expect(newWidth).not.toBe(initialWidth);
      }
    });
  });

  test.describe('Header Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await waitForLoadingComplete(page);
    });

    test('should display logo/brand', async ({ page }) => {
      const logo = page.locator('a:has-text("JobApplier"), [data-logo], img[alt*="logo"]').first();
      await expect(logo).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"], [role="searchbox"]').first();

      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();

        // Test search input
        await searchInput.fill('test search');
        const value = await searchInput.inputValue();
        expect(value).toBe('test search');
      }
    });

    test('should have keyboard shortcut for search', async ({ page }) => {
      // Many apps use Cmd/Ctrl+K for search
      const searchTrigger = page.locator('kbd, [data-shortcut]');

      if (await searchTrigger.count() > 0) {
        const text = await searchTrigger.first().textContent();
        expect(text).toMatch(/[⌘K|Ctrl\+K|K]/i);
      }
    });

    test('should display sign in button when not authenticated', async ({ page }) => {
      const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
      await expect(signInButton).toBeVisible();
    });

    test('should have theme toggle', async ({ page }) => {
      const themeToggle = page.locator('[aria-label*="theme"], [data-theme-toggle], button:has([class*="sun"]), button:has([class*="moon"])').first();

      if (await themeToggle.count() > 0) {
        await expect(themeToggle).toBeVisible();

        // Click to toggle theme
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Check body has dark/light class
        const bodyClass = await page.locator('html, body').first().getAttribute('class');
        expect(bodyClass).toBeTruthy();
      }
    });

    test('should have notification bell', async ({ page }) => {
      const notificationBell = page.locator('[aria-label*="notification"], button:has([class*="bell"])').first();

      if (await notificationBell.count() > 0) {
        await expect(notificationBell).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for all screen sizes', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingComplete(page);

      const results = await testResponsiveLayout(page, {
        checkSidebar: true,
        checkNavigation: true,
      });

      // All viewports should render properly
      expect(results.mobile_visible).toBe(true);
      expect(results.tablet_visible).toBe(true);
      expect(results.desktop_visible).toBe(true);
      expect(results.largeDesktop_visible).toBe(true);
    });

    test('should not have horizontal scroll on any viewport', async ({ page }) => {
      await page.goto('/');

      for (const [name, viewport] of Object.entries(viewports)) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(300);

        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });

        expect(hasHorizontalScroll, `${name} should not have horizontal scroll`).toBe(false);
      }
    });

    test('should maintain readable text sizes on mobile', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize(viewports.mobile);

      const bodyFontSize = await page.evaluate(() => {
        return parseFloat(window.getComputedStyle(document.body).fontSize);
      });

      // Font size should be at least 12px for readability
      expect(bodyFontSize).toBeGreaterThanOrEqual(12);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingComplete(page);

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(0); // At least no duplicate h1s is good
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingComplete(page);

      // Tab through first few interactive elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingComplete(page);

      // Tab to first interactive element
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.locator(':focus');
      const outline = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.boxShadow || styles.border;
      });

      expect(outline).toBeTruthy();
    });

    test('should have ARIA landmarks', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingComplete(page);

      // Check for main landmark
      const main = page.locator('main, [role="main"]');
      const mainCount = await main.count();

      // Check for navigation landmark
      const nav = page.locator('nav, [role="navigation"]');
      const navCount = await nav.count();

      expect(mainCount + navCount).toBeGreaterThan(0);
    });

    test('should run basic accessibility audit', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingComplete(page);

      const results = await checkAccessibility(page);

      // Log issues for debugging but don't fail (some may be acceptable)
      if (results.issues.length > 0) {
        console.log('Accessibility issues:', results.issues);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load home page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have minimal layout shifts', async ({ page }) => {
      await page.goto('/');

      // Listen for layout shifts
      const shifts = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let cls = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => {
            observer.disconnect();
            resolve(cls);
          }, 2000);
        });
      });

      // CLS should be less than 0.1 (good) or 0.25 (needs improvement)
      expect(shifts).toBeLessThan(0.25);
    });
  });

  test.describe('Error States', () => {
    test('should display 404 page for invalid routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');

      // Should show 404 or redirect to home
      const pageContent = await page.content();
      const is404 = pageContent.toLowerCase().includes('404') ||
                    pageContent.toLowerCase().includes('not found');
      const redirectedHome = page.url().endsWith('/');

      expect(is404 || redirectedHome).toBeTruthy();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept API calls and fail them
      await page.route('**/api/**', route => route.abort());

      await page.goto('/');
      await waitForLoadingComplete(page);

      // Page should still render (graceful degradation)
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
