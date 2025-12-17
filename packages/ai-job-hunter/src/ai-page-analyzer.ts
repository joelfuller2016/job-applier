/**
 * AI-Powered Page Analyzer
 * Uses Claude Vision to understand any webpage structure
 */

import Anthropic from '@anthropic-ai/sdk';
import { Page } from 'playwright';
import { getConfigManager } from '@job-applier/config';
import { PageAnalysis, FormField } from './types.js';

export class AIPageAnalyzer {
  private client: Anthropic;

  constructor() {
    const config = getConfigManager();
    const claudeConfig = config.getClaude();
    this.client = new Anthropic({
      apiKey: claudeConfig.apiKey,
    });
  }

  /**
   * Analyze a page using Claude Vision
   */
  async analyzePage(page: Page): Promise<PageAnalysis> {
    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false  // Just viewport for faster analysis
    });
    const base64Image = screenshot.toString('base64');

    // Get page HTML for context
    const html = await page.content();
    const truncatedHtml = html.slice(0, 15000); // Limit HTML size

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this webpage screenshot and the HTML below. Determine:

1. Page type: Is this a job listing page, job details page, application form, login page, or other?
2. If job listings: Identify job titles and their CSS selectors
3. If application form: Identify ALL form fields with their:
   - CSS selector (be specific, use IDs when available)
   - Field type (text, email, phone, file, select, checkbox, radio, textarea)
   - Label/purpose
   - Whether required
   - What user profile data should fill it (firstName, lastName, email, phone, resumePath, etc.)
4. Identify submit/next/apply buttons with their selectors
5. Note any login requirements or errors

HTML (truncated):
${truncatedHtml}

Respond in JSON format:
{
  "pageType": "job_listing" | "job_details" | "application_form" | "login" | "other",
  "title": "page title",
  "jobs": [{"title": "...", "selector": "...", "url": "..."}],
  "formFields": [{"selector": "...", "type": "...", "label": "...", "required": true/false, "profileMapping": "..."}],
  "submitButton": "selector",
  "nextButton": "selector if multi-step",
  "loginRequired": true/false,
  "errors": ["any error messages visible"]
}`
            }
          ],
        }
      ],
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      return JSON.parse(jsonStr.trim()) as PageAnalysis;
    } catch (error) {
      console.error('Failed to parse Claude response:', content.text);
      return {
        pageType: 'other',
        errors: ['Failed to analyze page structure'],
      };
    }
  }

  /**
   * Analyze a job description and match against user profile
   */
  async analyzeJobMatch(
    jobDescription: string,
    userProfile: {
      skills: string[];
      experience: Array<{ title: string; company: string; description?: string }>;
      education: Array<{ degree: string; field: string }>;
    }
  ): Promise<{ score: number; analysis: string; missingSkills: string[] }> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze how well this candidate matches the job:

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CANDIDATE PROFILE:
Skills: ${userProfile.skills.join(', ')}
Experience: ${userProfile.experience.map(e => `${e.title} at ${e.company}`).join('; ')}
Education: ${userProfile.education.map(e => `${e.degree} in ${e.field}`).join('; ')}

Respond in JSON:
{
  "score": 0-100,
  "analysis": "2-3 sentence explanation",
  "missingSkills": ["skills the job wants but candidate lacks"],
  "strongMatches": ["areas where candidate excels"]
}`
        }
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      let jsonStr = content.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      return JSON.parse(jsonStr.trim());
    } catch {
      return { score: 50, analysis: 'Unable to analyze match', missingSkills: [] };
    }
  }

  /**
   * Determine what value to fill for a form field
   */
  async determineFieldValue(
    field: FormField,
    userProfile: Record<string, unknown>,
    jobContext: { title: string; company: string; description: string }
  ): Promise<string> {
    // Direct mappings for common fields
    const directMappings: Record<string, string> = {
      firstName: userProfile.firstName as string || '',
      lastName: userProfile.lastName as string || '',
      email: (userProfile.contact as Record<string, string>)?.email || '',
      phone: (userProfile.contact as Record<string, string>)?.phone || '',
      linkedin: (userProfile.contact as Record<string, string>)?.linkedin || '',
      website: (userProfile.contact as Record<string, string>)?.website || '',
      city: (userProfile.contact as Record<string, string>)?.location || '',
      resumePath: userProfile.resumePath as string || '',
    };

    if (field.profileMapping && directMappings[field.profileMapping]) {
      return directMappings[field.profileMapping];
    }

    // For complex fields, use AI
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `What should I fill for this form field?

Field: ${field.label} (${field.type})
${field.options ? `Options: ${field.options.join(', ')}` : ''}

Job: ${jobContext.title} at ${jobContext.company}

User Profile Summary:
${JSON.stringify(userProfile, null, 2).slice(0, 1500)}

Respond with ONLY the value to fill (no explanation). For select/radio, respond with the exact option text.`
        }
      ],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text.trim() : '';
  }

  /**
   * Find the careers page for a company
   */
  async findCareersPage(companyName: string, companyWebsite?: string): Promise<string | null> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `What is the careers/jobs page URL for ${companyName}?
${companyWebsite ? `Their website is: ${companyWebsite}` : ''}

Common patterns:
- careers.company.com
- company.com/careers
- jobs.company.com
- company.com/jobs
- company.greenhouse.io
- jobs.lever.co/company

Respond with ONLY the most likely URL (no explanation). If unknown, respond "UNKNOWN".`
        }
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const url = content.text.trim();
      return url === 'UNKNOWN' ? null : url;
    }
    return null;
  }
}
