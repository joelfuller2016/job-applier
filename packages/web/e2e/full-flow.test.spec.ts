import { test, expect } from './fixtures';

/**
 * Test Mode Full Flow Tests
 * End-to-end user journey tests with mock data
 */

test.describe('Test Mode Full Flow', () => {
  test('complete user journey - view jobs to applications', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Navigate to jobs
    await page.goto('/jobs');
    await expect(page).toHaveURL('/jobs');

    // Navigate to applications
    await page.goto('/applications');
    await expect(page).toHaveURL('/applications');

    // Check analytics
    await page.goto('/analytics', { timeout: 60000 });
    await expect(page).toHaveURL('/analytics');
  });

  test('profile workflow', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Check for any interactive elements (inputs, buttons, forms, etc.)
    const formElements = page.locator('input, textarea, button, select, [contenteditable]');
    const hasFormElements = await formElements.count() > 0;
    expect(hasFormElements).toBeTruthy();
  });

  test('automation configuration flow', async ({ page }) => {
    await page.goto('/automation');
    await expect(page).toHaveURL('/automation');
    
    // Check for configuration controls
    const controls = page.locator('button, input, select, [role="switch"]');
    const hasControls = await controls.count() > 0;
    expect(hasControls).toBeTruthy();
  });

  test('job hunt initiation flow', async ({ page }) => {
    await page.goto('/hunt');
    await expect(page).toHaveURL('/hunt');
    
    // Check for hunt controls
    const buttons = page.locator('button');
    const hasButtons = await buttons.count() > 0;
    expect(hasButtons).toBeTruthy();
  });

  test('authentication flow - signin page elements', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Verify all auth options present
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('text=Try Demo Account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('error handling flow', async ({ page }) => {
    // Test various error states
    const errorTypes = [
      'Configuration',
      'AccessDenied',
      'CredentialsSignin',
      'OAuthAccountNotLinked',
      'Default'
    ];

    for (const errorType of errorTypes) {
      await page.goto(`/auth/error?error=${errorType}`);
      await expect(page.locator('body')).toBeVisible();
      
      // Should have navigation buttons
      await expect(page.locator('text=Back to Sign In')).toBeVisible();
      await expect(page.locator('text=Go to Home')).toBeVisible();
    }
  });
});
