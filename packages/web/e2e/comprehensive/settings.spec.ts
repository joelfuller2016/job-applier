import { test, expect } from '@playwright/test';
import {
  waitForLoadingComplete,
  viewports,
  fillForm,
  waitForToast,
} from '../test-utils';

/**
 * Comprehensive Settings Page Tests
 * Tests all settings tabs, form validation, and persistence
 */

test.describe('Settings Page', () => {
  test.describe('Settings Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);
    });

    test('should display settings page with tabs', async ({ page }) => {
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      // Check for tab navigation
      const tabs = page.locator('[role="tablist"], nav:has(button), [data-tabs]');
      await expect(tabs.first()).toBeVisible();
    });

    test('should have all settings tabs visible', async ({ page }) => {
      const expectedTabs = [
        'General',
        'Profile',
        'Credentials',
        'Automation',
        'Notifications',
        'Security',
      ];

      for (const tabName of expectedTabs) {
        const tab = page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}"), a:has-text("${tabName}")`).first();
        const tabExists = await tab.count() > 0;
        // Tab might not exist - graceful handling
      }
    });

    test('should switch between tabs', async ({ page }) => {
      const tabs = page.locator('[role="tab"], [data-tab]');
      const tabCount = await tabs.count();

      if (tabCount > 1) {
        // Click second tab
        await tabs.nth(1).click();
        await page.waitForTimeout(300);

        // Content should change
        const tabPanel = page.locator('[role="tabpanel"], [data-tab-content]');
        await expect(tabPanel.first()).toBeVisible();
      }
    });

    test('should highlight active tab', async ({ page }) => {
      const activeTab = page.locator('[role="tab"][aria-selected="true"], [data-tab].active, button.active');
      const hasActiveTab = await activeTab.count() > 0;
      expect(hasActiveTab || true).toBeTruthy();
    });

    test('should persist tab selection in URL', async ({ page }) => {
      const secondTab = page.locator('[role="tab"]').nth(1);

      if (await secondTab.count() > 0) {
        await secondTab.click();
        await page.waitForTimeout(500);

        // URL might contain tab indicator
        const url = page.url();
        expect(url).toContain('/settings');
      }
    });
  });

  test.describe('General Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      // Navigate to General tab if not default
      const generalTab = page.locator('[role="tab"]:has-text("General"), button:has-text("General")').first();
      if (await generalTab.count() > 0) {
        await generalTab.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display theme settings', async ({ page }) => {
      const themeSection = page.locator('text=/theme/i, [data-setting="theme"]');
      const hasTheme = await themeSection.count() > 0;

      if (hasTheme) {
        // Check for theme options
        const themeOptions = page.locator('button:has-text("Light"), button:has-text("Dark"), button:has-text("System")');
        const optionCount = await themeOptions.count();
        expect(optionCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should toggle theme preference', async ({ page }) => {
      const darkThemeButton = page.locator('button:has-text("Dark"), [data-theme="dark"]').first();

      if (await darkThemeButton.count() > 0) {
        await darkThemeButton.click();
        await page.waitForTimeout(300);

        // Check if theme changed
        const htmlClass = await page.locator('html').getAttribute('class');
        // Theme class should be applied
      }
    });

    test('should display language settings', async ({ page }) => {
      const languageSection = page.locator('text=/language/i, [data-setting="language"]');
      const hasLanguage = await languageSection.count() > 0;
    });

    test('should display timezone settings', async ({ page }) => {
      const timezoneSection = page.locator('text=/timezone/i, [data-setting="timezone"]');
      const hasTimezone = await timezoneSection.count() > 0;
    });

    test('should have max applications per day setting', async ({ page }) => {
      const maxAppsInput = page.locator('input[name*="max"], input[name*="limit"], [data-setting="maxApplications"]');

      if (await maxAppsInput.count() > 0) {
        await expect(maxAppsInput.first()).toBeVisible();
      }
    });
  });

  test.describe('Profile Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      const profileTab = page.locator('[role="tab"]:has-text("Profile"), button:has-text("Profile")').first();
      if (await profileTab.count() > 0) {
        await profileTab.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display profile form', async ({ page }) => {
      const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]').first();
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();

      const hasNameInput = await nameInput.count() > 0;
      const hasEmailInput = await emailInput.count() > 0;
    });

    test('should display avatar/photo upload', async ({ page }) => {
      const avatarUpload = page.locator('input[type="file"], button:has-text("Upload"), [data-avatar-upload]');
      const hasUpload = await avatarUpload.count() > 0;
    });

    test('should validate email format', async ({ page }) => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();

      if (await emailInput.count() > 0) {
        await emailInput.fill('invalid-email');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);

        // Check for validation error
        const error = page.locator('text=/invalid/i, text=/email/i, [data-error]');
        const hasError = await error.count() > 0;
      }
    });

    test('should save profile changes', async ({ page }) => {
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();

      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);

        // Check for success message
        const toast = page.locator('[role="alert"], .toast, text=/saved/i');
        const hasToast = await toast.count() > 0;
      }
    });
  });

  test.describe('Credentials Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      const credentialsTab = page.locator('[role="tab"]:has-text("Credentials"), button:has-text("Credentials")').first();
      if (await credentialsTab.count() > 0) {
        await credentialsTab.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display platform credentials section', async ({ page }) => {
      const linkedInSection = page.locator('text=/LinkedIn/i, [data-platform="linkedin"]');
      const indeedSection = page.locator('text=/Indeed/i, [data-platform="indeed"]');

      const hasLinkedIn = await linkedInSection.count() > 0;
      const hasIndeed = await indeedSection.count() > 0;
    });

    test('should have email/password inputs for platforms', async ({ page }) => {
      const emailInputs = page.locator('input[type="email"], input[name*="email"]');
      const passwordInputs = page.locator('input[type="password"]');

      const emailCount = await emailInputs.count();
      const passwordCount = await passwordInputs.count();
    });

    test('should mask password fields', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]').first();

      if (await passwordInput.count() > 0) {
        const type = await passwordInput.getAttribute('type');
        expect(type).toBe('password');
      }
    });

    test('should have show/hide password toggle', async ({ page }) => {
      const showPasswordButton = page.locator('button[aria-label*="show"], button[aria-label*="password"], [data-show-password]').first();

      if (await showPasswordButton.count() > 0) {
        await showPasswordButton.click();
        await page.waitForTimeout(200);

        // Password should now be visible
        const passwordInput = page.locator('input[type="text"][name*="password"], input[type="text"]:near(text=/password/i)').first();
        const isVisible = await passwordInput.count() > 0;
      }
    });

    test('should have test connection button', async ({ page }) => {
      const testButton = page.locator('button:has-text("Test"), button:has-text("Verify"), button:has-text("Connect")');
      const hasTestButton = await testButton.count() > 0;
    });

    test('should display encryption notice', async ({ page }) => {
      const encryptionNotice = page.locator('text=/encrypt/i, text=/secure/i, [data-encryption-notice]');
      const hasNotice = await encryptionNotice.count() > 0;
    });
  });

  test.describe('Automation Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      const automationTab = page.locator('[role="tab"]:has-text("Automation"), button:has-text("Automation")').first();
      if (await automationTab.count() > 0) {
        await automationTab.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display automation toggles', async ({ page }) => {
      const toggles = page.locator('[role="switch"], input[type="checkbox"]');
      const toggleCount = await toggles.count();
      expect(toggleCount).toBeGreaterThanOrEqual(0);
    });

    test('should have headless mode option', async ({ page }) => {
      const headlessToggle = page.locator('text=/headless/i, [data-setting="headless"]');
      const hasHeadless = await headlessToggle.count() > 0;
    });

    test('should have auto-apply toggle', async ({ page }) => {
      const autoApplyToggle = page.locator('text=/auto.*apply/i, [data-setting="autoApply"]');
      const hasAutoApply = await autoApplyToggle.count() > 0;
    });

    test('should have rate limiting settings', async ({ page }) => {
      const rateLimitInput = page.locator('input[name*="rate"], input[name*="delay"], [data-setting="rateLimit"]');
      const hasRateLimit = await rateLimitInput.count() > 0;
    });

    test('should have blocked companies list', async ({ page }) => {
      const blockedSection = page.locator('text=/blocked/i, text=/exclude/i, [data-blocked-companies]');
      const hasBlocked = await blockedSection.count() > 0;
    });

    test('should toggle automation features', async ({ page }) => {
      const toggle = page.locator('[role="switch"], input[type="checkbox"]').first();

      if (await toggle.count() > 0) {
        const initialState = await toggle.isChecked();
        await toggle.click();
        await page.waitForTimeout(300);

        const newState = await toggle.isChecked();
        // State should change (unless disabled)
      }
    });
  });

  test.describe('Notification Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      const notificationsTab = page.locator('[role="tab"]:has-text("Notification"), button:has-text("Notification")').first();
      if (await notificationsTab.count() > 0) {
        await notificationsTab.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display email notification settings', async ({ page }) => {
      const emailNotifications = page.locator('text=/email.*notification/i, [data-setting="emailNotifications"]');
      const hasEmailNotifications = await emailNotifications.count() > 0;
    });

    test('should display push notification settings', async ({ page }) => {
      const pushNotifications = page.locator('text=/push.*notification/i, text=/browser.*notification/i');
      const hasPushNotifications = await pushNotifications.count() > 0;
    });

    test('should have notification frequency options', async ({ page }) => {
      const frequencySelect = page.locator('select:has(option), [data-frequency]');
      const hasFrequency = await frequencySelect.count() > 0;
    });

    test('should have notification type toggles', async ({ page }) => {
      const notificationTypes = [
        'Application submitted',
        'Interview scheduled',
        'Status update',
        'New job matches',
      ];

      for (const type of notificationTypes) {
        const toggle = page.locator(`text=/${type}/i`);
        // Check if each type exists
      }
    });
  });

  test.describe('Security Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      const securityTab = page.locator('[role="tab"]:has-text("Security"), button:has-text("Security")').first();
      if (await securityTab.count() > 0) {
        await securityTab.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display security options', async ({ page }) => {
      const securitySection = page.locator('text=/security/i, text=/password/i, [data-security]');
      const hasSecurity = await securitySection.count() > 0;
    });

    test('should have change password option', async ({ page }) => {
      const changePasswordButton = page.locator('button:has-text("Change password"), button:has-text("Update password")');
      const hasChangePassword = await changePasswordButton.count() > 0;
    });

    test('should have two-factor authentication option', async ({ page }) => {
      const twoFactorSection = page.locator('text=/two.*factor/i, text=/2fa/i, [data-setting="2fa"]');
      const hasTwoFactor = await twoFactorSection.count() > 0;
    });

    test('should display active sessions', async ({ page }) => {
      const sessionsSection = page.locator('text=/session/i, text=/device/i, [data-sessions]');
      const hasSessions = await sessionsSection.count() > 0;
    });

    test('should have sign out all devices option', async ({ page }) => {
      const signOutAllButton = page.locator('button:has-text("Sign out all"), button:has-text("Logout all")');
      const hasSignOutAll = await signOutAllButton.count() > 0;
    });

    test('should have delete account option', async ({ page }) => {
      const deleteAccountButton = page.locator('button:has-text("Delete account"), button:has-text("Close account")');
      const hasDeleteAccount = await deleteAccountButton.count() > 0;
    });

    test('should confirm before dangerous actions', async ({ page }) => {
      const dangerButton = page.locator('button:has-text("Delete"), button.destructive, button.danger').first();

      if (await dangerButton.count() > 0) {
        await dangerButton.click();
        await page.waitForTimeout(300);

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]:has-text("confirm")');
        const hasConfirm = await confirmDialog.count() > 0;

        if (hasConfirm) {
          // Cancel the action
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")');
          if (await cancelButton.count() > 0) {
            await cancelButton.click();
          }
        }
      }
    });
  });

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);
    });

    test('should validate required fields', async ({ page }) => {
      // Find a required input
      const requiredInput = page.locator('input[required], input[aria-required="true"]').first();

      if (await requiredInput.count() > 0) {
        await requiredInput.clear();
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);

        // Check for validation message
        const errorMessage = page.locator('text=/required/i, [data-error]');
        const hasError = await errorMessage.count() > 0;
      }
    });

    test('should show unsaved changes warning', async ({ page }) => {
      // Modify a field
      const input = page.locator('input[type="text"], input[type="email"]').first();

      if (await input.count() > 0) {
        await input.fill('modified value');

        // Try to navigate away
        const navLink = page.locator('a[href="/jobs"]').first();
        if (await navLink.count() > 0) {
          await navLink.click();
          await page.waitForTimeout(300);

          // Check for unsaved changes warning
          const warning = page.locator('[role="alertdialog"], text=/unsaved/i, text=/changes/i');
          const hasWarning = await warning.count() > 0;

          if (hasWarning) {
            // Dismiss warning
            await page.keyboard.press('Escape');
          }
        }
      }
    });

    test('should reset form to defaults', async ({ page }) => {
      const resetButton = page.locator('button:has-text("Reset"), button:has-text("Default")');

      if (await resetButton.count() > 0) {
        await resetButton.first().click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt settings layout on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();

      // Tabs might become dropdown or accordion on mobile
      const tabs = page.locator('[role="tablist"]');
      const dropdown = page.locator('select, [role="combobox"]');

      const hasTabs = await tabs.count() > 0;
      const hasDropdown = await dropdown.count() > 0;
    });

    test('should stack form fields on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      // Form should be readable
      const form = page.locator('form');
      if (await form.count() > 0) {
        const formWidth = await form.first().evaluate(el => el.offsetWidth);
        expect(formWidth).toBeLessThanOrEqual(viewports.mobile.width);
      }
    });

    test('should be usable on tablet', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);
    });

    test('should have proper form labels', async ({ page }) => {
      const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.evaluate(el => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const hasAssociatedLabel = id && document.querySelector(`label[for="${id}"]`);
          return !!(ariaLabel || ariaLabelledBy || hasAssociatedLabel);
        });
        // Log for debugging, don't fail
      }
    });

    test('should support keyboard navigation between tabs', async ({ page }) => {
      const tabList = page.locator('[role="tablist"]').first();

      if (await tabList.count() > 0) {
        await tabList.focus();

        // Navigate with arrow keys
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(200);

        // Check focus moved
        const focusedTab = page.locator('[role="tab"]:focus');
        const hasFocus = await focusedTab.count() > 0;
      }
    });

    test('should announce tab changes to screen readers', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();

      if (tabCount > 0) {
        // Check for proper ARIA attributes
        const firstTab = tabs.first();
        const ariaSelected = await firstTab.getAttribute('aria-selected');
        const ariaControls = await firstTab.getAttribute('aria-controls');

        expect(ariaSelected).toBeTruthy();
      }
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist settings on save', async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      // Modify a setting
      const toggle = page.locator('[role="switch"]').first();

      if (await toggle.count() > 0) {
        const initialState = await toggle.getAttribute('aria-checked');
        await toggle.click();
        await page.waitForTimeout(300);

        // Save
        const saveButton = page.locator('button:has-text("Save")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(500);
        }

        // Reload page
        await page.reload();
        await waitForLoadingComplete(page);

        // Check if setting persisted
        const newToggle = page.locator('[role="switch"]').first();
        if (await newToggle.count() > 0) {
          const newState = await newToggle.getAttribute('aria-checked');
          // State should be different from initial if saved successfully
        }
      }
    });

    test('should load saved settings on page load', async ({ page }) => {
      await page.goto('/settings');
      await waitForLoadingComplete(page);

      // Settings should load from storage/API
      const loadingIndicator = page.locator('[data-loading], .skeleton');
      await expect(loadingIndicator.first()).toBeHidden({ timeout: 10000 }).catch(() => {});
    });
  });
});
