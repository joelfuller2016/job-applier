/**
 * Job Hunter Orchestrator
 * Main orchestration layer that ties together all components
 */

import { Page } from 'playwright';
import { v4 as uuid } from 'uuid';
import { UserProfile } from '@job-applier/core';
import { getBrowserManager } from '@job-applier/browser-automation';
import { getConfigManager } from '@job-applier/config';
import { WebJobDiscovery } from './web-job-discovery.js';
import { AIPageAnalyzer } from './ai-page-analyzer.js';
import { CareerPageNavigator } from './career-page-navigator.js';
import { AIFormFiller } from './ai-form-filler.js';
import {
  DiscoveredJob,
  JobHuntConfig,
  JobHuntResult,
  ApplicationAttempt,
  Company,
} from './types.js';

export interface HuntCallbacks {
  onJobDiscovered?: (job: DiscoveredJob) => void;
  onJobMatched?: (job: DiscoveredJob, score: number) => void;
  onApplicationStart?: (job: DiscoveredJob) => void;
  onApplicationComplete?: (attempt: ApplicationAttempt) => void;
  onConfirmationRequired?: (job: DiscoveredJob) => Promise<boolean>;
  onError?: (error: Error, job?: DiscoveredJob) => void;
  onProgress?: (message: string) => void;
}

export class JobHunterOrchestrator {
  private discovery: WebJobDiscovery;
  private analyzer: AIPageAnalyzer;
  private navigator: CareerPageNavigator;
  private formFiller: AIFormFiller;
  private browserManager = getBrowserManager();

  constructor() {
    this.discovery = new WebJobDiscovery();
    this.analyzer = new AIPageAnalyzer();
    this.navigator = new CareerPageNavigator();
    this.formFiller = new AIFormFiller();
  }

  /**
   * Run a complete job hunt session
   */
  async hunt(
    userProfile: UserProfile,
    config: JobHuntConfig,
    callbacks: HuntCallbacks = {}
  ): Promise<JobHuntResult> {
    const result: JobHuntResult = {
      sessionId: uuid(),
      startedAt: new Date().toISOString(),
      config,
      jobsDiscovered: 0,
      jobsMatched: 0,
      applicationsAttempted: 0,
      applicationsSuccessful: 0,
      applicationsFailed: 0,
      applications: [],
    };

    this.log(callbacks, `Starting job hunt session: ${result.sessionId}`);
    this.log(callbacks, `Search query: "${config.searchQuery}"`);

    try {
      // Phase 1: Discover jobs
      this.log(callbacks, 'Phase 1: Discovering jobs...');
      const discoveredJobs = await this.discoverJobs(config, callbacks);
      result.jobsDiscovered = discoveredJobs.length;
      this.log(callbacks, `Found ${discoveredJobs.length} jobs`);

      if (discoveredJobs.length === 0) {
        this.log(callbacks, 'No jobs found matching criteria');
        result.completedAt = new Date().toISOString();
        return result;
      }

      // Phase 2: Match and score jobs
      this.log(callbacks, 'Phase 2: Analyzing job matches...');
      const matchedJobs = await this.matchJobs(discoveredJobs, userProfile, config, callbacks);
      result.jobsMatched = matchedJobs.length;
      this.log(callbacks, `${matchedJobs.length} jobs matched your profile`);

      if (matchedJobs.length === 0 || config.dryRun) {
        if (config.dryRun) {
          this.log(callbacks, 'Dry run mode - skipping applications');
        }
        result.completedAt = new Date().toISOString();
        return result;
      }

      // Phase 3: Apply to matched jobs
      if (config.autoApply !== false) {
        this.log(callbacks, 'Phase 3: Applying to jobs...');
        await this.browserManager.launch();

        try {
          for (const job of matchedJobs) {
            // Check confirmation
            if (config.requireConfirmation) {
              const confirmed = callbacks.onConfirmationRequired
                ? await callbacks.onConfirmationRequired(job)
                : true;

              if (!confirmed) {
                result.applications.push({
                  jobId: job.id,
                  companyName: job.company,
                  jobTitle: job.title,
                  url: job.url,
                  status: 'skipped',
                  message: 'Skipped by user',
                });
                continue;
              }
            }

            // Apply
            callbacks.onApplicationStart?.(job);
            const attempt = await this.applyToJob(job, userProfile, callbacks);
            result.applications.push(attempt);
            callbacks.onApplicationComplete?.(attempt);

            if (attempt.status === 'success') {
              result.applicationsSuccessful++;
            } else if (attempt.status === 'failed') {
              result.applicationsFailed++;
            }
            result.applicationsAttempted++;

            // Delay between applications
            await this.delay(3000, 5000);
          }
        } finally {
          await this.browserManager.close().catch((err: unknown) =>
            console.warn('[JobHunter] Failed to close browser:', err)
          );
        }
      }

      result.completedAt = new Date().toISOString();
      this.log(callbacks, `Hunt complete: ${result.applicationsSuccessful}/${result.applicationsAttempted} successful`);

    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      this.log(callbacks, `Hunt failed: ${error}`);
    }

    return result;
  }

  /**
   * Discover jobs from various sources
   */
  private async discoverJobs(
    config: JobHuntConfig,
    callbacks: HuntCallbacks
  ): Promise<DiscoveredJob[]> {
    const jobs: DiscoveredJob[] = [];

    // Search with Exa
    if (!config.sources || config.sources.includes('exa')) {
      this.log(callbacks, 'Searching Exa...');
      const exaJobs = await this.discovery.searchJobsWithExa(config);
      for (const job of exaJobs) {
        callbacks.onJobDiscovered?.(job);
        jobs.push(job);
      }
    }

    // Search specific company sites
    if (config.includeCompanies && config.includeCompanies.length > 0) {
      this.log(callbacks, `Searching ${config.includeCompanies.length} company sites...`);

      await this.browserManager.launch();
      const page = await this.browserManager.newPage();

      try {
        for (const companyName of config.includeCompanies) {
          try {
            this.log(callbacks, `Searching ${companyName}...`);

            // Find company careers page
            const careersUrl = await this.analyzer.findCareersPage(companyName);
            if (!careersUrl) {
              this.log(callbacks, `Could not find careers page for ${companyName}`);
              continue;
            }

            const company: Company = {
              name: companyName,
              careersUrl,
            };

            const companyJobs = await this.discovery.scrapeCompanyCareersPage(
              page,
              company,
              config.searchQuery
            );

            for (const job of companyJobs) {
              callbacks.onJobDiscovered?.(job);
              jobs.push(job);
            }
          } catch (error) {
            this.log(callbacks, `Failed to search ${companyName}: ${error}`);
          }
        }
      } finally {
        await page.close().catch((err: unknown) =>
          console.warn('[JobHunter] Failed to close page:', err)
        );
      }
    }

    return jobs;
  }

  /**
   * Match jobs against user profile
   */
  private async matchJobs(
    jobs: DiscoveredJob[],
    userProfile: UserProfile,
    config: JobHuntConfig,
    callbacks: HuntCallbacks
  ): Promise<DiscoveredJob[]> {
    const threshold = config.matchThreshold || 50;
    const matched: DiscoveredJob[] = [];

    for (const job of jobs) {
      try {
        // Skip if already has score above threshold
        if (job.matchScore && job.matchScore >= threshold) {
          matched.push(job);
          callbacks.onJobMatched?.(job, job.matchScore);
          continue;
        }

        // Get job details if description is short
        if (job.description.length < 200) {
          const page = await this.browserManager.newPage();
          try {
            await this.discovery.getJobDetails(page, job);
          } finally {
            await page.close().catch((err: unknown) =>
              console.warn('[JobHunter] Failed to close page:', err)
            );
          }
        }

        // Analyze match
        const analysis = await this.analyzer.analyzeJobMatch(
          job.description,
          {
            skills: userProfile.skills.map(s => s.name),
            experience: userProfile.experience.map(e => ({
              title: e.title,
              company: e.company,
              description: e.description,
            })),
            education: userProfile.education.map(e => ({
              degree: e.degree,
              field: e.field,
            })),
          }
        );

        job.matchScore = analysis.score;
        job.matchAnalysis = analysis.analysis;

        if (analysis.score >= threshold) {
          matched.push(job);
          callbacks.onJobMatched?.(job, analysis.score);
          this.log(callbacks, `Match: ${job.title} at ${job.company} (${analysis.score}%)`);
        } else {
          this.log(callbacks, `Skip: ${job.title} at ${job.company} (${analysis.score}% < ${threshold}%)`);
        }
      } catch (error) {
        this.log(callbacks, `Failed to match ${job.title}: ${error}`);
      }
    }

    // Sort by match score
    matched.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // Limit to maxJobs
    return matched.slice(0, config.maxJobs || 10);
  }

  /**
   * Apply to a single job
   */
  private async applyToJob(
    job: DiscoveredJob,
    userProfile: UserProfile,
    callbacks: HuntCallbacks
  ): Promise<ApplicationAttempt> {
    const attempt: ApplicationAttempt = {
      jobId: job.id,
      companyName: job.company,
      jobTitle: job.title,
      url: job.url,
      status: 'pending_confirmation',
    };

    const page = await this.browserManager.newPage();

    try {
      this.log(callbacks, `Applying to: ${job.title} at ${job.company}`);

      // Navigate to application page
      const navResult = await this.navigator.navigateToApplication(page, job);

      if (!navResult.success) {
        if (navResult.currentPage === 'login') {
          attempt.status = 'requires_manual';
          attempt.message = 'Login required';
        } else {
          attempt.status = 'failed';
          attempt.message = navResult.error || 'Navigation failed';
        }
        attempt.screenshotPath = await this.saveScreenshot(page, job.id);
        return attempt;
      }

      // Fill application form
      const jobContext = {
        title: job.title,
        company: job.company,
        description: job.description,
      };

      const formResult = await this.navigator.navigateMultiPageForm(
        page,
        async (analysis) => {
          const fillResult = await this.formFiller.fillForm(
            page,
            userProfile,
            jobContext,
            analysis
          );
          attempt.formFieldsFilled = (attempt.formFieldsFilled || 0) + fillResult.fieldsFilled;

          if (fillResult.errors.length > 0) {
            attempt.errors = [...(attempt.errors || []), ...fillResult.errors];
          }
        }
      );

      if (formResult.success) {
        attempt.status = 'success';
        attempt.appliedAt = new Date().toISOString();
        attempt.message = `Completed ${formResult.totalPages} form page(s)`;
      } else {
        attempt.status = 'failed';
        attempt.message = formResult.error;
      }

      attempt.screenshotPath = await this.saveScreenshot(page, job.id);

    } catch (error) {
      attempt.status = 'failed';
      attempt.message = error instanceof Error ? error.message : String(error);
      attempt.errors = [attempt.message];

      try {
        attempt.screenshotPath = await this.saveScreenshot(page, job.id);
      } catch {
        // Ignore screenshot error
      }

      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)), job);
    } finally {
      await page.close();
    }

    return attempt;
  }

  /**
   * Save screenshot for debugging
   */
  private async saveScreenshot(page: Page, jobId: string): Promise<string> {
    const config = getConfigManager();
    const screenshotsDir = config.ensureDataSubdir('screenshots');
    const path = `${screenshotsDir}/${jobId}-${Date.now()}.png`;

    await page.screenshot({ path, fullPage: false });
    return path;
  }

  /**
   * Log progress
   */
  private log(callbacks: HuntCallbacks, message: string): void {
    console.log(`[JobHunter] ${message}`);
    callbacks.onProgress?.(message);
  }

  /**
   * Random delay
   */
  private async delay(min: number, max: number): Promise<void> {
    const ms = min + Math.random() * (max - min);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Quick hunt - simplified single-company application
   */
  async quickApply(
    company: string,
    jobTitle: string,
    userProfile: UserProfile,
    callbacks: HuntCallbacks = {}
  ): Promise<ApplicationAttempt> {
    await this.browserManager.launch();

    try {
      // Find careers page
      this.log(callbacks, `Finding ${company} careers page...`);
      const careersUrl = await this.analyzer.findCareersPage(company);

      if (!careersUrl) {
        throw new Error(`Could not find careers page for ${company}`);
      }

      // Create job stub
      const job: DiscoveredJob = {
        id: `quick-${Date.now()}`,
        title: jobTitle,
        company,
        location: '',
        description: '',
        url: careersUrl,
        source: 'company_site',
        discoveredAt: new Date().toISOString(),
      };

      // Find specific job
      const page = await this.browserManager.newPage();
      try {
        await page.goto(careersUrl, { waitUntil: 'networkidle' });
        await this.delay(2000, 3000);

        // Search for the job
        const discoveredCompany: Company = { name: company, careersUrl };
        const jobs = await this.discovery.scrapeCompanyCareersPage(page, discoveredCompany, jobTitle);

        if (jobs.length > 0) {
          // Use first matching job
          Object.assign(job, jobs[0]);
        }
      } finally {
        await page.close().catch((err: unknown) =>
          console.warn('[JobHunter] Failed to close page:', err)
        );
      }

      // Apply
      callbacks.onApplicationStart?.(job);
      const attempt = await this.applyToJob(job, userProfile, callbacks);
      callbacks.onApplicationComplete?.(attempt);

      return attempt;

    } finally {
      await this.browserManager.close().catch((err: unknown) =>
        console.warn('[JobHunter] Failed to close browser:', err)
      );
    }
  }
}
