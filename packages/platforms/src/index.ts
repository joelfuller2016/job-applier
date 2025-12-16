/**
 * Platform adapters package
 * Provides platform-specific implementations for job application workflows
 */

// Base adapter and types
export { BasePlatformAdapter, ApplicationResult } from './base.js';

// LinkedIn
export { LinkedInAdapter, linkedInAdapter } from './linkedin/adapter.js';
export { LinkedInSelectors, LinkedInUrls } from './linkedin/selectors.js';

// Indeed
export { IndeedAdapter, indeedAdapter } from './indeed/adapter.js';
export { IndeedSelectors, IndeedUrls } from './indeed/selectors.js';

// Re-export core types for convenience
export type {
  JobListing,
  UserProfile,
  CoverLetter,
  PlatformCredentials,
  IPlatformAdapter,
  JobPlatform,
} from '@job-applier/core';

// Import for internal use
import { LinkedInAdapter, linkedInAdapter } from './linkedin/adapter.js';
import { LinkedInSelectors, LinkedInUrls } from './linkedin/selectors.js';
import { IndeedAdapter, indeedAdapter } from './indeed/adapter.js';
import { IndeedSelectors, IndeedUrls } from './indeed/selectors.js';

/**
 * Get adapter by platform name
 */
export function getAdapter(platform: 'linkedin' | 'indeed'): LinkedInAdapter | IndeedAdapter {
  switch (platform) {
    case 'linkedin':
      return linkedInAdapter;
    case 'indeed':
      return indeedAdapter;
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Get all available adapters
 */
export function getAllAdapters(): Array<LinkedInAdapter | IndeedAdapter> {
  return [linkedInAdapter, indeedAdapter];
}

/**
 * Platform registry for dynamic platform handling
 */
export const platformRegistry = {
  linkedin: {
    adapter: linkedInAdapter,
    name: 'LinkedIn',
    supportsEasyApply: true,
    selectors: LinkedInSelectors,
    urls: LinkedInUrls,
  },
  indeed: {
    adapter: indeedAdapter,
    name: 'Indeed',
    supportsEasyApply: true,
    selectors: IndeedSelectors,
    urls: IndeedUrls,
  },
} as const;

export type PlatformRegistry = typeof platformRegistry;
export type SupportedPlatform = keyof PlatformRegistry;
