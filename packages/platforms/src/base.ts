import { Page } from 'playwright';
import {
  JobListing,
  JobApplication,
  UserProfile,
  IPlatformAdapter,
  PlatformCredentials,
  RateLimitInfo,
  ApplicationSubmission,
  JobPlatform,
  JobSearchQuery,
  AuthStatus,
} from '@job-applier/core';
import { getConfigManager } from '@job-applier/config';
import {
  createPageWithSession,
  savePageSession,
} from '@job-applier/browser-automation';

/**
 * Application result
 */
export interface ApplicationResult {
  success: boolean;
  applicationId?: string;
  message: string;
  errors?: string[];
}

/**
 * Base platform adapter with common functionality
 */
export abstract class BasePlatformAdapter implements IPlatformAdapter {
  abstract readonly platform: JobPlatform;
  abstract readonly name: string;
  abstract readonly baseUrl: string;

  protected page: Page | null = null;
  protected isLoggedIn = false;
  protected rateLimitInfo: RateLimitInfo = {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 5000,
    currentMinute: 0,
    currentHour: 0,
    currentDay: 0,
    lastReset: new Date().toISOString(),
  };

  /**
   * Get or create a page for this platform
   */
  protected async getPage(): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    const { page, hasSession } = await createPageWithSession(this.platform);
    this.page = page;

    if (hasSession) {
      // Try to verify the session is still valid
      await this.navigateToHome();
      this.isLoggedIn = await this.checkLoginStatus();
    }

    return this.page;
  }

  /**
   * Navigate to platform home page
   */
  protected async navigateToHome(): Promise<void> {
    const page = await this.getPage();
    await page.goto(this.baseUrl);
  }

  /**
   * Check if currently logged in (internal)
   */
  abstract checkLoginStatus(): Promise<boolean>;

  /**
   * Log in to the platform (internal)
   */
  abstract login(credentials: PlatformCredentials): Promise<boolean>;

  /**
   * Authenticate (interface requirement)
   */
  async authenticate(): Promise<AuthStatus> {
    try {
      const isAuthenticated = await this.checkLoginStatus();
      if (isAuthenticated) {
        return 'authenticated';
      }
      return 'not-configured';
    } catch {
      return 'invalid';
    }
  }

  /**
   * Check authentication status (interface requirement)
   */
  async checkAuthStatus(): Promise<AuthStatus> {
    return this.authenticate();
  }

  /**
   * Log out from the platform
   */
  async logout(): Promise<void> {
    if (this.page) {
      await savePageSession(this.platform, this.page, false);
    }
    this.isLoggedIn = false;
  }

  /**
   * Check if logged in (internal helper)
   */
  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  /**
   * Check rate limit (interface requirement)
   */
  async checkRateLimit(): Promise<RateLimitInfo> {
    return this.rateLimitInfo;
  }

  /**
   * Wait for rate limit to reset (interface requirement)
   */
  async waitForRateLimit(): Promise<void> {
    if (!this.isRateLimited()) {
      return;
    }

    const cooldownUntil = this.rateLimitInfo.cooldownUntil;
    if (cooldownUntil) {
      const waitTime = new Date(cooldownUntil).getTime() - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Update rate limit info
   */
  protected updateRateLimit(used = 1): void {
    const now = new Date();
    const lastReset = new Date(this.rateLimitInfo.lastReset);

    // Reset counters if enough time has passed
    const minutesPassed = (now.getTime() - lastReset.getTime()) / 60000;
    if (minutesPassed >= 1) {
      this.rateLimitInfo.currentMinute = 0;
    }
    if (minutesPassed >= 60) {
      this.rateLimitInfo.currentHour = 0;
    }
    if (minutesPassed >= 1440) {
      this.rateLimitInfo.currentDay = 0;
      this.rateLimitInfo.lastReset = now.toISOString();
    }

    // Increment usage
    this.rateLimitInfo.currentMinute += used;
    this.rateLimitInfo.currentHour += used;
    this.rateLimitInfo.currentDay += used;

    // Set cooldown if limits exceeded
    if (this.rateLimitInfo.currentMinute >= this.rateLimitInfo.requestsPerMinute) {
      this.rateLimitInfo.cooldownUntil = new Date(now.getTime() + 60000).toISOString();
    } else if (this.rateLimitInfo.currentHour >= this.rateLimitInfo.requestsPerHour) {
      this.rateLimitInfo.cooldownUntil = new Date(now.getTime() + 3600000).toISOString();
    } else if (this.rateLimitInfo.currentDay >= this.rateLimitInfo.requestsPerDay) {
      this.rateLimitInfo.cooldownUntil = new Date(now.getTime() + 86400000).toISOString();
    }
  }

  /**
   * Check if rate limited
   */
  protected isRateLimited(): boolean {
    if (
      this.rateLimitInfo.currentMinute >= this.rateLimitInfo.requestsPerMinute ||
      this.rateLimitInfo.currentHour >= this.rateLimitInfo.requestsPerHour ||
      this.rateLimitInfo.currentDay >= this.rateLimitInfo.requestsPerDay
    ) {
      const cooldownUntil = this.rateLimitInfo.cooldownUntil;
      if (cooldownUntil && new Date() < new Date(cooldownUntil)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Search for jobs (interface requirement)
   */
  abstract searchJobs(query: JobSearchQuery): Promise<JobListing[]>;

  /**
   * Get job details (interface requirement)
   */
  abstract getJobDetails(jobId: string): Promise<JobListing | null>;

  /**
   * Save a job (interface requirement)
   */
  async saveJob(_jobId: string): Promise<boolean> {
    // Default implementation - override in subclasses if platform supports it
    return false;
  }

  /**
   * Apply to a job (interface requirement)
   */
  abstract applyToJob(
    job: JobListing,
    profile: UserProfile,
    submission: ApplicationSubmission
  ): Promise<JobApplication>;

  /**
   * Get application status (interface requirement)
   */
  abstract getApplicationStatus(applicationId: string): Promise<JobApplication | null>;

  /**
   * Close the browser page
   */
  async close(): Promise<void> {
    if (this.page && !this.page.isClosed()) {
      await this.page.close();
    }
    this.page = null;
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string): Promise<string> {
    if (!this.page) {
      throw new Error('No page available');
    }

    const config = getConfigManager();
    const screenshotsDir = config.ensureDataSubdir('screenshots');
    const path = `${screenshotsDir}/${this.platform}-${name}-${Date.now()}.png`;

    await this.page.screenshot({ path, fullPage: true });
    return path;
  }
}
