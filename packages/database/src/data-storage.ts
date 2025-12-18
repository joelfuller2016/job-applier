/**
 * DataStorage - Unified Storage Service
 *
 * Provides a single entry point for all data persistence operations in the job applier.
 * This service acts as a facade over the various repositories and database operations,
 * making it easy to access all storage functionality from one place.
 *
 * Usage:
 *   import { dataStorage } from '@job-applier/database';
 *
 *   // Initialize once at app startup
 *   await dataStorage.initialize({ path: './data/job-applier.db' });
 *
 *   // Then use throughout the app
 *   const profile = dataStorage.profiles.create({ ... });
 *   const jobs = dataStorage.jobs.search({ keywords: ['typescript'] });
 *   dataStorage.settings.set('theme', 'dark');
 */

import {
  initDatabase,
  closeDatabase,
  saveDatabase,
  isDatabaseInitialized,
  checkDatabaseHealth,
  transaction,
  get,
  getDatabase,
  DatabaseConfig,
} from './connection.js';
import { ProfileRepository, profileRepository } from './repositories/profile-repository.js';
import { JobRepository, jobRepository } from './repositories/job-repository.js';
import { ApplicationRepository, applicationRepository } from './repositories/application-repository.js';
import { MatchRepository, matchRepository } from './repositories/match-repository.js';
import { SettingsRepository, settingsRepository } from './repositories/settings-repository.js';
import { SearchHistoryRepository, searchHistoryRepository } from './repositories/search-history-repository.js';
import { StatsRepository, statsRepository } from './repositories/stats-repository.js';
import { CredentialsRepository, credentialsRepository } from './repositories/credentials-repository.js';
import { getMigrationStatus } from './migrations/index.js';
import { DatabaseError } from '@job-applier/core';

/**
 * Storage statistics
 */
export interface StorageStats {
  profileCount: number;
  jobCount: number;
  applicationCount: number;
  matchCount: number;
  settingsCount: number;
  searchHistoryCount: number;
  credentialsCount: number;
  databaseSize?: number;
}

/**
 * Storage health status
 */
export interface StorageHealth {
  initialized: boolean;
  healthy: boolean;
  migrationVersion: number;
  pendingMigrations: number;
  error?: string;
}

/**
 * Unified Data Storage Service
 *
 * Provides access to all storage repositories and utility methods.
 */
class DataStorage {
  private _initialized = false;

  /**
   * User profile storage
   */
  get profiles(): ProfileRepository {
    this.ensureInitialized();
    return profileRepository;
  }

  /**
   * Job listings storage
   */
  get jobs(): JobRepository {
    this.ensureInitialized();
    return jobRepository;
  }

  /**
   * Job applications storage
   */
  get applications(): ApplicationRepository {
    this.ensureInitialized();
    return applicationRepository;
  }

  /**
   * Job matches storage
   */
  get matches(): MatchRepository {
    this.ensureInitialized();
    return matchRepository;
  }

  /**
   * Key-value settings storage
   */
  get settings(): SettingsRepository {
    this.ensureInitialized();
    return settingsRepository;
  }

  /**
   * Search history logging
   */
  get searchHistory(): SearchHistoryRepository {
    this.ensureInitialized();
    return searchHistoryRepository;
  }

  /**
   * Daily statistics
   */
  get stats(): StatsRepository {
    this.ensureInitialized();
    return statsRepository;
  }

  /**
   * Platform credentials storage
   */
  get credentials(): CredentialsRepository {
    this.ensureInitialized();
    return credentialsRepository;
  }

  /**
   * Initialize the storage system
   *
   * Must be called before accessing any repositories.
   *
   * @param config Database configuration
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(config: DatabaseConfig): Promise<void> {
    if (this._initialized) {
      return;
    }

    await initDatabase(config);
    this._initialized = true;
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return this._initialized && isDatabaseInitialized();
  }

  /**
   * Get storage health status
   */
  getHealth(): StorageHealth {
    const dbHealth = checkDatabaseHealth();

    if (!this._initialized || !dbHealth.healthy) {
      return {
        initialized: this._initialized,
        healthy: false,
        migrationVersion: 0,
        pendingMigrations: 0,
        error: dbHealth.error ?? 'Storage not initialized',
      };
    }

    try {
      const db = getDatabase();
      const migrationStatus = getMigrationStatus(db);

      return {
        initialized: true,
        healthy: true,
        migrationVersion: migrationStatus.currentVersion,
        pendingMigrations: migrationStatus.pendingCount,
      };
    } catch (error) {
      return {
        initialized: this._initialized,
        healthy: false,
        migrationVersion: 0,
        pendingMigrations: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    this.ensureInitialized();

    const profileCount = get<{ count: number }>('SELECT COUNT(*) as count FROM profiles')?.count ?? 0;
    const jobCount = get<{ count: number }>('SELECT COUNT(*) as count FROM jobs')?.count ?? 0;
    const applicationCount = get<{ count: number }>('SELECT COUNT(*) as count FROM applications')?.count ?? 0;
    const matchCount = get<{ count: number }>('SELECT COUNT(*) as count FROM job_matches')?.count ?? 0;
    const settingsCount = get<{ count: number }>('SELECT COUNT(*) as count FROM settings')?.count ?? 0;
    const searchHistoryCount = get<{ count: number }>('SELECT COUNT(*) as count FROM search_history')?.count ?? 0;
    const credentialsCount = get<{ count: number }>('SELECT COUNT(*) as count FROM platform_credentials')?.count ?? 0;

    return {
      profileCount,
      jobCount,
      applicationCount,
      matchCount,
      settingsCount,
      searchHistoryCount,
      credentialsCount,
    };
  }

  /**
   * Execute multiple operations in a transaction
   *
   * All operations within the callback will be atomic - either all succeed or all fail.
   *
   * @param fn Function containing the operations to execute
   * @returns The result of the function
   */
  transaction<T>(fn: () => T): T {
    this.ensureInitialized();
    return transaction(fn);
  }

  /**
   * Force save database to disk
   *
   * Normally saves happen automatically, but this can be called
   * to ensure data is persisted immediately.
   */
  save(): void {
    this.ensureInitialized();
    saveDatabase();
  }

  /**
   * Close the database connection
   *
   * Should be called when shutting down the application.
   */
  close(): void {
    if (this._initialized) {
      closeDatabase();
      this._initialized = false;
    }
  }

  /**
   * Clean up old data to free space
   *
   * @param options Cleanup options
   * @returns Summary of deleted records
   */
  cleanup(options: {
    searchHistoryDays?: number;
    matchesDays?: number;
    statsDays?: number;
  } = {}): {
    searchHistoryDeleted: number;
    matchesDeleted: number;
    statsDeleted: number;
  } {
    this.ensureInitialized();

    const {
      searchHistoryDays = 90,
      matchesDays = 60,
      statsDays = 365,
    } = options;

    return {
      searchHistoryDeleted: this.searchHistory.deleteOlderThan(searchHistoryDays),
      matchesDeleted: this.matches.deleteOlderThan(matchesDays),
      statsDeleted: this.stats.deleteOlderThan(statsDays),
    };
  }

  /**
   * Export all data as JSON
   *
   * Useful for backups or data migration.
   *
   * @returns JSON string containing all data
   */
  exportData(): string {
    this.ensureInitialized();

    const data = {
      exportedAt: new Date().toISOString(),
      profiles: this.profiles.findAll(),
      jobs: this.jobs.getRecent(10000),
      applications: this.applications.getStats(),
      settings: this.settings.getAll(),
      searchHistory: this.searchHistory.getRecent(1000),
      stats: this.stats.getLastDays(365),
      // Note: credentials are not exported for security
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Quick access to commonly used operations
   */

  /**
   * Get today's application statistics
   */
  getTodayStats() {
    this.ensureInitialized();
    return this.stats.getToday();
  }

  /**
   * Get the default/primary user profile
   */
  getDefaultProfile() {
    this.ensureInitialized();
    return this.profiles.getDefault();
  }

  /**
   * Check if a user has already applied to a job
   */
  hasAppliedToJob(profileId: string, jobId: string): boolean {
    this.ensureInitialized();
    return this.applications.hasApplied(profileId, jobId);
  }

  /**
   * Get top job matches for a profile
   */
  getTopMatches(profileId: string, limit = 10) {
    this.ensureInitialized();
    return this.matches.getTopMatches(profileId, limit);
  }

  /**
   * Log a job search
   */
  logSearch(query: string, resultsCount: number, platforms: string[]) {
    this.ensureInitialized();
    return this.searchHistory.log(query, resultsCount, platforms);
  }

  /**
   * Increment today's applications count
   */
  recordApplicationSent() {
    this.ensureInitialized();
    return this.stats.incrementApplicationsSent();
  }

  /**
   * Increment today's discovered jobs count
   */
  recordJobsDiscovered(count = 1) {
    this.ensureInitialized();
    return this.stats.incrementJobsDiscovered(count);
  }

  /**
   * Ensure storage is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this._initialized) {
      throw new DatabaseError(
        'DataStorage not initialized. Call dataStorage.initialize() first.'
      );
    }
  }
}

// Singleton instance
export const dataStorage = new DataStorage();

// Also export the class for testing
export { DataStorage };
