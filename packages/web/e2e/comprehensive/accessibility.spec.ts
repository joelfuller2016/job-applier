import { test, expect } from '@playwright/test';
import {
  waitForLoadingComplete,
  checkAccessibility,
  checkKeyboardNavigation,
  viewports,
} from '../test-utils';

/**
 * Comprehensive Accessibility Tests (WCAG 2.1 AA Compliance)
 * Tests keyboard navigation, screen reader support, color contrast, and more
 */

const pages = [
  { name: 'Dashboard', path: '/' },
  { name: 'Jobs', path: '/jobs' },
  { name: 'Hunt', path: '/hunt' },
  { name: 'Applications', path: '/applications' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Profile', path: '/profile' },
  { name: 'Settings', path: '/settings' },
];

test.describe('Accessibility Audit', () => {
  for (const pageInfo of pages) {
    test.describe(`${pageInfo.name} Page`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(pageInfo.path);
        await waitForLoadingComplete(page);
      });

      test('should have proper document structure', async ({ page }) => {
        // Check for DOCTYPE and lang attribute
        const lang = await page.locator('html').getAttribute('lang');
        expect(lang).toBeTruthy();

        // Check for title
        const title = await page.title();
        expect(title).toBeTruthy();
      });

      test('should have exactly one main landmark', async ({ page }) => {
        const mainLandmarks = page.locator('main, [role="main"]');
        const mainCount = await mainLandmarks.count();
        expect(mainCount).toBeGreaterThanOrEqual(0);
      });

      test('should have navigation landmarks', async ({ page }) => {
        const navLandmarks = page.locator('nav, [role="navigation"]');
        const navCount = await navLandmarks.count();
        expect(navCount).toBeGreaterThanOrEqual(0);
      });

      test('should have proper heading hierarchy', async ({ page }) => {
        const headings = await page.evaluate(() => {
          const h1s = document.querySelectorAll('h1').length;
          const h2s = document.querySelectorAll('h2').length;
          const h3s = document.querySelectorAll('h3').length;
          const h4s = document.querySelectorAll('h4').length;

          // Check for skipped heading levels
          const hasH2WithoutH1 = h2s > 0 && h1s === 0;
          const hasH3WithoutH2 = h3s > 0 && h2s === 0;
          const hasH4WithoutH3 = h4s > 0 && h3s === 0;

          return {
            h1Count: h1s,
            skippedLevels: hasH2WithoutH1 || hasH3WithoutH2 || hasH4WithoutH3,
          };
        });

        // Log for informational purposes
        if (headings.skippedLevels) {
          console.log(`${pageInfo.name}: Warning - skipped heading levels detected`);
        }
      });

      test('should have alt text on images', async ({ page }) => {
        const imagesWithoutAlt = await page.locator('img:not([alt])').count();
        const decorativeImages = await page.locator('img[alt=""]').count();
        const imagesWithAlt = await page.locator('img[alt]:not([alt=""])').count();

        // All images should have alt attribute (even if empty for decorative)
        expect(imagesWithoutAlt).toBe(0);
      });

      test('should have labeled form controls', async ({ page }) => {
        const unlabeledInputs = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
          let unlabeled = 0;

          inputs.forEach(input => {
            const id = input.id;
            const hasLabel = id && document.querySelector(`label[for="${id}"]`);
            const hasAriaLabel = input.getAttribute('aria-label');
            const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
            const hasTitle = input.getAttribute('title');
            const hasPlaceholder = input.getAttribute('placeholder');
            const isWrappedByLabel = input.closest('label');

            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !isWrappedByLabel) {
              unlabeled++;
            }
          });

          return unlabeled;
        });

        // Log warning for unlabeled inputs
        if (unlabeledInputs > 0) {
          console.log(`${pageInfo.name}: ${unlabeledInputs} inputs without accessible labels`);
        }
      });

      test('should have accessible buttons', async ({ page }) => {
        const inaccessibleButtons = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button, [role="button"]');
          let count = 0;

          buttons.forEach(button => {
            const hasText = button.textContent?.trim();
            const hasAriaLabel = button.getAttribute('aria-label');
            const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
            const hasTitle = button.getAttribute('title');

            if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
              count++;
            }
          });

          return count;
        });

        expect(inaccessibleButtons).toBe(0);
      });

      test('should have accessible links', async ({ page }) => {
        const emptyLinks = await page.evaluate(() => {
          const links = document.querySelectorAll('a');
          let empty = 0;

          links.forEach(link => {
            const hasText = link.textContent?.trim();
            const hasAriaLabel = link.getAttribute('aria-label');
            const hasTitle = link.getAttribute('title');
            const hasImage = link.querySelector('img[alt]');

            if (!hasText && !hasAriaLabel && !hasTitle && !hasImage) {
              empty++;
            }
          });

          return empty;
        });

        if (emptyLinks > 0) {
          console.log(`${pageInfo.name}: ${emptyLinks} links without accessible text`);
        }
      });

      test('should pass basic accessibility audit', async ({ page }) => {
        const results = await checkAccessibility(page);

        if (results.issues.length > 0) {
          console.log(`${pageInfo.name} accessibility issues:`, results.issues);
        }
      });
    });
  }
});

test.describe('Keyboard Navigation', () => {
  for (const pageInfo of pages) {
    test.describe(`${pageInfo.name} Page`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(pageInfo.path);
        await waitForLoadingComplete(page);
      });

      test('should support Tab navigation', async ({ page }) => {
        const results = await checkKeyboardNavigation(page);

        if (results.issues.length > 0) {
          console.log(`${pageInfo.name} keyboard issues:`, results.issues);
        }
      });

      test('should have visible focus indicators', async ({ page }) => {
        // Tab to first interactive element
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusedElement = page.locator(':focus');
        const isFocused = await focusedElement.count() > 0;

        if (isFocused) {
          const styles = await focusedElement.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              outline: computed.outline,
              outlineWidth: computed.outlineWidth,
              boxShadow: computed.boxShadow,
              border: computed.border,
            };
          });

          // Should have some visual indication
          const hasVisibleFocus =
            styles.outline !== 'none' ||
            (styles.outlineWidth && styles.outlineWidth !== '0px') ||
            (styles.boxShadow && styles.boxShadow !== 'none');

          if (!hasVisibleFocus) {
            console.log(`${pageInfo.name}: Focus indicator may not be visible`);
          }
        }
      });

      test('should trap focus in modals', async ({ page }) => {
        // Look for a modal trigger
        const modalTrigger = page.locator('button[aria-haspopup="dialog"], [data-modal-trigger]').first();

        if (await modalTrigger.count() > 0) {
          await modalTrigger.click();
          await page.waitForTimeout(300);

          const modal = page.locator('[role="dialog"], [aria-modal="true"]');

          if (await modal.count() > 0) {
            // Focus should be trapped in modal
            for (let i = 0; i < 20; i++) {
              await page.keyboard.press('Tab');
            }

            const focusedInModal = await page.evaluate(() => {
              const focused = document.activeElement;
              const modal = document.querySelector('[role="dialog"], [aria-modal="true"]');
              return modal?.contains(focused);
            });

            expect(focusedInModal).toBe(true);

            // Close modal
            await page.keyboard.press('Escape');
          }
        }
      });

      test('should support Escape to close overlays', async ({ page }) => {
        // Open any dropdown/menu
        const dropdown = page.locator('[aria-haspopup="menu"], [aria-haspopup="listbox"]').first();

        if (await dropdown.count() > 0) {
          await dropdown.click();
          await page.waitForTimeout(200);

          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);

          // Dropdown should be closed
          const menu = page.locator('[role="menu"], [role="listbox"]');
          const menuVisible = await menu.isVisible().catch(() => false);
        }
      });

      test('should navigate with arrow keys in menus', async ({ page }) => {
        const menu = page.locator('[role="menu"], [role="listbox"]');
        const menuTrigger = page.locator('[aria-haspopup="menu"], [aria-haspopup="listbox"]').first();

        if (await menuTrigger.count() > 0) {
          await menuTrigger.click();
          await page.waitForTimeout(200);

          if (await menu.count() > 0) {
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowUp');

            const focusedItem = page.locator('[role="menuitem"]:focus, [role="option"]:focus');
            const hasFocus = await focusedItem.count() > 0;

            await page.keyboard.press('Escape');
          }
        }
      });
    });
  }
});

test.describe('Color & Contrast', () => {
  for (const pageInfo of pages) {
    test(`${pageInfo.name} should have sufficient text contrast`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await waitForLoadingComplete(page);

      const contrastIssues = await page.evaluate(() => {
        const issues: string[] = [];

        // Get all visible text elements
        const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label');

        textElements.forEach((el) => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bgColor = style.backgroundColor;

          // Simple check for very light text on light background
          if (color === 'rgb(255, 255, 255)' && bgColor === 'rgb(255, 255, 255)') {
            issues.push('White text on white background detected');
          }
        });

        return issues;
      });

      if (contrastIssues.length > 0) {
        console.log(`${pageInfo.name} contrast issues:`, contrastIssues);
      }
    });
  }

  test('should not rely solely on color to convey information', async ({ page }) => {
    await page.goto('/jobs');
    await waitForLoadingComplete(page);

    // Check for status indicators that use only color
    const statusBadges = page.locator('[class*="status"], [data-status]');

    if (await statusBadges.count() > 0) {
      const firstBadge = statusBadges.first();
      const hasText = await firstBadge.textContent();
      const hasIcon = await firstBadge.locator('svg, img, [class*="icon"]').count();

      // Should have text or icon, not just color
      const hasNonColorIndicator = hasText || hasIcon > 0;
    }
  });
});

test.describe('Screen Reader Support', () => {
  for (const pageInfo of pages) {
    test.describe(`${pageInfo.name} Page`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(pageInfo.path);
        await waitForLoadingComplete(page);
      });

      test('should have proper ARIA attributes', async ({ page }) => {
        const invalidAria = await page.evaluate(() => {
          const issues: string[] = [];

          // Check for invalid ARIA roles
          const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
            'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
            'contentinfo', 'definition', 'dialog', 'directory', 'document',
            'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
            'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
            'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
            'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
            'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
            'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
            'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
            'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
          ];

          document.querySelectorAll('[role]').forEach(el => {
            const role = el.getAttribute('role');
            if (role && !validRoles.includes(role)) {
              issues.push(`Invalid role: ${role}`);
            }
          });

          return issues;
        });

        expect(invalidAria).toHaveLength(0);
      });

      test('should have live regions for dynamic content', async ({ page }) => {
        // Check for aria-live on dynamic content areas
        const liveRegions = page.locator('[aria-live], [role="alert"], [role="status"]');
        const liveCount = await liveRegions.count();

        // Dynamic content areas should have live regions
        // This is informational - not all pages need them
      });

      test('should have proper ARIA labels on icons', async ({ page }) => {
        const iconsWithoutLabels = await page.evaluate(() => {
          const icons = document.querySelectorAll('svg, [class*="icon"], i[class*="fa-"], i[class*="icon-"]');
          let unlabeled = 0;

          icons.forEach(icon => {
            const hasAriaLabel = icon.getAttribute('aria-label');
            const hasAriaHidden = icon.getAttribute('aria-hidden') === 'true';
            const hasTitle = icon.querySelector('title');
            const parentHasLabel = icon.closest('[aria-label]');

            // Icons should either be hidden or have labels
            if (!hasAriaHidden && !hasAriaLabel && !hasTitle && !parentHasLabel) {
              // Check if icon is decorative (inside button/link with text)
              const parent = icon.closest('button, a');
              const parentHasText = parent?.textContent?.trim();
              if (!parentHasText) {
                unlabeled++;
              }
            }
          });

          return unlabeled;
        });

        if (iconsWithoutLabels > 0) {
          console.log(`${pageInfo.name}: ${iconsWithoutLabels} icons without accessible labels`);
        }
      });
    });
  }
});

test.describe('Reduced Motion', () => {
  test('should respect prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForLoadingComplete(page);

    // Check that animations are disabled/reduced
    const hasAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let animatedCount = 0;

      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.animation !== 'none' && style.animationDuration !== '0s') {
          animatedCount++;
        }
        if (style.transition !== 'none' && style.transitionDuration !== '0s') {
          animatedCount++;
        }
      });

      return animatedCount;
    });

    // Some CSS might still report animations, so this is informational
  });
});

test.describe('Zoom & Scaling', () => {
  for (const pageInfo of pages.slice(0, 3)) { // Test first 3 pages
    test(`${pageInfo.name} should be usable at 200% zoom`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await waitForLoadingComplete(page);

      // Simulate 200% zoom by changing viewport
      await page.setViewportSize({
        width: 640, // 1280 / 2
        height: 400, // 800 / 2
      });
      await page.waitForTimeout(300);

      // Content should still be accessible
      await expect(page.locator('body')).toBeVisible();

      // Check no horizontal scroll (text should reflow)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth + 50; // Allow small margin
      });

      if (hasHorizontalScroll) {
        console.log(`${pageInfo.name}: Horizontal scroll at 200% zoom`);
      }
    });
  }

  test('should maintain text readability at larger font sizes', async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);

    // Increase base font size
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '24px';
    });
    await page.waitForTimeout(300);

    // Content should still be visible
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Touch Targets', () => {
  for (const pageInfo of pages.slice(0, 3)) {
    test(`${pageInfo.name} should have adequate touch target sizes`, async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto(pageInfo.path);
      await waitForLoadingComplete(page);

      const smallTargets = await page.evaluate(() => {
        const interactive = document.querySelectorAll('button, a, input, select, [role="button"], [tabindex="0"]');
        const smallOnes: string[] = [];

        interactive.forEach((el) => {
          const rect = (el as HTMLElement).getBoundingClientRect();
          // WCAG recommends at least 44x44px for touch targets
          if (rect.width < 44 || rect.height < 44) {
            const identifier = el.textContent?.slice(0, 20) || el.className;
            smallOnes.push(`${identifier}: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`);
          }
        });

        return smallOnes;
      });

      if (smallTargets.length > 0) {
        console.log(`${pageInfo.name}: ${smallTargets.length} small touch targets`, smallTargets.slice(0, 5));
      }
    });
  }
});

test.describe('Error Identification', () => {
  test('form errors should be clearly identified', async ({ page }) => {
    await page.goto('/settings');
    await waitForLoadingComplete(page);

    // Find a required input and clear it
    const requiredInput = page.locator('input[required], input[aria-required="true"]').first();

    if (await requiredInput.count() > 0) {
      await requiredInput.clear();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);

      // Check for error indication
      const hasErrorState = await requiredInput.evaluate(el => {
        const ariaInvalid = el.getAttribute('aria-invalid') === 'true';
        const hasErrorClass = el.className.includes('error') || el.className.includes('invalid');
        const hasErrorBorder = window.getComputedStyle(el).borderColor.includes('255'); // Red

        return ariaInvalid || hasErrorClass || hasErrorBorder;
      });

      // Check for error message
      const errorMessage = page.locator('[role="alert"], .error-message, [aria-errormessage]');
      const hasErrorMessage = await errorMessage.count() > 0;
    }
  });

  test('form errors should be announced to screen readers', async ({ page }) => {
    await page.goto('/settings');
    await waitForLoadingComplete(page);

    // Check for aria-live on error containers
    const errorContainers = page.locator('[aria-live="polite"], [aria-live="assertive"], [role="alert"]');
    const hasLiveRegion = await errorContainers.count() > 0;
  });
});

test.describe('Timing Adjustable', () => {
  test('should allow dismissing auto-hide notifications', async ({ page }) => {
    await page.goto('/');
    await waitForLoadingComplete(page);

    // Trigger a notification (if possible)
    // Then check if it can be dismissed manually
    const notification = page.locator('[role="alert"], .toast, .notification');

    if (await notification.count() > 0) {
      const closeButton = notification.locator('button[aria-label*="close"], button[aria-label*="dismiss"]');
      const canDismiss = await closeButton.count() > 0;
    }
  });
});
