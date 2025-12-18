/**
 * Unified Storage Service
 *
 * Provides a single facade for all data storage operations in the application.
 * This service aggregates all repositories and provides convenient methods
 * for common cross-repository operations.
 */

import {
  initDatabase,
  closeDatabase,
  isDatabaseInitialized,
  checkDatabaseHealth,
  transaction,
  getDatabase,
  type DatabaseConfig,
} from './connection.js';

import { profileRepository, ProfileRepository } from './repositories/profile-repository.js';
import { jobRepository, JobRepository } from './repositories/job-repository.js';
import { applicationRepository, ApplicationRepository } from './repositories/application-repository.js';
import { matchRepository, MatchRepository } from './repositories/match-repository.js';
import { settingsRepository, SettingsRepository } from './repositories/settings-repository.js';
import { credentialsRepository, PlatformCredentialsRepository } from './repositories/credentials-repository.js';
import { eventsRepository, ApplicationEventsRepository } from './repositories/events-repository.js';
import { searchHistoryRepository, SearchHistoryRepository } from './repositories/search-history-repository.js';
import { statsRepository, DailyStatsRepository } from './repositories/stats-repository.js';
import { getMigrationStatus } from './migrations/index.js';

import {
  UserProfile,
  JobListing,
  JobApplication,
  JobMatch,
  JobPlatform,
  ApplicationStatus,
  toISOString,
} from '@job-applier/core';

/**
 * Storage service configuration
 */
export interface StorageServiceConfig extends DatabaseConfig {
  autoSave?: boolean;
  maxEventAge?: number; // Days to keep events
  maxSearchHistoryAge?: number; // Days to keep search history
}

/**
 * Storage statistics
 */
export interface StorageStats {
  profiles: number;
  jobs: number;
  applications: number;
  events: number;
  searches: number;
  credentials: number;
  settings: number;
  databaseSize?: number;
}

/**
 * Application summary for a profile
 */
export interface ApplicationSummary {
  profileId: string;
  totalApplications: number;
  byStatus: Record<ApplicationStatus, number>;
  responseRate: number;
  interviewRate: number;
  recentActivity: {
    lastApplication?: string;
    lastResponse?: string;
    lastInterview?: string;
  };
}

/**
 * Unified Storage Service
 */
export class StorageService {
  /** Configuration stored for reference and potential future use */
  public config: StorageServiceConfig | null = null;

  // Repository accessors
  readonly profiles: ProfileRepository = profileRepository;
  readonly jobs: JobRepository = jobRepository;
  readonly applications: ApplicationRepository = applicationRepository;
  readonly matches: MatchRepository = matchRepository;
  readonly settings: SettingsRepository = settingsRepository;
  readonly credentials: PlatformCredentialsRepository = credentialsRepository;
  readonly events: ApplicationEventsRepository = eventsRepository;
  readonly searchHistory: SearchHistoryRepository = searchHistoryRepository;
  readonly stats: DailyStatsRepository = statsRepository;

  /**
   * Initialize the storage service
   */
  async initialize(config: StorageServiceConfig): Promise<void> {
    this.config = config;
    await initDatabase(config);

    // Run cleanup if configured
    if (config.maxEventAge) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.maxEventAge);
      this.events.deleteOlderThan(toISOString(cutoffDate));
    }

    if (config.maxSearchHistoryAge) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.maxSearchHistoryAge);
      this.searchHistory.deleteOlderThan(toISOString(cutoffDate));
    }
  }

  /**
   * Close the storage service
   */
  close(): void {
    closeDatabase();
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return isDatabaseInitialized();
  }

  /**
   * Health check
   */
  healthCheck(): { healthy: boolean; error?: string } {
    return checkDatabaseHealth();
  }

  /**
   * Get migration status
   */
  getMigrationStatus() {
    return getMigrationStatus(getDatabase());
  }

  /**
   * Run operations in a transaction
   */
  transaction<T>(fn: () => T): T {
    return transaction(fn);
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    return {
      profiles: this.profiles.findAll().length,
      jobs: this.jobs.getRecent(10000).length, // Use getRecent as proxy for count
      applications: this.applications.getStats().total,
      events: this.events.getRecent(1000).length, // Approximate
      searches: this.searchHistory.findAll().length,
      credentials: this.credentials.findAll().length,
      settings: this.settings.getAll().length,
    };
  }

  /**
   * Get application summary for a profile
   */
  getApplicationSummary(profileId: string): ApplicationSummary {
    const applications = this.applications.findByProfile(profileId);

    const byStatus: Record<string, number> = {};
    let responseCount = 0;
    let interviewCount = 0;
    let lastApplication: string | undefined;
    let lastResponse: string | undefined;
    let lastInterview: string | undefined;

    for (const app of applications) {
      // Count by status
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;

      // Track response and interview counts
      if (app.responseReceived) {
        responseCount++;
        if (!lastResponse || (app.responseDate && app.responseDate > lastResponse)) {
          lastResponse = app.responseDate;
        }
      }

      if (app.status === 'interview') {
        interviewCount++;
        if (!lastInterview || (app.updatedAt && app.updatedAt > lastInterview)) {
          lastInterview = app.updatedAt;
        }
      }

      // Track last application
      if (app.appliedAt && (!lastApplication || app.appliedAt > lastApplication)) {
        lastApplication = app.appliedAt;
      }
    }

    const total = applications.length;

    return {
      profileId,
      totalApplications: total,
      byStatus: byStatus as Record<ApplicationStatus, number>,
      responseRate: total > 0 ? Math.round((responseCount / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((interviewCount / total) * 100) : 0,
      recentActivity: {
        lastApplication,
        lastResponse,
        lastInterview,
      },
    };
  }

  /**
   * Record a complete job application flow
   */
  recordApplication(
    profileId: string,
    job: JobListing,
    application: Omit<JobApplication, 'id' | 'jobId' | 'profileId' | 'createdAt' | 'updatedAt'>,
    match?: Omit<JobMatch, 'id' | 'analyzedAt'>
  ): { application: JobApplication; match?: JobMatch } {
    return this.transaction(() => {
      // Ensure job exists (upsert)
      this.jobs.upsert(job);

      // Create application
      const newApplication = this.applications.create({
        ...application,
        profileId,
        jobId: job.id,
      });

      // Create event
      this.events.create(
        newApplication.id,
        'created',
        `Application created for ${job.title} at ${job.company.name}`
      );

      // Update stats
      this.stats.incrementApplicationsSent();
      this.stats.incrementJobsDiscovered();

      // Create match if provided
      let savedMatch: JobMatch | undefined;
      if (match) {
        savedMatch = this.matches.save({
          ...match,
          jobId: job.id,
          profileId,
        });
      }

      return { application: newApplication, match: savedMatch };
    });
  }

  /**
   * Update application status with event logging
   */
  updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    reason?: string
  ): JobApplication | null {
    const application = this.applications.findById(applicationId);
    if (!application) {
      return null;
    }

    return this.transaction(() => {
      // Update status using the repository's updateStatus method (which logs its own status change)
      const updated = this.applications.updateStatus(applicationId, newStatus, reason);

      if (updated) {
        // Update stats based on new status
        if (newStatus === 'interview') {
          this.stats.incrementInterviewsScheduled();
        }
      }

      return updated;
    });
  }

  /**
   * Record a response to an application
   */
  recordResponse(
    applicationId: string,
    responseDetails: string,
    newStatus?: ApplicationStatus
  ): JobApplication | null {
    const application = this.applications.findById(applicationId);
    if (!application) {
      return null;
    }

    return this.transaction(() => {
      // Update status if provided
      if (newStatus) {
        this.applications.updateStatus(applicationId, newStatus, responseDetails);
      }

      // Log event
      this.events.create(
        applicationId,
        'response-received',
        responseDetails
      );

      // Update stats
      this.stats.incrementResponsesReceived();

      return this.applications.findById(applicationId);
    });
  }

  /**
   * Search for jobs across saved jobs with matching
   */
  searchJobsWithMatching(
    profileId: string,
    options: {
      platform?: JobPlatform;
      minMatchScore?: number;
      limit?: number;
    } = {}
  ): Array<{ job: JobListing; match?: JobMatch }> {
    // Get jobs using search
    const jobs = this.jobs.search({
      platforms: options.platform ? [options.platform] : undefined,
      limit: options.limit ?? 100,
    });

    const results: Array<{ job: JobListing; match?: JobMatch }> = [];

    for (const job of jobs) {
      const match = this.matches.findByJobAndProfile(job.id, profileId);

      if (options.minMatchScore && match && match.overallScore < options.minMatchScore) {
        continue;
      }

      results.push({ job, match: match ?? undefined });
    }

    // Sort by match score (highest first), jobs without matches last
    results.sort((a, b) => {
      if (!a.match && !b.match) return 0;
      if (!a.match) return 1;
      if (!b.match) return -1;
      return b.match.overallScore - a.match.overallScore;
    });

    if (options.limit) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get dashboard data
   */
  getDashboardData(profileId: string): {
    summary: ApplicationSummary;
    recentApplications: JobApplication[];
    recentJobs: JobListing[];
    weeklyStats: ReturnType<DailyStatsRepository['getWeeklySummary']>;
    monthlyStats: ReturnType<DailyStatsRepository['getMonthlySummary']>;
    topMatches: Array<{ job: JobListing; match: JobMatch }>;
  } {
    const summary = this.getApplicationSummary(profileId);
    const recentApplications = this.applications.findByProfile(profileId).slice(0, 10);
    const recentJobs = this.jobs.getRecent(10);
    const weeklyStats = this.stats.getWeeklySummary();
    const monthlyStats = this.stats.getMonthlySummary();

    // Get top matches
    const topMatchResults = this.matches.getTopMatches(profileId, 5, 70);

    const topMatches: Array<{ job: JobListing; match: JobMatch }> = [];
    for (const match of topMatchResults) {
      const job = this.jobs.findById(match.jobId);
      if (job) {
        topMatches.push({ job, match });
      }
    }

    return {
      summary,
      recentApplications,
      recentJobs,
      weeklyStats,
      monthlyStats,
      topMatches,
    };
  }

  /**
   * Export all data for backup
   */
  exportData(): {
    profiles: UserProfile[];
    jobs: JobListing[];
    applications: JobApplication[];
    settings: Array<{ key: string; value: string; updatedAt: string }>;
    searchHistory: ReturnType<SearchHistoryRepository['findAll']>;
    stats: ReturnType<DailyStatsRepository['findAll']>;
    exportedAt: string;
  } {
    return {
      profiles: this.profiles.findAll(),
      jobs: this.jobs.getRecent(10000), // Get all jobs
      applications: this.applications.findByStatus('draft')
        .concat(this.applications.findByStatus('submitted'))
        .concat(this.applications.findByStatus('in-review'))
        .concat(this.applications.findByStatus('interview'))
        .concat(this.applications.findByStatus('offer'))
        .concat(this.applications.findByStatus('rejected'))
        .concat(this.applications.findByStatus('withdrawn')),
      settings: this.settings.getAll(),
      searchHistory: this.searchHistory.findAll(),
      stats: this.stats.findAll(),
      exportedAt: toISOString(new Date()),
    };
  }

  /**
   * Clear all data (use with caution!)
   */
  clearAllData(): void {
    this.transaction(() => {
      // Clear in order respecting foreign keys
      this.events.deleteOlderThan('9999-12-31'); // Clear all events
      // Applications will cascade delete events
      this.settings.clear();
      this.credentials.clear();
      this.searchHistory.clear();
      this.stats.clear();
    });
  }
}

// Singleton instance
export const storageService = new StorageService();

// Default export
export default storageService;
