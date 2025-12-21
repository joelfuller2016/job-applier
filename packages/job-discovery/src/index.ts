// Client exports
export {
  getExaClient,
  searchExa,
  searchJobs,
  getContent,
  findSimilar,
  verifyExaKey,
  type ExaSearchResult,
  type ExaSearchOptions,
} from './client.js';

// Parser exports
export {
  parseJobWithClaude,
  detectPlatform,
  parseSearchResults,
} from './parser.js';

// Discovery exports
export {
  discoverJobs,
  searchJobsCustom,
  findSimilarJobs,
  buildSearchQueries,
  type DiscoveryOptions,
  type DiscoveryResult,
} from './discovery.js';

import { UserProfile } from '@job-applier/core';
import { discoverJobs, searchJobsCustom, findSimilarJobs, DiscoveryOptions, DiscoveryResult } from './discovery.js';

/**
 * Job Discovery Engine class
 */
export class JobDiscoveryEngine {
  /**
   * Discover jobs based on user profile
   */
  async discoverForProfile(
    profile: UserProfile,
    options?: DiscoveryOptions
  ): Promise<DiscoveryResult> {
    return discoverJobs(profile, options);
  }

  /**
   * Search for jobs with a custom query
   */
  async search(
    query: string,
    options?: DiscoveryOptions
  ): Promise<DiscoveryResult> {
    return searchJobsCustom(query, options);
  }

  /**
   * Find jobs similar to a given job
   */
  async findSimilar(
    jobUrl: string,
    maxResults?: number
  ): Promise<DiscoveryResult> {
    return findSimilarJobs(jobUrl, maxResults);
  }
}

// Export singleton instance
export const jobDiscovery = new JobDiscoveryEngine();
