import Anthropic from '@anthropic-ai/sdk';
import {
  UserProfile,
  UserProfileSchema,
  ApiError,
} from '@job-applier/core';
import { getConfigManager } from '@job-applier/config';
import { ExtractedContent } from './extractor.js';

/**
 * System prompt for resume parsing
 */
const RESUME_PARSING_PROMPT = `You are an expert resume parser. Your task is to extract structured information from resume text and return it as valid JSON.

Extract the following information:
1. Name - Full name of the candidate
2. Headline - Professional title or headline
3. Summary - Professional summary or objective
4. Contact Information:
   - Email address
   - Phone number
   - Location (city, state, country)
   - LinkedIn URL
   - GitHub URL
   - Personal website
5. Work Experience (for each position):
   - Company name
   - Job title
   - Location
   - Start date (YYYY-MM format)
   - End date (YYYY-MM format or null if current)
   - Whether it's the current position
   - Description of responsibilities and achievements
   - Technologies/skills used
6. Education (for each entry):
   - Institution name
   - Degree type
   - Field of study
   - Start date
   - End date
   - GPA (if mentioned)
   - Relevant coursework
7. Skills:
   - Skill name
   - Category (technical, soft, language, tool)
   - Proficiency level (beginner, intermediate, advanced, expert)
   - Years of experience (if determinable)
8. Certifications (if any):
   - Name
   - Issuer
   - Date obtained
   - Expiration date
   - Credential ID
9. Projects (if any):
   - Name
   - Description
   - Technologies used
   - URL
   - Start/end dates

Return ONLY valid JSON matching this structure. Do not include any explanatory text before or after the JSON.`;

/**
 * Parse resume text using Claude API
 */
export async function parseResumeWithClaude(
  content: ExtractedContent
): Promise<UserProfile> {
  const config = getConfigManager().getClaude();

  const client = new Anthropic({
    apiKey: config.apiKey,
  });

  const userPrompt = `Parse the following resume and extract all information as structured JSON:

---RESUME START---
${content.text}
---RESUME END---

Return the extracted information as JSON with this structure:
{
  "name": "string",
  "headline": "string or null",
  "summary": "string or null",
  "contact": {
    "email": "string",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "github": "string or null",
    "website": "string or null"
  },
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null",
      "current": boolean,
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "YYYY-MM or null",
      "endDate": "YYYY-MM or null",
      "gpa": "string or null",
      "coursework": ["string"]
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "technical|soft|language|tool",
      "level": "beginner|intermediate|advanced|expert",
      "yearsOfExperience": number or null
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "dateObtained": "YYYY-MM or null",
      "expirationDate": "YYYY-MM or null",
      "credentialId": "string or null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null",
      "startDate": "YYYY-MM or null",
      "endDate": "YYYY-MM or null"
    }
  ],
  "preferences": {
    "jobTitles": ["string"],
    "industries": ["string"],
    "locations": ["string"],
    "remotePreference": "remote|hybrid|onsite|flexible",
    "salaryRange": { "min": number, "max": number, "currency": "USD" } or null,
    "employmentTypes": ["full-time", "part-time", "contract"],
    "companySize": ["startup", "small", "medium", "large", "enterprise"] or null,
    "mustHave": ["string"],
    "niceToHave": ["string"],
    "dealBreakers": ["string"]
  }
}`;

  try {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: 0.3, // Lower temperature for more consistent parsing
      system: RESUME_PARSING_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract the text content from the response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ApiError('No text content in Claude response', 500, undefined, { platform: 'claude' });
    }

    // Parse the JSON response
    let parsedData: Record<string, unknown>;
    try {
      // Try to extract JSON from the response (in case there's any surrounding text)
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new ApiError(
        `Failed to parse Claude response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        500,
        undefined,
        { platform: 'claude' }
      );
    }

    // Add metadata
    const profileData = {
      ...parsedData,
      resumePath: content.metadata.fileName,
      parsedAt: content.metadata.extractedAt,
    };

    // Validate against schema
    const result = UserProfileSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse(profileData);
    if (!result.success) {
      console.error('Validation errors:', result.error.errors);
      throw new ApiError(
        `Parsed resume data does not match expected schema: ${result.error.message}`,
        500,
        undefined,
        { platform: 'claude' }
      );
    }

    return result.data as UserProfile;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Anthropic.APIError) {
      throw new ApiError(
        `Claude API error: ${error.message}`,
        error.status ?? 500,
        undefined,
        { platform: 'claude' }
      );
    }

    throw new ApiError(
      `Failed to parse resume: ${error instanceof Error ? error.message : String(error)}`,
      500,
      undefined,
      { platform: 'claude' }
    );
  }
}

/**
 * Extract key skills from resume for matching
 */
export async function extractKeySkills(
  content: ExtractedContent
): Promise<string[]> {
  const config = getConfigManager().getClaude();

  const client = new Anthropic({
    apiKey: config.apiKey,
  });

  try {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Extract all technical skills, tools, technologies, and programming languages mentioned in this resume. Return them as a JSON array of strings, nothing else.

Resume:
${content.text}`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return [];
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]) as string[];
  } catch {
    return [];
  }
}
