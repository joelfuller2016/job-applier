import {
  JobListing,
  UserProfile,
} from '@job-applier/core';
import { getConfigManager } from '@job-applier/config';
import { searchJobs, findSimilar, ExaSearchResult } from './client.js';
import { parseJobWithClaude, detectPlatform } from './parser.js';

/**
 * Discovery options
 */
export interface DiscoveryOptions {
  maxResults?: number;
  platforms?: string[];
  includeRemote?: boolean;
  postedWithin?: '24h' | '7d' | '14d' | '30d';
}

/**
 * Discovery result
 */
export interface DiscoveryResult {
  jobs: Array<Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>>;
  totalFound: number;
  searchQueries: string[];
  errors: string[];
}

/**
 * Build search queries from user profile and preferences
 */
export function buildSearchQueries(profile: UserProfile): string[] {
  const queries: string[] = [];
  const prefs = profile.preferences;

  // Base job titles
  const jobTitles = prefs.targetRoles.length > 0 ? prefs.targetRoles : [profile.headline ?? 'Software Engineer'];

  // Location preferences
  const locations = prefs.preferredLocations.length > 0 ? prefs.preferredLocations : ['remote'];

  // Build queries combining titles and locations
  for (const title of jobTitles.slice(0, 3)) {
    // With location
    for (const location of locations.slice(0, 2)) {
      queries.push(`${title} jobs in ${location}`);
    }

    // Remote option if preferred
    if (prefs.remotePreference === 'remote-only' || prefs.remotePreference === 'flexible') {
      queries.push(`${title} remote jobs`);
    }
  }

  // Add skill-based queries
  const topSkills = profile.skills
    .filter(s => s.proficiency === 'expert' || s.proficiency === 'advanced')
    .slice(0, 3)
    .map(s => s.name);

  if (topSkills.length > 0) {
    queries.push(`${topSkills.join(' ')} developer jobs`);
  }

  // Add industry-specific queries
  if (prefs.targetIndustries && prefs.targetIndustries.length > 0) {
    for (const industry of prefs.targetIndustries.slice(0, 2)) {
      queries.push(`${jobTitles[0]} jobs ${industry}`);
    }
  }

  return [...new Set(queries)]; // Remove duplicates
}

/**
 * Get date filter for Exa search
 */
function getDateFilter(postedWithin?: '24h' | '7d' | '14d' | '30d'): string | undefined {
  if (!postedWithin) return undefined;

  const now = new Date();
  const days = {
    '24h': 1,
    '7d': 7,
    '14d': 14,
    '30d': 30,
  }[postedWithin];

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return startDate.toISOString().split('T')[0];
}

/**
 * Discover jobs based on user profile
 */
export async function discoverJobs(
  profile: UserProfile,
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const config = getConfigManager();
  const maxResults = options.maxResults ?? config.getExa().maxResults;

  const queries = buildSearchQueries(profile);
  const allResults: ExaSearchResult[] = [];
  const errors: string[] = [];

  // Search with each query
  const resultsPerQuery = Math.ceil(maxResults / queries.length);

  for (const query of queries) {
    try {
      const results = await searchJobs(query, {
        numResults: resultsPerQuery,
        startPublishedDate: getDateFilter(options.postedWithin),
        includeDomains: options.platforms,
      });
      allResults.push(...results);
    } catch (error) {
      errors.push(`Search failed for "${query}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Deduplicate by URL
  const uniqueResults = Array.from(
    new Map(allResults.map(r => [r.url, r])).values()
  ).slice(0, maxResults);

  // Parse job listings
  const jobs: Array<Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>> = [];

  for (const result of uniqueResults) {
    if (!result.text) continue;

    try {
      const platform = detectPlatform(result.url);
      const job = await parseJobWithClaude(result.text, result.url, platform);
      jobs.push(job);
    } catch (error) {
      errors.push(`Failed to parse ${result.url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    jobs,
    totalFound: uniqueResults.length,
    searchQueries: queries,
    errors,
  };
}

/**
 * Search for jobs with a custom query
 */
export async function searchJobsCustom(
  query: string,
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const config = getConfigManager();
  const maxResults = options.maxResults ?? config.getExa().maxResults;
  const errors: string[] = [];

  let results: ExaSearchResult[] = [];
  try {
    results = await searchJobs(query, {
      numResults: maxResults,
      startPublishedDate: getDateFilter(options.postedWithin),
      includeDomains: options.platforms,
    });
  } catch (error) {
    errors.push(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      jobs: [],
      totalFound: 0,
      searchQueries: [query],
      errors,
    };
  }

  // Parse job listings
  const jobs: Array<Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>> = [];

  for (const result of results) {
    if (!result.text) continue;

    try {
      const platform = detectPlatform(result.url);
      const job = await parseJobWithClaude(result.text, result.url, platform);
      jobs.push(job);
    } catch (error) {
      errors.push(`Failed to parse ${result.url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    jobs,
    totalFound: results.length,
    searchQueries: [query],
    errors,
  };
}

/**
 * Find similar jobs to a given job
 */
export async function findSimilarJobs(
  jobUrl: string,
  maxResults = 10
): Promise<DiscoveryResult> {
  const errors: string[] = [];

  let results: ExaSearchResult[] = [];
  try {
    results = await findSimilar(jobUrl, { numResults: maxResults });
  } catch (error) {
    errors.push(`Find similar failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      jobs: [],
      totalFound: 0,
      searchQueries: [],
      errors,
    };
  }

  // Parse job listings
  const jobs: Array<Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>> = [];

  for (const result of results) {
    if (!result.text) continue;

    try {
      const platform = detectPlatform(result.url);
      const job = await parseJobWithClaude(result.text, result.url, platform);
      jobs.push(job);
    } catch (error) {
      errors.push(`Failed to parse ${result.url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    jobs,
    totalFound: results.length,
    searchQueries: [],
    errors,
  };
}
