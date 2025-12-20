import { test, expect } from './fixtures';

/**
 * Production Auth Tests
 * Tests authentication pages without mocking
 */

test.describe('Production Auth Pages', () => {
  test.describe('Sign In Page', () => {
    test('should display sign in page correctly', async ({ page, authPage }) => {
      await authPage.gotoSignIn();
      await authPage.expectSignInLoaded();

      // Check for branding
      await expect(page.locator('text=Welcome to JobApplier')).toBeVisible();
      await expect(page.locator('text=Sign in to manage your job applications')).toBeVisible();
    });

    test('should have Google OAuth button', async ({ page }) => {
      await page.goto('/auth/signin');
      
      const googleButton = page.locator('text=Continue with Google');
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    });

    test('should have Demo Account button', async ({ page }) => {
      await page.goto('/auth/signin');
      
      const demoButton = page.locator('text=Try Demo Account');
      await expect(demoButton).toBeVisible();
      await expect(demoButton).toBeEnabled();
    });

    test('should have email/password form', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should have separator between OAuth and form', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await expect(page.locator('text=Or continue with email')).toBeVisible();
    });

    test('should show terms and privacy footer', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await expect(page.locator('text=Terms of Service')).toBeVisible();
    });

    test('should disable submit button when form is empty', async ({ page }) => {
      await page.goto('/auth/signin');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });

    test('should enable submit button when form is filled', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Error Page', () => {
    test('should display default error message', async ({ page }) => {
      await page.goto('/auth/error');
      
      await expect(page.locator('text=Authentication Error')).toBeVisible();
      await expect(page.locator('text=An unexpected error occurred')).toBeVisible();
    });

    test('should display Configuration error', async ({ page }) => {
      await page.goto('/auth/error?error=Configuration');
      
      await expect(page.locator('text=Server Configuration Error')).toBeVisible();
    });

    test('should display AccessDenied error', async ({ page }) => {
      await page.goto('/auth/error?error=AccessDenied');
      
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should display CredentialsSignin error', async ({ page }) => {
      await page.goto('/auth/error?error=CredentialsSignin');
      
      await expect(page.locator('text=Sign In Failed')).toBeVisible();
    });

    test('should display OAuthAccountNotLinked error', async ({ page }) => {
      await page.goto('/auth/error?error=OAuthAccountNotLinked');
      
      await expect(page.locator('text=Account Not Linked')).toBeVisible();
    });

    test('should have back to sign in button', async ({ page }) => {
      await page.goto('/auth/error');
      
      const backButton = page.locator('text=Back to Sign In');
      await expect(backButton).toBeVisible();
      
      await backButton.click();
      await expect(page).toHaveURL('/auth/signin');
    });

    test('should have go to home button', async ({ page }) => {
      await page.goto('/auth/error');
      
      const homeButton = page.locator('text=Go to Home');
      await expect(homeButton).toBeVisible();
      
      await homeButton.click();
      await expect(page).toHaveURL('/');
    });
  });
});
