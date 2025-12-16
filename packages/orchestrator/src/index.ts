/**
 * Orchestrator package
 * Main engine for automated job applications
 */

export {
  JobApplierEngine,
  WorkflowOptions,
  WorkflowResult,
} from './engine.js';

export {
  JobMatcher,
  MatchWeights,
} from './matcher.js';

export {
  CoverLetterGenerator,
  CoverLetterOptions,
} from './cover-letter.js';

// Re-export commonly used types
export type {
  JobListing,
  UserProfile,
  JobApplication,
  JobMatch,
  CoverLetter,
  PlatformCredentials,
} from '@job-applier/core';

export { SupportedPlatform, platformRegistry } from '@job-applier/platforms';
export { ApplicationTracker, ApplicationAnalytics } from '@job-applier/application-tracker';
