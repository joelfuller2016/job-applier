/**
 * Application tracking package
 * Provides application lifecycle management, follow-ups, and analytics
 */

export {
  ApplicationTracker,
  ApplicationEvent,
  ApplicationEventLog,
  FollowUpReminder,
} from './tracker.js';

export {
  ApplicationAnalytics,
  ApplicationStats,
  TimelineEntry,
  PlatformMetrics,
} from './analytics.js';

// Re-export commonly used types
export type {
  JobApplication,
  ApplicationStatus,
  JobPlatform,
} from '@job-applier/core';
