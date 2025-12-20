/**
 * @job-applier/database
 * SQLite database layer for JobAutoApply
 *
 * This package provides comprehensive data persistence for the job applier application.
 *
 * Quick Start:
 *   import { dataStorage } from '@job-applier/database';
 *
 *   // Initialize once at app startup
 *   await dataStorage.initialize({ path: './data/job-applier.db' });
 *
 *   // Access repositories
 *   dataStorage.profiles.create({ ... });
 *   dataStorage.jobs.search({ ... });
 *   dataStorage.settings.set('key', 'value');
 *
 * For direct repository access:
 *   import { profileRepository, jobRepository } from '@job-applier/database';
 */

// Unified storage service (recommended entry point)
export * from './data-storage.js';

// Database connection and utilities
export * from './connection.js';
export * from './schema.js';

// Core repositories
export * from './repositories/user-repository.js';
export * from './repositories/profile-repository.js';
export * from './repositories/job-repository.js';
export * from './repositories/application-repository.js';
export * from './repositories/match-repository.js';

// New repositories
export * from './repositories/settings-repository.js';
export * from './repositories/search-history-repository.js';
export * from './repositories/stats-repository.js';
export * from './repositories/credentials-repository.js';

// Migrations
export * from './migrations/index.js';
