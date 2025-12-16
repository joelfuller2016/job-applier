import { Page } from 'playwright';
import {
  JobListing,
  JobApplication,
  UserProfile,
  CoverLetter,
  PlatformCredentials,
  ApplicationSubmission,
  JobSearchQuery,
  generateId,
  toISOString,
  BrowserError,
} from '@job-applier/core';
import {
  clickElement,
  fillField,
  waitForElement,
  elementExists,
  humanDelay,
  navigateTo,
  uploadFile,
  getTextContent,
  selectOption,
} from '@job-applier/browser-automation';
import { BasePlatformAdapter } from '../base.js';
import { LinkedInSelectors, LinkedInUrls } from './selectors.js';

/**
 * LinkedIn platform adapter
 */
export class LinkedInAdapter extends BasePlatformAdapter {
  readonly platform = 'linkedin' as const;
  readonly name = 'LinkedIn';
  readonly baseUrl = LinkedInUrls.base;

  /**
   * Check if currently logged in
   */
  async checkLoginStatus(): Promise<boolean> {
    const page = await this.getPage();

    try {
      // Check for profile icon which appears when logged in
      const isLoggedIn = await elementExists(
        page,
        LinkedInSelectors.navigation.profileIcon,
        5000
      );
      this.isLoggedIn = isLoggedIn;
      return isLoggedIn;
    } catch {
      this.isLoggedIn = false;
      return false;
    }
  }

  /**
   * Log in to LinkedIn
   */
  async login(credentials: PlatformCredentials): Promise<boolean> {
    const page = await this.getPage();

    try {
      // Validate credentials
      if (!credentials.email || !credentials.password) {
        throw new BrowserError('Email and password are required for LinkedIn login');
      }

      // Navigate to login page
      await navigateTo(page, LinkedInUrls.login);
      await humanDelay();

      // Fill in credentials
      await fillField(page, LinkedInSelectors.login.emailInput, credentials.email);
      await humanDelay();
      await fillField(page, LinkedInSelectors.login.passwordInput, credentials.password);
      await humanDelay();

      // Submit login form
      await clickElement(page, LinkedInSelectors.login.submitButton);

      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });

      // Check for login errors
      const hasError = await elementExists(page, LinkedInSelectors.login.errorMessage, 3000);
      if (hasError) {
        const errorMessage = await getTextContent(page, LinkedInSelectors.login.errorMessage);
        throw new BrowserError(`Login failed: ${errorMessage}`);
      }

      // Verify successful login
      this.isLoggedIn = await this.checkLoginStatus();

      if (this.isLoggedIn) {
        // Save session
        const { savePageSession } = await import('@job-applier/browser-automation');
        await savePageSession(this.platform, page, true);
      }

      return this.isLoggedIn;
    } catch (error) {
      if (error instanceof BrowserError) throw error;
      throw new BrowserError(
        `LinkedIn login failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search for jobs on LinkedIn
   */
  async searchJobs(query: JobSearchQuery): Promise<JobListing[]> {
    if (this.isRateLimited()) {
      throw new BrowserError('Rate limited. Please try again later.');
    }

    const page = await this.getPage();
    const jobs: JobListing[] = [];

    try {
      // Navigate to job search
      const searchUrl = new URL(LinkedInUrls.jobSearch);
      searchUrl.searchParams.set('keywords', query.keywords.join(' '));

      if (query.location) {
        searchUrl.searchParams.set('location', query.location);
      }
      if (query.remote) {
        searchUrl.searchParams.set('f_WT', '2'); // Remote filter
      }
      // Always filter for easy apply if using automation
      searchUrl.searchParams.set('f_AL', 'true');

      await navigateTo(page, searchUrl.toString());
      await humanDelay();

      // Wait for job cards to load
      await waitForElement(page, LinkedInSelectors.search.jobCards, { timeout: 10000 });

      // Get all job cards
      const jobCards = await page.$$(LinkedInSelectors.search.jobCards);
      const maxResults = query.limit || 25;

      for (const card of jobCards.slice(0, maxResults)) {
        try {
          // Click on job card to load details
          await card.click();
          await humanDelay();

          // Extract job details
          const title = await card.$eval(
            LinkedInSelectors.search.jobTitle,
            el => el.textContent?.trim() ?? ''
          ).catch(() => '');

          const company = await card.$eval(
            LinkedInSelectors.search.companyName,
            el => el.textContent?.trim() ?? ''
          ).catch(() => '');

          const location = await card.$eval(
            LinkedInSelectors.search.location,
            el => el.textContent?.trim() ?? ''
          ).catch(() => '');

          const jobLink = await card.$eval('a', el => el.href).catch(() => '');

          // Extract job ID from URL
          const jobIdMatch = jobLink.match(/\/jobs\/view\/(\d+)/);
          const externalId = jobIdMatch ? jobIdMatch[1] : generateId();

          // Check for Easy Apply badge
          const hasEasyApply = await card.$(LinkedInSelectors.search.easyApplyBadge) !== null;

          // Get full description from details panel
          let description = '';
          try {
            await waitForElement(page, LinkedInSelectors.jobDetails.description, { timeout: 5000 });
            description = await getTextContent(page, LinkedInSelectors.jobDetails.description);
          } catch {
            // Description might not load immediately
          }

          const job: JobListing = {
            id: generateId(),
            externalId,
            platform: 'linkedin',
            title,
            company: { name: company },
            location,
            description,
            requirements: [],
            requiredSkills: [],
            url: jobLink,
            easyApply: hasEasyApply,
            discoveredAt: toISOString(new Date()),
            updatedAt: toISOString(new Date()),
          };

          jobs.push(job);
          this.updateRateLimit(1);
        } catch (error) {
          console.error('Failed to extract job:', error);
          // Continue with next job
        }
      }

      return jobs;
    } catch (error) {
      throw new BrowserError(
        `Job search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get detailed job information
   */
  async getJobDetails(jobId: string): Promise<JobListing | null> {
    if (this.isRateLimited()) {
      throw new BrowserError('Rate limited. Please try again later.');
    }

    const page = await this.getPage();

    try {
      const jobUrl = `${LinkedInUrls.jobs}view/${jobId}`;
      await navigateTo(page, jobUrl);
      await humanDelay();

      // Wait for job details to load
      await waitForElement(page, LinkedInSelectors.jobDetails.container, { timeout: 10000 });

      const title = await getTextContent(page, LinkedInSelectors.jobDetails.title);
      const company = await getTextContent(page, LinkedInSelectors.jobDetails.company);
      const location = await getTextContent(page, LinkedInSelectors.jobDetails.location);
      const description = await getTextContent(page, LinkedInSelectors.jobDetails.description);

      const hasEasyApply = await elementExists(page, LinkedInSelectors.jobDetails.easyApplyButton, 3000);

      let applicantCount: number | undefined;
      try {
        const applicantText = await getTextContent(page, LinkedInSelectors.jobDetails.applicantCount);
        const match = applicantText.match(/\d+/);
        if (match) {
          applicantCount = parseInt(match[0], 10);
        }
      } catch {
        // Applicant count might not be visible
      }

      this.updateRateLimit(1);

      return {
        id: generateId(),
        externalId: jobId,
        platform: 'linkedin',
        title,
        company: { name: company },
        location,
        description,
        requirements: this.extractRequirements(description),
        requiredSkills: this.extractSkills(description),
        url: `${LinkedInUrls.jobs}view/${jobId}`,
        easyApply: hasEasyApply,
        applicantCount,
        discoveredAt: toISOString(new Date()),
        updatedAt: toISOString(new Date()),
      };
    } catch (error) {
      throw new BrowserError(
        `Failed to get job details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Apply to a job using Easy Apply
   */
  async applyToJob(
    job: JobListing,
    profile: UserProfile,
    submission: ApplicationSubmission
  ): Promise<JobApplication> {
    if (this.isRateLimited()) {
      throw new BrowserError('Rate limited. Please try again later.');
    }

    if (!this.isLoggedIn) {
      throw new BrowserError('Not logged in. Please log in first.');
    }

    const page = await this.getPage();
    const applicationId = generateId();
    const now = toISOString(new Date());

    try {
      // Navigate to job page
      await navigateTo(page, job.url);
      await humanDelay();

      // Check if Easy Apply is available
      const hasEasyApply = await elementExists(
        page,
        LinkedInSelectors.jobDetails.easyApplyButton,
        5000
      );

      if (!hasEasyApply) {
        throw new BrowserError('Easy Apply not available for this job.');
      }

      // Click Easy Apply button
      await clickElement(page, LinkedInSelectors.jobDetails.easyApplyButton);
      await humanDelay();

      // Wait for modal
      await waitForElement(page, LinkedInSelectors.easyApply.modal, { timeout: 10000 });

      // Extract cover letter from submission if provided
      const coverLetter = submission.coverLetterUsed
        ? { id: submission.coverLetterUsed, content: '', tone: 'formal' as const, customizations: { companySpecific: [], roleSpecific: [], skillHighlights: [] }, generatedAt: now, version: 1 }
        : undefined;

      // Fill out the application form
      await this.fillApplicationForm(page, profile, coverLetter);

      // Take a screenshot before submitting
      const screenshotPath = await this.screenshot('pre-submit');
      console.log(`Pre-submit screenshot: ${screenshotPath}`);

      // Submit the application
      const submitButton = LinkedInSelectors.easyApply.submitButton;
      if (!(await elementExists(page, submitButton, 3000))) {
        // Close modal
        if (await elementExists(page, LinkedInSelectors.easyApply.closeButton, 3000)) {
          await clickElement(page, LinkedInSelectors.easyApply.closeButton);
        }
        throw new BrowserError('Could not find submit button. Application form may require additional steps.');
      }

      await clickElement(page, submitButton);
      await humanDelay();

      // Check for success
      const success = await elementExists(
        page,
        LinkedInSelectors.confirmation.successMessage,
        10000
      );

      this.updateRateLimit(5); // Applications use more rate limit

      if (!success) {
        // Check for errors
        const hasErrors = await elementExists(
          page,
          LinkedInSelectors.easyApply.errorMessages,
          3000
        );

        if (hasErrors) {
          const errorText = await getTextContent(
            page,
            LinkedInSelectors.easyApply.errorMessages
          );
          throw new BrowserError(`Application failed: ${errorText}`);
        }

        throw new BrowserError('Application may not have been submitted. Please verify manually.');
      }

      // Return successful application
      const platformApplicationId = `linkedin-${job.externalId}-${Date.now()}`;

      return {
        id: applicationId,
        profileId: profile.id,
        jobId: job.id,
        status: 'submitted' as const,
        method: 'easy-apply' as const,
        coverLetter,
        submission,
        platform: 'linkedin' as const,
        platformApplicationId,
        responseReceived: false,
        createdAt: now,
        updatedAt: now,
        appliedAt: now,
      };
    } catch (error) {
      // Take error screenshot
      await this.screenshot('error').catch(() => {});

      // Return error application
      return {
        id: applicationId,
        profileId: profile.id,
        jobId: job.id,
        status: 'error' as const,
        method: 'easy-apply' as const,
        submission,
        platform: 'linkedin' as const,
        responseReceived: false,
        notes: `Application error: ${error instanceof Error ? error.message : String(error)}`,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  /**
   * Fill out the Easy Apply form
   */
  private async fillApplicationForm(
    page: Page,
    profile: UserProfile,
    coverLetter?: CoverLetter
  ): Promise<void> {
    const fields = LinkedInSelectors.easyApply.fields;

    // Contact information
    if (await elementExists(page, fields.phone, 2000)) {
      await fillField(page, fields.phone, profile.contact.phone ?? '');
    }

    // Upload resume if field exists
    if (await elementExists(page, fields.resume, 2000)) {
      if (profile.resumePath) {
        await uploadFile(page, fields.resume, profile.resumePath);
        await humanDelay();
      }
    }

    // Upload cover letter if provided
    if (coverLetter && await elementExists(page, fields.coverLetter, 2000)) {
      // We would need to save the cover letter to a file first
      // For now, skip if it's text-only
    }

    // Handle multi-step form
    let hasNextButton = await elementExists(page, LinkedInSelectors.easyApply.nextButton, 2000);
    let iterations = 0;
    const maxIterations = 10;

    while (hasNextButton && iterations < maxIterations) {
      iterations++;

      // Answer common questions on this page
      await this.answerCommonQuestions(page, profile);
      await humanDelay();

      // Click next
      await clickElement(page, LinkedInSelectors.easyApply.nextButton);
      await humanDelay();

      // Check for next button again
      hasNextButton = await elementExists(page, LinkedInSelectors.easyApply.nextButton, 2000);
    }

    // Check for review button
    if (await elementExists(page, LinkedInSelectors.easyApply.reviewButton, 2000)) {
      await clickElement(page, LinkedInSelectors.easyApply.reviewButton);
      await humanDelay();
    }

    // Uncheck follow company if present
    if (await elementExists(page, LinkedInSelectors.easyApply.followCompany, 2000)) {
      // Uncheck it (we want to apply, not necessarily follow)
      const checkbox = page.locator(LinkedInSelectors.easyApply.followCompany);
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        await checkbox.uncheck();
      }
    }
  }

  /**
   * Answer common application questions
   */
  private async answerCommonQuestions(page: Page, profile: UserProfile): Promise<void> {
    const questions = LinkedInSelectors.easyApply.questions;

    // Years of experience
    if (await elementExists(page, questions.yearsExperience, 1000)) {
      const years = this.calculateYearsExperience(profile);
      await fillField(page, questions.yearsExperience, String(years));
    }

    // Work authorization - select first option (Yes, if available)
    if (await elementExists(page, questions.workAuthorization, 1000)) {
      try {
        // Try to select the first option
        const select = await page.$(questions.workAuthorization);
        if (select) {
          const options = await select.$$('option');
          if (options.length > 0) {
            const firstValue = await options[0].getAttribute('value');
            if (firstValue) {
              await selectOption(page, questions.workAuthorization, [firstValue]);
            }
          }
        }
      } catch {
        // Skip if selection fails
      }
    }

    // Sponsorship - typically answer "No" for most cases
    // This should be configurable based on user preferences
    if (await elementExists(page, questions.sponsorship, 1000)) {
      // Find all radio buttons and select "No" if available
      const sponsorshipRadios = await page.$$(`${questions.sponsorship}`);
      for (const radio of sponsorshipRadios) {
        const value = await radio.getAttribute('value');
        if (value?.toLowerCase().includes('no')) {
          await radio.click();
          break;
        }
      }
    }
  }

  /**
   * Calculate years of experience from profile
   */
  private calculateYearsExperience(profile: UserProfile): number {
    if (profile.experience.length === 0) return 0;

    const earliest = profile.experience
      .map(exp => exp.startDate)
      .sort()[0];

    if (!earliest) return 0;

    const startYear = parseInt(earliest.split('-')[0], 10);
    const currentYear = new Date().getFullYear();

    return Math.max(0, currentYear - startYear);
  }

  /**
   * Extract requirements from job description
   */
  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const lines = description.split('\n');

    let inRequirementsSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (/requirements|qualifications|what you.?ll need/i.test(trimmed)) {
        inRequirementsSection = true;
        continue;
      }

      if (inRequirementsSection && trimmed.startsWith('•')) {
        requirements.push(trimmed.substring(1).trim());
      }

      if (/responsibilities|about the role|what you.?ll do/i.test(trimmed)) {
        inRequirementsSection = false;
      }
    }

    return requirements;
  }

  /**
   * Extract skills from job description
   */
  private extractSkills(description: string): string[] {
    const skillPatterns = [
      /javascript/gi, /typescript/gi, /python/gi, /java(?!script)/gi, /c\+\+/gi,
      /react/gi, /angular/gi, /vue/gi, /node\.?js/gi, /express/gi,
      /sql/gi, /mongodb/gi, /postgresql/gi, /mysql/gi, /redis/gi,
      /aws/gi, /azure/gi, /gcp/gi, /docker/gi, /kubernetes/gi,
      /git/gi, /ci\/cd/gi, /agile/gi, /scrum/gi,
    ];

    const skills = new Set<string>();

    for (const pattern of skillPatterns) {
      const matches = description.match(pattern);
      if (matches) {
        for (const match of matches) {
          skills.add(match);
        }
      }
    }

    return Array.from(skills);
  }

  /**
   * Get application status
   */
  async getApplicationStatus(_applicationId: string): Promise<JobApplication | null> {
    // LinkedIn doesn't provide easy programmatic access to application status
    // This would require navigating to the applied jobs page and checking
    // Return null to indicate status is not available
    return null;
  }
}

// Export singleton instance
export const linkedInAdapter = new LinkedInAdapter();
