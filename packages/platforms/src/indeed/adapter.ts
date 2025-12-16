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
import { BasePlatformAdapter, ApplicationResult } from '../base.js';
import { IndeedSelectors, IndeedUrls } from './selectors.js';

/**
 * Indeed platform adapter
 */
export class IndeedAdapter extends BasePlatformAdapter {
  readonly platform = 'indeed' as const;
  readonly name = 'Indeed';
  readonly baseUrl = IndeedUrls.base;

  /**
   * Check if currently logged in
   */
  async checkLoginStatus(): Promise<boolean> {
    const page = await this.getPage();

    try {
      // Navigate to main page if not there
      const currentUrl = page.url();
      if (!currentUrl.includes('indeed.com')) {
        await navigateTo(page, this.baseUrl);
        await humanDelay();
      }

      // Check for profile icon which appears when logged in
      const isLoggedIn = await elementExists(
        page,
        IndeedSelectors.navigation.profileIcon,
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
   * Log in to Indeed
   */
  async login(credentials: PlatformCredentials): Promise<boolean> {
    const page = await this.getPage();

    try {
      // Validate credentials
      if (!credentials.email || !credentials.password) {
        throw new BrowserError('Email and password are required for Indeed login');
      }

      // Navigate to login page
      await navigateTo(page, IndeedUrls.login);
      await humanDelay();

      // Check for CAPTCHA
      const hasCaptcha = await elementExists(page, IndeedSelectors.login.captchaFrame, 2000);
      if (hasCaptcha) {
        throw new BrowserError('CAPTCHA detected. Please complete manual login.');
      }

      // Fill in email
      await fillField(page, IndeedSelectors.login.emailInput, credentials.email);
      await humanDelay();

      // Click continue/submit to go to password page
      await clickElement(page, IndeedSelectors.login.submitButton);
      await humanDelay();

      // Wait for password field
      await waitForElement(page, IndeedSelectors.login.passwordInput, { timeout: 10000 });

      // Fill in password
      await fillField(page, IndeedSelectors.login.passwordInput, credentials.password);
      await humanDelay();

      // Submit login form
      await clickElement(page, IndeedSelectors.login.submitButton);

      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });

      // Check for login errors
      const hasError = await elementExists(page, IndeedSelectors.login.errorMessage, 3000);
      if (hasError) {
        const errorMessage = await getTextContent(page, IndeedSelectors.login.errorMessage);
        throw new BrowserError(`Login failed: ${errorMessage}`);
      }

      // Check for CAPTCHA after submit
      const hasCaptchaAfter = await elementExists(page, IndeedSelectors.login.captchaFrame, 2000);
      if (hasCaptchaAfter) {
        throw new BrowserError('CAPTCHA required after login. Please complete manually.');
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
        `Indeed login failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search for jobs on Indeed
   */
  async searchJobs(query: JobSearchQuery): Promise<JobListing[]> {
    if (this.isRateLimited()) {
      throw new BrowserError('Rate limited. Please try again later.');
    }

    const page = await this.getPage();
    const jobs: JobListing[] = [];

    try {
      // Build search URL
      const searchUrl = new URL(IndeedUrls.jobSearch);
      searchUrl.searchParams.set('q', query.keywords.join(' '));

      if (query.location) {
        searchUrl.searchParams.set('l', query.location);
      }
      if (query.remote) {
        searchUrl.searchParams.set('sc', '0kf:attr(DSQF7)'); // Remote filter
      }
      if (query.salary) {
        searchUrl.searchParams.set('salary', String(query.salary.min || ''));
      }
      if (query.employmentType) {
        // Map employment type to Indeed format
        const typeMap: Record<string, string> = {
          'full-time': 'fulltime',
          'part-time': 'parttime',
          'contract': 'contract',
          'temporary': 'temporary',
          'internship': 'internship',
        };
        searchUrl.searchParams.set('jt', typeMap[query.employmentType] || query.employmentType);
      }
      if (query.postedWithin) {
        // Map posted within to Indeed format (days)
        const ageMap: Record<string, string> = {
          '24h': '1',
          '7d': '7',
          '14d': '14',
          '30d': '30',
        };
        searchUrl.searchParams.set('fromage', ageMap[query.postedWithin] || '30');
      }

      await navigateTo(page, searchUrl.toString());
      await humanDelay();

      // Wait for job cards to load
      await waitForElement(page, IndeedSelectors.search.jobCards, { timeout: 10000 });

      // Get all job cards
      const jobCards = await page.$$(IndeedSelectors.search.jobCards);
      const maxResults = query.limit || 25;

      for (const card of jobCards.slice(0, maxResults)) {
        try {
          // Click on job card to load details in right panel
          await card.click();
          await humanDelay();

          // Extract job details
          const title = await card.$eval(
            IndeedSelectors.search.jobTitle,
            el => el.textContent?.trim() ?? ''
          ).catch(() => '');

          const company = await card.$eval(
            IndeedSelectors.search.companyName,
            el => el.textContent?.trim() ?? ''
          ).catch(() => '');

          const location = await card.$eval(
            IndeedSelectors.search.location,
            el => el.textContent?.trim() ?? ''
          ).catch(() => '');

          // Extract job link
          const jobLink = await card.$eval(
            IndeedSelectors.search.jobTitle,
            el => (el as HTMLAnchorElement).href
          ).catch(() => '');

          // Extract job ID from URL or data attribute
          let externalId = '';
          const jkMatch = jobLink.match(/jk=([a-f0-9]+)/i);
          if (jkMatch) {
            externalId = jkMatch[1];
          } else {
            externalId = await card.getAttribute('data-jk') || generateId();
          }

          // Check for Indeed Apply badge
          const hasIndeedApply = await card.$(IndeedSelectors.search.easyApplyBadge) !== null;

          // Get salary if available
          let salary;
          try {
            const salaryText = await card.$eval(
              IndeedSelectors.search.salary,
              el => el.textContent?.trim() ?? ''
            );
            if (salaryText) {
              // Parse salary text into SalaryInfo object
              // Example: "$50,000 - $80,000 a year" or "$25 - $35 an hour"
              salary = this.parseSalary(salaryText);
            }
          } catch {
            // Salary might not be listed
          }

          // Get full description from details panel
          let description = '';
          try {
            await waitForElement(page, IndeedSelectors.jobDetails.description, { timeout: 5000 });
            description = await getTextContent(page, IndeedSelectors.jobDetails.description);
          } catch {
            // Description might not load immediately
          }

          const job: JobListing = {
            id: generateId(),
            externalId,
            platform: 'indeed',
            title,
            company: { name: company },
            location,
            description,
            requirements: [],
            requiredSkills: [],
            url: jobLink || `${IndeedUrls.viewJob}?jk=${externalId}`,
            easyApply: hasIndeedApply,
            salary: salary || undefined,
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
      const jobUrl = `${IndeedUrls.viewJob}?jk=${jobId}`;
      await navigateTo(page, jobUrl);
      await humanDelay();

      // Wait for job details to load
      await waitForElement(page, IndeedSelectors.jobDetails.container, { timeout: 10000 });

      const title = await getTextContent(page, IndeedSelectors.jobDetails.title);
      const company = await getTextContent(page, IndeedSelectors.jobDetails.company);
      const location = await getTextContent(page, IndeedSelectors.jobDetails.location);
      const description = await getTextContent(page, IndeedSelectors.jobDetails.description);

      // Check for Indeed Apply button
      const hasIndeedApply = await elementExists(
        page,
        IndeedSelectors.jobDetails.applyButton,
        3000
      );

      // Get salary if available
      let salary;
      try {
        const salaryText = await getTextContent(page, IndeedSelectors.jobDetails.salary);
        if (salaryText) {
          salary = this.parseSalary(salaryText);
        }
      } catch {
        // Salary might not be listed
      }

      this.updateRateLimit(1);

      return {
        id: generateId(),
        externalId: jobId,
        platform: 'indeed',
        title,
        company: { name: company },
        location,
        description,
        requirements: this.extractRequirements(description),
        requiredSkills: this.extractSkills(description),
        url: `${IndeedUrls.viewJob}?jk=${jobId}`,
        easyApply: hasIndeedApply,
        salary: salary || undefined,
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
   * Apply to a job using Indeed Apply
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

      // Check for Indeed Apply button
      const hasIndeedApply = await elementExists(
        page,
        IndeedSelectors.jobDetails.applyButton,
        5000
      );

      if (!hasIndeedApply) {
        // Check for external apply button
        const hasExternalApply = await elementExists(
          page,
          IndeedSelectors.jobDetails.externalApplyButton,
          3000
        );

        if (hasExternalApply) {
          throw new BrowserError('This job requires external application. Indeed Apply not available.');
        }

        throw new BrowserError('Apply button not found.');
      }

      // Click Indeed Apply button
      await clickElement(page, IndeedSelectors.jobDetails.applyButton);
      await humanDelay();

      // Wait for modal or new page
      const modalAppeared = await elementExists(
        page,
        IndeedSelectors.indeedApply.modal,
        10000
      );

      if (!modalAppeared) {
        // Might be a new tab/page
        const pages = page.context().pages();
        if (pages.length > 1) {
          // Switch to new page
          const newPage = pages[pages.length - 1];
          await newPage.waitForLoadState('domcontentloaded');
          // Extract cover letter from submission if provided
          const coverLetter = submission.coverLetterUsed
            ? { id: submission.coverLetterUsed, content: '', tone: 'formal' as const, customizations: { companySpecific: [], roleSpecific: [], skillHighlights: [] }, generatedAt: now, version: 1 }
            : undefined;
          await this.fillApplicationForm(newPage, profile, coverLetter);
          const result = await this.submitApplication(newPage, job.externalId);

          // Convert ApplicationResult to JobApplication
          return {
            id: applicationId,
            profileId: profile.id,
            jobId: job.id,
            status: result.success ? 'submitted' as const : 'error' as const,
            method: 'easy-apply' as const,
            coverLetter,
            submission,
            platform: 'indeed' as const,
            platformApplicationId: result.applicationId,
            responseReceived: false,
            notes: result.message,
            createdAt: now,
            updatedAt: now,
            appliedAt: result.success ? now : undefined,
          };
        }

        throw new BrowserError('Application form did not appear.');
      }

      // Extract cover letter from submission if provided
      const coverLetter = submission.coverLetterUsed
        ? { id: submission.coverLetterUsed, content: '', tone: 'formal' as const, customizations: { companySpecific: [], roleSpecific: [], skillHighlights: [] }, generatedAt: now, version: 1 }
        : undefined;

      // Fill out the application form
      await this.fillApplicationForm(page, profile, coverLetter);

      // Submit the application
      const result = await this.submitApplication(page, job.externalId);

      // Convert ApplicationResult to JobApplication
      return {
        id: applicationId,
        profileId: profile.id,
        jobId: job.id,
        status: result.success ? 'submitted' as const : 'error' as const,
        method: 'easy-apply' as const,
        coverLetter,
        submission,
        platform: 'indeed' as const,
        platformApplicationId: result.applicationId,
        responseReceived: false,
        notes: result.message,
        createdAt: now,
        updatedAt: now,
        appliedAt: result.success ? now : undefined,
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
        platform: 'indeed' as const,
        responseReceived: false,
        notes: `Application error: ${error instanceof Error ? error.message : String(error)}`,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  /**
   * Fill out the Indeed Apply form
   */
  private async fillApplicationForm(
    page: Page,
    profile: UserProfile,
    coverLetter?: CoverLetter
  ): Promise<void> {
    const fields = IndeedSelectors.indeedApply.fields;

    // Contact information
    if (await elementExists(page, fields.firstName, 2000)) {
      await fillField(page, fields.firstName, profile.firstName);
    }

    if (await elementExists(page, fields.lastName, 1000)) {
      await fillField(page, fields.lastName, profile.lastName);
    }

    if (await elementExists(page, fields.email, 1000)) {
      await fillField(page, fields.email, profile.contact.email);
    }

    if (await elementExists(page, fields.phone, 1000)) {
      await fillField(page, fields.phone, profile.contact.phone ?? '');
    }

    // Upload resume if field exists
    if (await elementExists(page, fields.resume, 2000)) {
      if (profile.resumePath) {
        await uploadFile(page, fields.resume, profile.resumePath);
        await humanDelay();
      }
    }

    // Add cover letter if provided and field exists
    if (coverLetter && await elementExists(page, fields.coverLetter, 2000)) {
      await fillField(page, fields.coverLetter, coverLetter.content);
    }

    // Handle multi-step form
    let hasContinueButton = await elementExists(
      page,
      IndeedSelectors.indeedApply.continueButton,
      2000
    );
    let iterations = 0;
    const maxIterations = 10;

    while (hasContinueButton && iterations < maxIterations) {
      iterations++;

      // Answer common questions on this page
      await this.answerCommonQuestions(page, profile);
      await humanDelay();

      // Click continue
      await clickElement(page, IndeedSelectors.indeedApply.continueButton);
      await humanDelay();

      // Check for continue button again
      hasContinueButton = await elementExists(
        page,
        IndeedSelectors.indeedApply.continueButton,
        2000
      );
    }
  }

  /**
   * Submit the application and check result
   */
  private async submitApplication(page: Page, externalId: string): Promise<ApplicationResult> {
    // Take a screenshot before submitting
    const screenshotPath = await this.screenshot('pre-submit');
    console.log(`Pre-submit screenshot: ${screenshotPath}`);

    const submitButton = IndeedSelectors.indeedApply.submitButton;
    if (await elementExists(page, submitButton, 3000)) {
      await clickElement(page, submitButton);
      await humanDelay();

      // Check for success
      const success = await elementExists(
        page,
        IndeedSelectors.confirmation.successMessage,
        10000
      );

      this.updateRateLimit(5); // Applications use more rate limit

      if (success) {
        return {
          success: true,
          applicationId: `indeed-${externalId}-${Date.now()}`,
          message: 'Application submitted successfully.',
        };
      } else {
        // Check for errors
        const hasErrors = await elementExists(
          page,
          IndeedSelectors.indeedApply.errorMessages,
          3000
        );

        if (hasErrors) {
          const errorText = await getTextContent(
            page,
            IndeedSelectors.indeedApply.errorMessages
          );
          return {
            success: false,
            message: `Application failed: ${errorText}`,
          };
        }

        return {
          success: false,
          message: 'Application may not have been submitted. Please verify manually.',
        };
      }
    } else {
      // Close modal if possible
      if (await elementExists(page, IndeedSelectors.indeedApply.closeButton, 3000)) {
        await clickElement(page, IndeedSelectors.indeedApply.closeButton);
      }

      return {
        success: false,
        message: 'Could not find submit button. Application form may require additional steps.',
      };
    }
  }

  /**
   * Answer common application questions
   */
  private async answerCommonQuestions(page: Page, profile: UserProfile): Promise<void> {
    const questions = IndeedSelectors.indeedApply.questions;

    // Years of experience
    if (await elementExists(page, questions.yearsExperience, 1000)) {
      const years = this.calculateYearsExperience(profile);
      try {
        // Try as input first
        await fillField(page, questions.yearsExperience, String(years));
      } catch {
        // Try as select
        try {
          await selectOption(page, questions.yearsExperience, [String(years)]);
        } catch {
          // Skip if not available
        }
      }
    }

    // Work authorization
    if (await elementExists(page, questions.workAuthorization, 1000)) {
      try {
        // Try to select the first option (usually "Yes")
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
        // Try clicking Yes radio button
        const yesOption = await page.$('input[type="radio"][value*="yes"]');
        if (yesOption) await yesOption.click();
      }
    }

    // Sponsorship - typically answer "No"
    if (await elementExists(page, questions.sponsorship, 1000)) {
      const noOption = await page.$('input[type="radio"][value*="no"]');
      if (noOption) await noOption.click();
    }

    // Education level
    if (await elementExists(page, questions.education, 1000)) {
      const educationLevel = this.getHighestEducation(profile);
      try {
        // Try to find and select option by label
        const select = await page.$(questions.education);
        if (select) {
          const options = await select.$$('option');
          for (const option of options) {
            const label = await option.textContent();
            if (label && label.toLowerCase().includes(educationLevel.toLowerCase())) {
              const value = await option.getAttribute('value');
              if (value) {
                await selectOption(page, questions.education, [value]);
                break;
              }
            }
          }
        }
      } catch {
        // Skip if not matching
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
   * Get highest education level from profile
   */
  private getHighestEducation(profile: UserProfile): string {
    const educationOrder = [
      'High School',
      'Associate',
      'Bachelor',
      'Master',
      'Doctorate',
      'PhD',
    ];

    let highest = 'High School';
    let highestIndex = 0;

    for (const edu of profile.education) {
      const degree = edu.degree.toLowerCase();
      for (let i = 0; i < educationOrder.length; i++) {
        if (degree.includes(educationOrder[i].toLowerCase()) && i > highestIndex) {
          highest = educationOrder[i];
          highestIndex = i;
        }
      }
    }

    return highest;
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

      if (/requirements|qualifications|what you.?ll need|must have/i.test(trimmed)) {
        inRequirementsSection = true;
        continue;
      }

      if (inRequirementsSection && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
        requirements.push(trimmed.substring(1).trim());
      }

      if (/responsibilities|about the role|what you.?ll do|nice to have/i.test(trimmed)) {
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
      /c#/gi, /ruby/gi, /go(?:lang)?/gi, /rust/gi, /php/gi, /swift/gi, /kotlin/gi,
      /react/gi, /angular/gi, /vue/gi, /node\.?js/gi, /express/gi, /django/gi,
      /flask/gi, /spring/gi, /\.net/gi, /rails/gi,
      /sql/gi, /mongodb/gi, /postgresql/gi, /mysql/gi, /redis/gi, /elasticsearch/gi,
      /aws/gi, /azure/gi, /gcp/gi, /docker/gi, /kubernetes/gi, /terraform/gi,
      /git/gi, /ci\/cd/gi, /jenkins/gi, /github actions/gi,
      /agile/gi, /scrum/gi, /jira/gi,
      /machine learning/gi, /deep learning/gi, /tensorflow/gi, /pytorch/gi,
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
    // Indeed doesn't provide easy programmatic access to application status
    // This would require navigating to the applied jobs page and checking
    // Return null to indicate status is not available
    return null;
  }

  /**
   * Parse salary text into SalaryInfo object
   */
  private parseSalary(salaryText: string) {
    // Remove common words and normalize
    const text = salaryText.toLowerCase().replace(/[,$]/g, '');

    // Determine period
    let period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'yearly';
    if (text.includes('hour')) period = 'hourly';
    else if (text.includes('day')) period = 'daily';
    else if (text.includes('week')) period = 'weekly';
    else if (text.includes('month')) period = 'monthly';
    else if (text.includes('year')) period = 'yearly';

    // Extract numbers
    const numbers = text.match(/\d+\.?\d*/g);
    if (!numbers || numbers.length === 0) {
      return undefined;
    }

    const min = parseFloat(numbers[0]);
    const max = numbers.length > 1 ? parseFloat(numbers[1]) : undefined;

    return {
      min,
      max,
      currency: 'USD',
      period,
      isEstimate: true,
    };
  }
}

// Export singleton instance
export const indeedAdapter = new IndeedAdapter();
