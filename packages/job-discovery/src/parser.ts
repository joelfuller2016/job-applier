import Anthropic from '@anthropic-ai/sdk';
import {
  JobListing,
  JobPlatform,
  ApiError,
  generateId,
} from '@job-applier/core';
import { getConfigManager } from '@job-applier/config';
import { ExaSearchResult } from './client.js';

/**
 * System prompt for job parsing
 */
const JOB_PARSING_PROMPT = `You are an expert job listing parser. Your task is to extract structured information from job posting text and return it as valid JSON.

Extract the following information:
1. Job title
2. Company information (name, website, size, industry)
3. Location (can be remote, hybrid, or specific location)
4. Job description
5. Requirements (list of required qualifications)
6. Responsibilities (list of job duties)
7. Required skills (technical and soft skills)
8. Preferred/nice-to-have skills
9. Experience level (entry, mid, senior, lead, executive)
10. Employment type (full-time, part-time, contract, internship)
11. Work arrangement (remote, hybrid, onsite)
12. Salary information if mentioned (min, max, currency)
13. Benefits if mentioned
14. Application deadline if mentioned

Return ONLY valid JSON. Do not include any explanatory text.`;

/**
 * Parse job listing content using Claude
 */
export async function parseJobWithClaude(
  content: string,
  url: string,
  platform: JobPlatform
): Promise<Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>> {
  const config = getConfigManager().getClaude();

  const client = new Anthropic({
    apiKey: config.apiKey,
  });

  const userPrompt = `Parse this job listing and extract all information as structured JSON:

---JOB LISTING START---
${content}
---JOB LISTING END---

Return JSON with this structure:
{
  "title": "string",
  "company": {
    "name": "string",
    "website": "string or null",
    "size": "startup|small|medium|large|enterprise or null",
    "industry": "string or null"
  },
  "location": "string",
  "description": "string",
  "requirements": ["string"],
  "responsibilities": ["string"],
  "qualifications": {
    "education": "string or null",
    "experience": "string or null",
    "other": ["string"]
  },
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "employmentType": "full-time|part-time|contract|internship|temporary or null",
  "experienceLevel": "entry|mid|senior|lead|executive or null",
  "workArrangement": "remote|hybrid|onsite or null",
  "salary": {
    "min": number or null,
    "max": number or null,
    "currency": "string",
    "period": "hourly|daily|weekly|monthly|yearly"
  } or null,
  "benefits": ["string"],
  "applicationDeadline": "YYYY-MM-DD or null",
  "easyApply": boolean,
  "applicantCount": number or null
}`;

  try {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: 0.3,
      system: JOB_PARSING_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ApiError('No text content in Claude response', 500);
    }

    let parsedData: Record<string, unknown>;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new ApiError(
        `Failed to parse job listing JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        500
      );
    }

    // Extract external ID from URL
    const externalId = extractExternalId(url, platform);

    const jobData = {
      externalId,
      platform,
      title: parsedData.title as string,
      company: parsedData.company as JobListing['company'],
      location: parsedData.location as string,
      description: parsedData.description as string,
      requirements: (parsedData.requirements as string[]) || [],
      responsibilities: parsedData.responsibilities as string[] | undefined,
      qualifications: parsedData.qualifications as JobListing['qualifications'],
      requiredSkills: (parsedData.requiredSkills as string[]) || [],
      preferredSkills: parsedData.preferredSkills as string[] | undefined,
      employmentType: parsedData.employmentType as JobListing['employmentType'],
      experienceLevel: parsedData.experienceLevel as JobListing['experienceLevel'],
      workArrangement: parsedData.workArrangement as JobListing['workArrangement'],
      salary: parsedData.salary as JobListing['salary'],
      benefits: parsedData.benefits as string[] | undefined,
      url,
      applyUrl: url,
      easyApply: (parsedData.easyApply as boolean) ?? false,
      applicationDeadline: parsedData.applicationDeadline as string | undefined,
      applicantCount: parsedData.applicantCount as number | undefined,
    };

    return jobData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      `Failed to parse job listing: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

/**
 * Extract external ID from job URL
 */
function extractExternalId(url: string, platform: JobPlatform): string {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case 'linkedin': {
        // LinkedIn URLs: linkedin.com/jobs/view/12345
        const match = url.match(/\/jobs\/view\/(\d+)/);
        return match ? match[1] : generateId();
      }
      case 'indeed': {
        // Indeed URLs: indeed.com/viewjob?jk=abc123
        const jk = urlObj.searchParams.get('jk');
        return jk ?? generateId();
      }
      case 'glassdoor': {
        // Glassdoor URLs: glassdoor.com/job-listing/...-JV_IC...
        const match = url.match(/JV_([A-Z0-9]+)/i);
        return match ? match[1] : generateId();
      }
      case 'wellfound': {
        // Wellfound URLs: wellfound.com/l/12345
        const match = url.match(/\/l\/(\d+)/);
        return match ? match[1] : generateId();
      }
      case 'company-website': {
        // For greenhouse and lever embedded in company sites
        // Greenhouse URLs: boards.greenhouse.io/company/jobs/12345
        const greenhouseMatch = url.match(/\/jobs\/(\d+)/);
        if (greenhouseMatch) return greenhouseMatch[1];

        // Lever URLs: jobs.lever.co/company/uuid
        const leverMatch = url.match(/\/([a-f0-9-]{36})/i);
        if (leverMatch) return leverMatch[1];

        return generateId();
      }
      default:
        return generateId();
    }
  } catch {
    return generateId();
  }
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): JobPlatform {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('linkedin.com')) return 'linkedin';
  if (urlLower.includes('indeed.com')) return 'indeed';
  if (urlLower.includes('glassdoor.com')) return 'glassdoor';
  if (urlLower.includes('wellfound.com') || urlLower.includes('angel.co')) return 'wellfound';
  if (urlLower.includes('ziprecruiter.com')) return 'ziprecruiter';
  if (urlLower.includes('monster.com')) return 'monster';
  if (urlLower.includes('dice.com')) return 'dice';
  if (urlLower.includes('builtin.com')) return 'builtin';
  if (urlLower.includes('levels.fyi')) return 'levels-fyi';
  // greenhouse and lever are typically embedded in company career sites
  if (urlLower.includes('greenhouse.io') || urlLower.includes('lever.co')) return 'company-website';

  return 'other';
}

/**
 * Parse multiple search results into job listings
 */
export async function parseSearchResults(
  results: ExaSearchResult[]
): Promise<Array<Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>>> {
  const jobs: Array<Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>> = [];

  for (const result of results) {
    if (!result.text) continue;

    try {
      const platform = detectPlatform(result.url);
      const job = await parseJobWithClaude(result.text, result.url, platform);
      jobs.push(job);
    } catch (error) {
      console.error(`Failed to parse job from ${result.url}:`, error);
      // Continue with other results
    }
  }

  return jobs;
}
