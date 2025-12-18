/**
 * @job-applier/database
 * SQLite database layer for JobAutoApply
 *
 * This package provides comprehensive data storage for the job application system:
 * - User profiles and preferences
 * - Job listings from multiple platforms
 * - Application tracking and status management
 * - Job matching scores and analysis
 * - Platform credentials (encrypted)
 * - Application events and audit logging
 * - Search history tracking
 * - Daily statistics and analytics
 * - Key-value settings storage
 */

// Core database connection and utilities
export * from './connection.js';
export * from './schema.js';
export * from './migrations/index.js';

// Repositories - Individual data access layers
export * from './repositories/profile-repository.js';
export * from './repositories/job-repository.js';
export * from './repositories/application-repository.js';
export * from './repositories/match-repository.js';
export * from './repositories/settings-repository.js';
export * from './repositories/credentials-repository.js';
export * from './repositories/events-repository.js';
export * from './repositories/search-history-repository.js';
export * from './repositories/stats-repository.js';

// Unified storage service - Recommended entry point
export * from './storage-service.js';
export { storageService as default } from './storage-service.js';
