import { test, expect } from '@playwright/test';
import { viewports } from '../test-utils';

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots for visual comparison.
 * On first run, they establish baselines.
 * On subsequent runs, they compare against baselines.
 *
 * Run with: npx playwright test visual-regression --update-snapshots
 * to update baselines.
 */

test.describe('Visual Regression Tests', () => {
  test.describe('Dashboard Page', () => {
    test('should match desktop screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Allow animations to settle

      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match tablet screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match mobile screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('Jobs Page', () => {
    test('should match desktop screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('jobs-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match mobile screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('jobs-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match job card screenshot', async ({ page }) => {
      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');

      const jobCard = page.locator('.job-card, [data-testid="job-card"], .card').first();
      if (await jobCard.count() > 0 && await jobCard.isVisible()) {
        await expect(jobCard).toHaveScreenshot('job-card.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });
  });

  test.describe('Applications Page', () => {
    test('should match desktop screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/applications');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('applications-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match mobile screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/applications');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('applications-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('Hunt Page', () => {
    test('should match desktop screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/hunt');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('hunt-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match mobile screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/hunt');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('hunt-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('Analytics Page', () => {
    test('should match desktop screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('analytics-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match mobile screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('analytics-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('Settings Page', () => {
    test('should match desktop screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('settings-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match mobile screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('settings-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('Profile Page', () => {
    test('should match desktop screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('profile-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match mobile screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('profile-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('Theme Variations', () => {
    test('should match light theme screenshot', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('dashboard-light-theme.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match dark theme screenshot', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('dashboard-dark-theme.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('Component Screenshots', () => {
    test('should match sidebar screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('nav, aside, [data-testid="sidebar"]').first();
      if (await sidebar.count() > 0 && await sidebar.isVisible()) {
        await expect(sidebar).toHaveScreenshot('sidebar.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match header screenshot', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const header = page.locator('header, [data-testid="header"], .app-header').first();
      if (await header.count() > 0 && await header.isVisible()) {
        await expect(header).toHaveScreenshot('header.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match button styles screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const button = page.locator('button').first();
      if (await button.count() > 0 && await button.isVisible()) {
        await expect(button).toHaveScreenshot('button-default.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match form input screenshot', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const input = page.locator('input[type="text"], input[type="email"]').first();
      if (await input.count() > 0 && await input.isVisible()) {
        await expect(input).toHaveScreenshot('input-default.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match card component screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const card = page.locator('.card, [data-testid="card"], .stat-card').first();
      if (await card.count() > 0 && await card.isVisible()) {
        await expect(card).toHaveScreenshot('card.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match modal screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Trigger a modal if possible
      const modalTrigger = page.locator('button').filter({ hasText: /add|create|new/i }).first();
      if (await modalTrigger.count() > 0 && await modalTrigger.isVisible()) {
        await modalTrigger.click();
        await page.waitForTimeout(500);

        const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
        if (await modal.count() > 0 && await modal.isVisible()) {
          await expect(modal).toHaveScreenshot('modal.png', {
            maxDiffPixelRatio: 0.1
          });
        }
      }
    });
  });

  test.describe('Interactive States', () => {
    test('should match button hover state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const button = page.locator('button').first();
      if (await button.count() > 0 && await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(200);

        await expect(button).toHaveScreenshot('button-hover.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match button focus state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const button = page.locator('button').first();
      if (await button.count() > 0 && await button.isVisible()) {
        await button.focus();
        await page.waitForTimeout(200);

        await expect(button).toHaveScreenshot('button-focus.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match input focus state', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const input = page.locator('input[type="text"]').first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.focus();
        await page.waitForTimeout(200);

        await expect(input).toHaveScreenshot('input-focus.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match active navigation item', async ({ page }) => {
      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');

      const navItem = page.locator('nav a[href="/jobs"], nav a[href*="jobs"]').first();
      if (await navItem.count() > 0 && await navItem.isVisible()) {
        await expect(navItem).toHaveScreenshot('nav-item-active.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });
  });

  test.describe('Error States', () => {
    test('should match error state screenshot', async ({ page }) => {
      await page.route('**/api/**', route => {
        route.fulfill({ status: 500 });
      });

      await page.goto('/jobs');
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('error-state.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match empty state screenshot', async ({ page }) => {
      await page.route('**/api/jobs**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ jobs: [], total: 0 })
        });
      });

      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('empty-state.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });

    test('should match loading state screenshot', async ({ page }) => {
      await page.route('**/api/**', route => {
        // Delay response to capture loading state
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ jobs: [] })
          });
        }, 5000);
      });

      await page.goto('/jobs', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('loading-state.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('Form Validation States', () => {
    test('should match form error state screenshot', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Trigger validation error
      const input = page.locator('input[required]').first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill('');
        await input.blur();

        const form = page.locator('form').first();
        if (await form.count() > 0) {
          await expect(form).toHaveScreenshot('form-validation-error.png', {
            maxDiffPixelRatio: 0.1
          });
        }
      }
    });

    test('should match form success state screenshot', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Fill valid data and submit
      const input = page.locator('input').first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill('Valid input');

        const saveButton = page.locator('button').filter({ hasText: /save/i }).first();
        if (await saveButton.count() > 0 && await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Capture success state if toast/message appears
          const successIndicator = page.locator('.toast-success, .success-message, [data-testid="success"]');
          if (await successIndicator.count() > 0 && await successIndicator.isVisible()) {
            await expect(successIndicator).toHaveScreenshot('form-success.png', {
              maxDiffPixelRatio: 0.1
            });
          }
        }
      }
    });
  });

  test.describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { name: 'xs', width: 320, height: 568 },
      { name: 'sm', width: 640, height: 800 },
      { name: 'md', width: 768, height: 1024 },
      { name: 'lg', width: 1024, height: 768 },
      { name: 'xl', width: 1280, height: 800 },
      { name: '2xl', width: 1536, height: 900 }
    ];

    for (const bp of breakpoints) {
      test(`should match dashboard at ${bp.name} (${bp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot(`dashboard-${bp.name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.1
        });
      });
    }
  });

  test.describe('Animation States', () => {
    test('should capture skeleton loading animation', async ({ page }) => {
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 3000);
      });

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Capture skeleton state
      const skeleton = page.locator('.skeleton, [data-skeleton], .animate-pulse');
      if (await skeleton.count() > 0) {
        await expect(skeleton.first()).toHaveScreenshot('skeleton-loading.png', {
          maxDiffPixelRatio: 0.2, // Allow more variance for animations
          animations: 'disabled'
        });
      }
    });

    test('should capture with animations disabled', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('no-animations.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
        animations: 'disabled'
      });
    });
  });

  test.describe('Typography', () => {
    test('should match heading styles', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1, h2, h3').first();
      if (await heading.count() > 0 && await heading.isVisible()) {
        await expect(heading).toHaveScreenshot('heading-style.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match body text styles', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const paragraph = page.locator('p').first();
      if (await paragraph.count() > 0 && await paragraph.isVisible()) {
        await expect(paragraph).toHaveScreenshot('body-text.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });
  });

  test.describe('Icons and Images', () => {
    test('should match icon rendering', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const icon = page.locator('svg, [data-testid="icon"], .icon').first();
      if (await icon.count() > 0 && await icon.isVisible()) {
        await expect(icon).toHaveScreenshot('icon.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match avatar rendering', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const avatar = page.locator('.avatar, [data-testid="avatar"], img[alt*="avatar" i]').first();
      if (await avatar.count() > 0 && await avatar.isVisible()) {
        await expect(avatar).toHaveScreenshot('avatar.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });
  });

  test.describe('Print Styles', () => {
    test('should match print layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('print-layout.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    });
  });

  test.describe('High Contrast Mode', () => {
    test('should support forced-colors mode', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('high-contrast.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.2 // Allow more variance for system colors
      });
    });
  });
});
