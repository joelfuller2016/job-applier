import {
  JobListing,
  UserProfile,
  JobApplication,
  JobMatch,
  CoverLetter,
  PlatformCredentials,
} from '@job-applier/core';
import { ProfileRepository, JobRepository } from '@job-applier/database';
import { ResumeParser } from '@job-applier/resume-parser';
import { JobDiscoveryEngine } from '@job-applier/job-discovery';
import { getBrowserManager } from '@job-applier/browser-automation';
import { getAdapter, platformRegistry, SupportedPlatform } from '@job-applier/platforms';
import { ApplicationTracker, ApplicationAnalytics } from '@job-applier/application-tracker';
import { JobMatcher } from './matcher.js';
import { CoverLetterGenerator, CoverLetterOptions } from './cover-letter.js';

/**
 * Application workflow options
 */
export interface WorkflowOptions {
  platforms?: SupportedPlatform[];
  maxJobsPerSession?: number;
  minMatchScore?: number;
  autoApply?: boolean;
  generateCoverLetters?: boolean;
  coverLetterOptions?: CoverLetterOptions;
  dryRun?: boolean;
}

/**
 * Workflow result
 */
export interface WorkflowResult {
  jobsDiscovered: number;
  jobsMatched: number;
  applicationsSubmitted: number;
  applicationsFailed: number;
  errors: string[];
  applications: JobApplication[];
}

/**
 * Main orchestration engine
 */
export class JobApplierEngine {
  private profileRepo: ProfileRepository;
  private jobRepo: JobRepository;
  private resumeParser: ResumeParser;
  private discoveryEngine: JobDiscoveryEngine;
  private matcher: JobMatcher;
  private coverLetterGenerator: CoverLetterGenerator;
  private tracker: ApplicationTracker;
  private analytics: ApplicationAnalytics;

  private currentProfile: UserProfile | null = null;
  private platformCredentials: Map<SupportedPlatform, PlatformCredentials> = new Map();

  constructor() {
    this.profileRepo = new ProfileRepository();
    this.jobRepo = new JobRepository();
    this.resumeParser = new ResumeParser();
    this.discoveryEngine = new JobDiscoveryEngine();
    this.matcher = new JobMatcher();
    this.coverLetterGenerator = new CoverLetterGenerator();
    this.tracker = new ApplicationTracker();
    this.analytics = new ApplicationAnalytics();
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    // Initialize browser
    await getBrowserManager();
    console.log('Engine initialized');
  }

  /**
   * Load or create user profile from resume
   */
  async loadProfile(resumePath: string): Promise<UserProfile> {
    // Check if profile exists for this resume
    const profiles = await this.profileRepo.findAll();
    const existingProfile = profiles.find(p => p.resumePath === resumePath);

    if (existingProfile) {
      this.currentProfile = existingProfile;
      console.log(`Loaded existing profile: ${existingProfile.firstName} ${existingProfile.lastName}`);
      return existingProfile;
    }

    // Parse resume and create new profile
    console.log('Parsing resume...');
    const parseResult = await this.resumeParser.parse(resumePath);
    const profile = {
      ...parseResult.profile,
      resumePath,
    };

    const createdProfile = this.profileRepo.create(profile);
    this.currentProfile = createdProfile;

    console.log(`Created new profile: ${createdProfile.firstName} ${createdProfile.lastName}`);
    return createdProfile;
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  /**
   * Set platform credentials
   */
  setPlatformCredentials(
    platform: SupportedPlatform,
    credentials: PlatformCredentials
  ): void {
    this.platformCredentials.set(platform, credentials);
  }

  /**
   * Login to a platform
   */
  async loginToPlatform(platform: SupportedPlatform): Promise<boolean> {
    const credentials = this.platformCredentials.get(platform);
    if (!credentials) {
      throw new Error(`No credentials set for ${platform}`);
    }

    const adapter = getAdapter(platform);
    console.log(`Logging in to ${platformRegistry[platform].name}...`);

    const success = await adapter.login(credentials);
    if (success) {
      console.log(`Successfully logged in to ${platformRegistry[platform].name}`);
    } else {
      console.error(`Failed to log in to ${platformRegistry[platform].name}`);
    }

    return success;
  }

  /**
   * Discover jobs matching the profile
   */
  async discoverJobs(
    searchQueries?: string[],
    options: { platforms?: SupportedPlatform[]; maxResults?: number } = {}
  ): Promise<JobListing[]> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded. Call loadProfile first.');
    }

    const platforms = options.platforms || ['linkedin', 'indeed'];
    const maxResults = options.maxResults || 50;
    const allJobs: any[] = [];

    // Build search queries if not provided
    const queries = searchQueries || this.buildSearchQueries(this.currentProfile);

    // Discover via Exa API
    console.log('Discovering jobs via web search...');
    try {
      const result = await this.discoveryEngine.discoverForProfile(this.currentProfile, {
        maxResults: Math.floor(maxResults / 2),
      });
      allJobs.push(...result.jobs);
      console.log(`Found ${result.jobs.length} jobs via web search`);
    } catch (error) {
      console.error('Web discovery failed:', error);
    }

    // Discover via platform adapters
    for (const platform of platforms) {
      const adapter = getAdapter(platform);

      // Check login status
      const isLoggedIn = await adapter.checkLoginStatus();
      if (!isLoggedIn) {
        console.log(`Not logged in to ${platform}, skipping platform search`);
        continue;
      }

      console.log(`Searching jobs on ${platform}...`);
      for (const query of queries.slice(0, 3)) {
        try {
          const platformJobs = await adapter.searchJobs({
            keywords: [query],
            limit: Math.floor(maxResults / platforms.length / queries.length),
          });
          allJobs.push(...platformJobs);
          console.log(`Found ${platformJobs.length} jobs on ${platform} for "${query}"`);
        } catch (error) {
          console.error(`Search failed on ${platform}:`, error);
        }
      }
    }

    // Save jobs to database
    for (const job of allJobs) {
      this.jobRepo.upsert(job);
    }

    console.log(`Total jobs discovered: ${allJobs.length}`);
    return allJobs;
  }

  /**
   * Build search queries from profile
   */
  private buildSearchQueries(profile: UserProfile): string[] {
    const queries: string[] = [];

    // Use target roles if specified
    if (profile.preferences?.targetRoles) {
      queries.push(...profile.preferences.targetRoles);
    }

    // Use current job titles
    for (const exp of profile.experience.slice(0, 2)) {
      if (!queries.includes(exp.title)) {
        queries.push(exp.title);
      }
    }

    // Use top skills
    const topSkills = profile.skills
      .sort((a, b) => (b.proficiency === 'expert' ? 1 : 0) - (a.proficiency === 'expert' ? 1 : 0))
      .slice(0, 3)
      .map(s => s.name);

    if (topSkills.length > 0) {
      queries.push(`${topSkills[0]} developer`);
    }

    return queries.slice(0, 5);
  }

  /**
   * Match jobs with profile
   */
  async matchJobs(
    jobs: JobListing[],
    minScore: number = 0.6
  ): Promise<JobMatch[]> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }

    console.log(`Matching ${jobs.length} jobs against profile...`);
    const matches = await this.matcher.getTopMatches(jobs, this.currentProfile, minScore);
    console.log(`Found ${matches.length} jobs with score >= ${minScore}`);

    return matches;
  }

  /**
   * Generate cover letter for a job
   */
  async generateCoverLetter(
    job: JobListing,
    options?: CoverLetterOptions
  ): Promise<CoverLetter> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }

    console.log(`Generating cover letter for ${job.title} at ${job.company.name}...`);
    return this.coverLetterGenerator.generate(job, this.currentProfile, options);
  }

  /**
   * Apply to a single job
   */
  async applyToJob(
    job: JobListing,
    options: {
      generateCoverLetter?: boolean;
      coverLetterOptions?: CoverLetterOptions;
      dryRun?: boolean;
    } = {}
  ): Promise<JobApplication> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }

    const platform = job.platform as SupportedPlatform;
    if (!platformRegistry[platform]) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Create application record
    const application = await this.tracker.createApplication(
      job,
      this.currentProfile.id
    );

    // Generate cover letter if requested
    let coverLetter: CoverLetter | undefined;
    if (options.generateCoverLetter) {
      coverLetter = await this.generateCoverLetter(job, options.coverLetterOptions);
    }

    // Dry run - don't actually apply
    if (options.dryRun) {
      console.log(`[DRY RUN] Would apply to: ${job.title} at ${job.company.name}`);
      return application;
    }

    // Get adapter and apply
    const adapter = getAdapter(platform);

    // Check login
    if (!adapter.isAuthenticated()) {
      const credentials = this.platformCredentials.get(platform);
      if (credentials) {
        await adapter.login(credentials);
      } else {
        await this.tracker.recordFailedAttempt(
          application.id,
          'Not logged in and no credentials available'
        );
        return application;
      }
    }

    console.log(`Applying to: ${job.title} at ${job.company.name}...`);

    // Create submission object
    const submission = {
      formFields: [],
      resumeUsed: this.currentProfile.resumePath || '',
      coverLetterUsed: coverLetter?.id,
      answers: {},
    };

    const result = await adapter.applyToJob(job, this.currentProfile, submission);

    console.log(`Application submitted with ID: ${result.id}`);

    return result;
  }

  /**
   * Run the full application workflow
   */
  async runWorkflow(options: WorkflowOptions = {}): Promise<WorkflowResult> {
    const {
      platforms = ['linkedin', 'indeed'],
      maxJobsPerSession = 10,
      minMatchScore = 0.6,
      autoApply = false,
      generateCoverLetters = true,
      coverLetterOptions,
      dryRun = false,
    } = options;

    const result: WorkflowResult = {
      jobsDiscovered: 0,
      jobsMatched: 0,
      applicationsSubmitted: 0,
      applicationsFailed: 0,
      errors: [],
      applications: [],
    };

    try {
      // Discover jobs
      const jobs = await this.discoverJobs(undefined, {
        platforms,
        maxResults: maxJobsPerSession * 3,
      });
      result.jobsDiscovered = jobs.length;

      if (jobs.length === 0) {
        console.log('No jobs found');
        return result;
      }

      // Match jobs
      const matches = await this.matchJobs(jobs, minMatchScore);
      result.jobsMatched = matches.length;

      if (matches.length === 0) {
        console.log('No matching jobs found');
        return result;
      }

      // Apply to top matches
      const topMatches = matches.slice(0, maxJobsPerSession);
      console.log(`Processing ${topMatches.length} top matches...`);

      for (const match of topMatches) {
        const job = jobs.find(j => j.id === match.jobId);
        if (!job) continue;

        // Skip if fit category is unlikely
        if (match.fitCategory === 'unlikely') {
          console.log(`Skipping ${job.title} (unlikely fit)`);
          continue;
        }

        try {
          const application = await this.applyToJob(job, {
            generateCoverLetter: generateCoverLetters,
            coverLetterOptions,
            dryRun: dryRun || !autoApply,
          });

          result.applications.push(application);

          if (application.status === 'submitted') {
            result.applicationsSubmitted++;
          } else if (application.status === 'draft') {
            result.applicationsFailed++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Failed to apply to ${job.title}: ${errorMsg}`);
          result.applicationsFailed++;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Workflow error: ${errorMsg}`);
    }

    return result;
  }

  /**
   * Get application statistics
   */
  async getStats() {
    return this.analytics.getStats();
  }

  /**
   * Get application timeline
   */
  async getTimeline(days: number = 30) {
    return this.analytics.getTimeline(days);
  }

  /**
   * Get platform metrics
   */
  async getPlatformMetrics() {
    return this.analytics.getPlatformMetrics();
  }

  /**
   * Shutdown the engine
   */
  async shutdown(): Promise<void> {
    const browserManager = await getBrowserManager();
    await browserManager.close();
    console.log('Engine shut down');
  }
}
