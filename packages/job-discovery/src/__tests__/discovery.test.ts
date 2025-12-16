import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobDiscoveryEngine } from '../index.js';
import { buildSearchQueries } from '../discovery.js';
import { UserProfile, JobListing } from '@job-applier/core';

// Mock the config manager with a fully initialized mock
vi.mock('@job-applier/config', () => {
  const mockConfig = {
    exa: {
      apiKey: 'test-api-key',
      maxResults: 10,
    },
    claude: {
      apiKey: 'test-claude-key',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
    },
    database: {
      path: ':memory:',
    },
    browser: {
      headless: true,
      slowMo: 0,
    },
    rateLimit: {
      maxApplicationsPerDay: 50,
      maxApplicationsPerHour: 10,
    },
    platforms: {
      linkedin: { enabled: true },
      indeed: { enabled: true },
      glassdoor: { enabled: true },
    },
    logging: {
      level: 'info',
      file: 'test.log',
    },
    preferences: {
      minMatchScore: 0.7,
      autoApply: false,
    },
    dataDir: './test-data',
    environment: 'test' as const,
  };

  return {
    getConfigManager: vi.fn(() => ({
      isInitialized: () => true,
      getExa: () => mockConfig.exa,
      getClaude: () => mockConfig.claude,
      getConfig: () => mockConfig,
    })),
    initConfig: vi.fn(() => mockConfig),
    getConfig: vi.fn(() => mockConfig),
  };
});

// Mock the Exa client
vi.mock('exa-js', () => {
  return {
    Exa: vi.fn().mockImplementation(() => ({
      searchAndContents: vi.fn().mockResolvedValue({
        results: [
          {
            url: 'https://example.com/job/1',
            title: 'Senior Software Engineer - TypeScript',
            text: 'Job Description: We are seeking a Senior Software Engineer with expertise in TypeScript and React. Location: San Francisco, CA. Salary: $150,000-$200,000. Requirements: 5+ years experience, TypeScript, React, Node.js.',
            publishedDate: '2024-01-15',
            author: 'Example Corp',
            score: 0.95,
          },
          {
            url: 'https://example.com/job/2',
            title: 'Frontend Developer - React',
            text: 'Job Description: Looking for a talented Frontend Developer. Location: Remote. Salary: $120,000-$160,000. Requirements: 3+ years experience, React, JavaScript, CSS.',
            publishedDate: '2024-01-14',
            author: 'Tech Startup',
            score: 0.88,
          },
        ],
      }),
      getContents: vi.fn().mockResolvedValue({
        results: [
          {
            url: 'https://example.com/job/1',
            title: 'Senior Software Engineer',
            text: 'Detailed job description content here.',
            publishedDate: '2024-01-15',
            author: 'Example Corp',
          },
        ],
      }),
      findSimilarAndContents: vi.fn().mockResolvedValue({
        results: [
          {
            url: 'https://similar.com/job/1',
            title: 'Similar Job Position',
            text: 'Similar job description.',
            publishedDate: '2024-01-15',
            score: 0.92,
          },
        ],
      }),
    })),
  };
});

// Mock the Claude parser to avoid API calls in unit tests
vi.mock('../parser.js', () => ({
  parseJobWithClaude: vi.fn().mockImplementation(async (text: string, url: string, platform?: string) => {
    // Extract basic info from mocked text
    const titleMatch = text.match(/Job Description:\s*([^.]+)/);
    const locationMatch = text.match(/Location:\s*([^.]+)/);
    const salaryMatch = text.match(/Salary:\s*([^.]+)/);

    return {
      url,
      title: titleMatch ? titleMatch[1].trim() : 'Software Engineer',
      company: platform || 'Unknown Company',
      location: locationMatch ? locationMatch[1].trim() : 'Remote',
      description: text,
      postedDate: new Date().toISOString(),
      applicationUrl: url,
      platform: platform || 'unknown',
      rawData: { text, url },
    };
  }),
  detectPlatform: vi.fn().mockImplementation((url: string) => {
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('indeed.com')) return 'indeed';
    if (url.includes('greenhouse.io')) return 'greenhouse';
    return 'unknown';
  }),
  parseSearchResults: vi.fn(),
}));

describe('JobDiscoveryEngine', () => {
  describe('Query Building', () => {
    it('should build search query from profile skills and target roles', () => {
      const profile: UserProfile = {
        email: 'test@example.com',
        fullName: 'Test User',
        headline: 'Senior Engineer',
        summary: 'Experienced engineer',
        location: 'San Francisco, CA',
        skills: [
          { name: 'TypeScript', proficiency: 'expert' },
          { name: 'React', proficiency: 'advanced' },
          { name: 'Node.js', proficiency: 'advanced' },
        ],
        experience: [
          {
            company: 'Tech Corp',
            title: 'Senior Engineer',
            startDate: '2018-01',
            description: 'Software engineering',
          },
        ],
        education: [],
        preferences: {
          targetRoles: ['Software Engineer', 'Senior Developer'],
          preferredLocations: ['San Francisco'],
          remotePreference: 'flexible',
          jobTypes: ['full-time'],
          minSalary: 120000,
          targetIndustries: [],
          companySize: [],
          requiredBenefits: [],
        },
      };

      const queries = buildSearchQueries(profile);

      expect(queries.length).toBeGreaterThan(0);
      expect(queries.some((q) => q.toLowerCase().includes('software engineer'))).toBe(
        true
      );
      expect(queries.some((q) => q.toLowerCase().includes('san francisco'))).toBe(true);
    });

    it('should build query from job titles in experience', () => {
      const profile: UserProfile = {
        email: 'test@example.com',
        fullName: 'Test Developer',
        headline: 'Backend Developer',
        summary: 'Backend development',
        location: 'New York, NY',
        skills: [{ name: 'Python', proficiency: 'expert' }],
        experience: [
          {
            company: 'Company A',
            title: 'Software Engineer',
            startDate: '2020-01',
            description: 'Engineering',
          },
          {
            company: 'Company B',
            title: 'Backend Developer',
            startDate: '2018-01',
            endDate: '2019-12',
            description: 'Backend work',
          },
        ],
        education: [],
        preferences: {
          targetRoles: ['Backend Developer'],
          preferredLocations: ['New York'],
          remotePreference: 'flexible',
          jobTypes: ['full-time'],
          targetIndustries: [],
          companySize: [],
          requiredBenefits: [],
        },
      };

      const queries = buildSearchQueries(profile);

      expect(queries.some((q) => q.toLowerCase().includes('backend developer'))).toBe(
        true
      );
    });

    it('should handle profile with remote preference', () => {
      const profile: UserProfile = {
        email: 'test@example.com',
        fullName: 'Remote Worker',
        headline: 'Software Engineer',
        summary: 'Remote engineering',
        location: 'Remote',
        skills: [],
        experience: [],
        education: [],
        preferences: {
          targetRoles: ['Software Engineer'],
          preferredLocations: [],
          remotePreference: 'remote-only',
          jobTypes: ['full-time'],
          targetIndustries: [],
          companySize: [],
          requiredBenefits: [],
        },
      };

      const queries = buildSearchQueries(profile);

      // Should include remote queries
      expect(queries.some((q) => q.toLowerCase().includes('remote'))).toBe(true);
    });

    it('should include industry-specific queries', () => {
      const profile: UserProfile = {
        email: 'test@example.com',
        fullName: 'Industry Expert',
        headline: 'Software Engineer',
        summary: 'Engineering in fintech',
        location: 'Austin, TX',
        skills: [],
        experience: [],
        education: [],
        preferences: {
          targetRoles: ['Software Engineer'],
          preferredLocations: ['Austin'],
          remotePreference: 'flexible',
          jobTypes: ['full-time'],
          targetIndustries: ['fintech', 'healthcare'],
          companySize: [],
          requiredBenefits: [],
        },
      };

      const queries = buildSearchQueries(profile);

      expect(queries.some((q) => q.toLowerCase().includes('fintech'))).toBe(true);
    });
  });

  describe('Unit Tests with Mocked API', () => {
    let engine: JobDiscoveryEngine;

    beforeEach(() => {
      engine = new JobDiscoveryEngine();
      vi.clearAllMocks();
    });

    it('should search for jobs using search method', async () => {
      const result = await engine.search('software engineer TypeScript remote', {
        maxResults: 5,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(Array.isArray(result.searchQueries)).toBe(true);
      expect(result.searchQueries).toContain('software engineer TypeScript remote');
      expect(result.totalFound).toBeGreaterThanOrEqual(0);

      if (result.jobs.length > 0) {
        const job = result.jobs[0];
        expect(job.url).toBeDefined();
        expect(job.title).toBeDefined();
        expect(job.company).toBeDefined();
      }
    });

    it('should discover jobs for profile', async () => {
      const profile: UserProfile = {
        email: 'test@example.com',
        fullName: 'Test Engineer',
        headline: 'Software Engineer',
        summary: 'Experienced in TypeScript and React',
        location: 'Remote',
        skills: [
          { name: 'TypeScript', proficiency: 'expert' },
          { name: 'React', proficiency: 'advanced' },
        ],
        experience: [
          {
            company: 'Tech Corp',
            title: 'Software Engineer',
            startDate: '2020-01',
            description: 'Frontend development',
          },
        ],
        education: [],
        preferences: {
          targetRoles: ['Frontend Engineer'],
          preferredLocations: [],
          remotePreference: 'remote-only',
          jobTypes: ['full-time'],
          targetIndustries: [],
          companySize: [],
          requiredBenefits: [],
        },
      };

      const result = await engine.discoverForProfile(profile, {
        maxResults: 3,
        postedWithin: '7d',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.searchQueries.length).toBeGreaterThan(0);
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });

    it('should find similar jobs', async () => {
      const jobUrl = 'https://www.ycombinator.com/companies/jobs';

      const result = await engine.findSimilar(jobUrl, 3);

      expect(result).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });

    it('should handle search with date filter', async () => {
      const result = await engine.search('React developer jobs', {
        maxResults: 3,
        postedWithin: '7d',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return valid result structure', async () => {
      const result = await engine.search('TypeScript engineer', {
        maxResults: 2,
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.searchQueries)).toBe(true);
      expect(result.searchQueries).toContain('TypeScript engineer');

      // If jobs are returned, verify they have required fields
      result.jobs.forEach(job => {
        expect(job).toHaveProperty('url');
        expect(job).toHaveProperty('title');
        expect(job).toHaveProperty('company');
        expect(job).toHaveProperty('location');
        expect(job).toHaveProperty('description');
        expect(job).toHaveProperty('platform');
      });
    });
  });

  describe('Integration Tests (Real API)', () => {
    const hasApiKey = !!process.env.EXA_API_KEY;

    // These tests will only run if EXA_API_KEY is set
    // They are skipped in normal CI/CD but can be run locally for integration testing
    describe.skipIf(!hasApiKey)('Exa API Search', () => {
      let engine: JobDiscoveryEngine;

      beforeEach(() => {
        // Unmock for integration tests
        vi.unmock('exa-js');
        vi.unmock('../parser.js');
        engine = new JobDiscoveryEngine();
      });

      it('should search for jobs using real API', async () => {
        const result = await engine.search('software engineer TypeScript remote', {
          maxResults: 5,
        });

        expect(result).toBeDefined();
        expect(Array.isArray(result.jobs)).toBe(true);
        expect(result.jobs.length).toBeLessThanOrEqual(5);
        expect(Array.isArray(result.searchQueries)).toBe(true);
        expect(result.totalFound).toBeGreaterThanOrEqual(0);
      }, 30000);

      it('should discover jobs for profile with real API', async () => {
        const profile: UserProfile = {
          email: 'test@example.com',
          fullName: 'Test Engineer',
          headline: 'Software Engineer',
          summary: 'Experienced in TypeScript and React',
          location: 'Remote',
          skills: [
            { name: 'TypeScript', proficiency: 'expert' },
            { name: 'React', proficiency: 'advanced' },
          ],
          experience: [
            {
              company: 'Tech Corp',
              title: 'Software Engineer',
              startDate: '2020-01',
              description: 'Frontend development',
            },
          ],
          education: [],
          preferences: {
            targetRoles: ['Frontend Engineer'],
            preferredLocations: [],
            remotePreference: 'remote-only',
            jobTypes: ['full-time'],
            targetIndustries: [],
            companySize: [],
            requiredBenefits: [],
          },
        };

        const result = await engine.discoverForProfile(profile, {
          maxResults: 3,
          postedWithin: '7d',
        });

        expect(result).toBeDefined();
        expect(Array.isArray(result.jobs)).toBe(true);
        expect(result.searchQueries.length).toBeGreaterThan(0);
      }, 30000);

      it('should find similar jobs with real API', async () => {
        const jobUrl = 'https://www.ycombinator.com/companies/jobs';

        const result = await engine.findSimilar(jobUrl, 3);

        expect(result).toBeDefined();
        expect(Array.isArray(result.jobs)).toBe(true);
        expect(result.totalFound).toBeGreaterThanOrEqual(0);
      }, 30000);
    });
  });
});
