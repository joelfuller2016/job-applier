import { test as base, expect } from '@playwright/test';

/**
 * Custom test fixtures for Job Applier E2E tests
 */

// Page object models
export class HomePage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL('/');
  }
}

export class AuthPage {
  constructor(private page: any) {}

  async gotoSignIn() {
    await this.page.goto('/auth/signin');
  }

  async gotoError() {
    await this.page.goto('/auth/error');
  }

  async expectSignInLoaded() {
    // Use more specific locator to avoid strict mode violation
    await expect(this.page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  }

  async signInWithDemo() {
    await this.page.click('text=Try Demo Account');
  }

  async signInWithGoogle() {
    await this.page.click('text=Continue with Google');
  }

  async fillCredentials(email: string, password: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}

export class JobsPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/jobs');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL('/jobs');
  }

  async searchJobs(query: string) {
    await this.page.fill('input[placeholder*="Search"]', query);
  }

  async applyFilter(filterType: string, value: string) {
    await this.page.click(`[data-filter="${filterType}"]`);
    await this.page.click(`text=${value}`);
  }
}

export class ApplicationsPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/applications');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL('/applications');
  }
}

export class ProfilePage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/profile');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL('/profile');
  }
}

export class AnalyticsPage {
  constructor(private page: any) {}

  async goto() {
    // Analytics page may be slow, use longer timeout
    await this.page.goto('/analytics', { timeout: 60000 });
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL('/analytics');
  }
}

export class AutomationPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/automation');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL('/automation');
  }
}

export class HuntPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/hunt');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL('/hunt');
  }
}

// Extended test with fixtures
type Fixtures = {
  homePage: HomePage;
  authPage: AuthPage;
  jobsPage: JobsPage;
  applicationsPage: ApplicationsPage;
  profilePage: ProfilePage;
  analyticsPage: AnalyticsPage;
  automationPage: AutomationPage;
  huntPage: HuntPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  jobsPage: async ({ page }, use) => {
    await use(new JobsPage(page));
  },
  applicationsPage: async ({ page }, use) => {
    await use(new ApplicationsPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  analyticsPage: async ({ page }, use) => {
    await use(new AnalyticsPage(page));
  },
  automationPage: async ({ page }, use) => {
    await use(new AutomationPage(page));
  },
  huntPage: async ({ page }, use) => {
    await use(new HuntPage(page));
  },
});

export { expect } from '@playwright/test';
