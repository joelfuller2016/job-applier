import { Exa } from 'exa-js';
import { getConfigManager } from '@job-applier/config';
import { ApiError } from '@job-applier/core';

/**
 * Exa search result type
 */
export interface ExaSearchResult {
  url: string;
  title: string;
  text?: string;
  publishedDate?: string;
  author?: string;
  score?: number;
}

/**
 * Exa search options
 */
export interface ExaSearchOptions {
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  useAutoprompt?: boolean;
  type?: 'keyword' | 'neural' | 'auto';
  category?: 'company' | 'research paper' | 'news' | 'pdf' | 'github' | 'tweet' | 'personal site' | 'linkedin profile' | 'financial report';
}

/**
 * Get Exa client instance
 */
export function getExaClient(): Exa {
  const config = getConfigManager().getExa();
  return new Exa(config.apiKey);
}

/**
 * Search for content using Exa
 */
export async function searchExa(
  query: string,
  options: ExaSearchOptions = {}
): Promise<ExaSearchResult[]> {
  const config = getConfigManager().getExa();
  const client = getExaClient();

  try {
    const response = await client.searchAndContents(query, {
      numResults: options.numResults ?? config.maxResults,
      includeDomains: options.includeDomains,
      excludeDomains: options.excludeDomains,
      startPublishedDate: options.startPublishedDate,
      endPublishedDate: options.endPublishedDate,
      useAutoprompt: options.useAutoprompt ?? true,
      type: options.type ?? 'auto',
      category: options.category,
      text: { maxCharacters: 5000 },
    });

    return response.results.map((result: any) => ({
      url: result.url,
      title: result.title ?? '',
      text: result.text,
      publishedDate: result.publishedDate,
      author: result.author,
      score: result.score,
    }));
  } catch (error) {
    throw new ApiError(
      `Exa search failed: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

/**
 * Verify Exa API key
 */
export async function verifyExaKey(apiKey: string): Promise<boolean> {
  try {
    const client = new Exa(apiKey);
    // Perform a lightweight search to test the key
    await client.search("test", { numResults: 1 });
    return true;
  } catch (error) {
    console.error('Exa key verification failed:', error);
    return false;
  }
}

/**
 * Search for job listings using Exa
 */
export async function searchJobs(
  query: string,
  options: ExaSearchOptions = {}
): Promise<ExaSearchResult[]> {
  // Job boards to include
  const jobDomains = [
    'linkedin.com/jobs',
    'indeed.com',
    'glassdoor.com/job-listing',
    'wellfound.com',
    'lever.co',
    'greenhouse.io',
    'jobs.lever.co',
    'boards.greenhouse.io',
    'careers.google.com',
    'careers.microsoft.com',
    'amazon.jobs',
    'apple.com/careers',
  ];

  return searchExa(query, {
    ...options,
    includeDomains: options.includeDomains ?? jobDomains,
    category: 'company',
    useAutoprompt: true,
  });
}

/**
 * Get content from a specific URL using Exa
 */
export async function getContent(url: string): Promise<ExaSearchResult | null> {
  const client = getExaClient();

  try {
    const response = await client.getContents([url], {
      text: { maxCharacters: 10000 },
    });

    if (response.results.length === 0) {
      return null;
    }

    const result: any = response.results[0];
    return {
      url: result.url,
      title: result.title ?? '',
      text: result.text,
      publishedDate: result.publishedDate,
      author: result.author,
    };
  } catch (error) {
    throw new ApiError(
      `Failed to get content: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

/**
 * Find similar content to a URL
 */
export async function findSimilar(
  url: string,
  options: ExaSearchOptions = {}
): Promise<ExaSearchResult[]> {
  const client = getExaClient();

  try {
    const response = await client.findSimilarAndContents(url, {
      numResults: options.numResults ?? 10,
      includeDomains: options.includeDomains,
      excludeDomains: options.excludeDomains,
      text: { maxCharacters: 5000 },
    });

    return response.results.map((result: any) => ({
      url: result.url,
      title: result.title ?? '',
      text: result.text,
      publishedDate: result.publishedDate,
      author: result.author,
      score: result.score,
    }));
  } catch (error) {
    throw new ApiError(
      `Find similar failed: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}
