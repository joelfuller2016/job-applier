import Anthropic from '@anthropic-ai/sdk';
import {
  JobListing,
  UserProfile,
  CoverLetter,
  generateId,
  toISOString,
} from '@job-applier/core';
import { getConfigManager } from '@job-applier/config';

/**
 * Cover letter generation options
 */
export interface CoverLetterOptions {
  tone?: 'formal' | 'conversational' | 'enthusiastic';
  length?: 'short' | 'medium' | 'long';
  emphasize?: string[];
  customInstructions?: string;
}

/**
 * Cover letter generator using Claude AI
 */
export class CoverLetterGenerator {
  private client: Anthropic;

  constructor() {
    const config = getConfigManager();
    this.client = new Anthropic({
      apiKey: config.getClaude().apiKey,
    });
  }

  /**
   * Generate a personalized cover letter
   */
  async generate(
    job: JobListing,
    profile: UserProfile,
    options: CoverLetterOptions = {}
  ): Promise<CoverLetter> {
    const {
      tone = 'formal',
      length = 'medium',
      emphasize = [],
      customInstructions = '',
    } = options;

    const lengthGuide = {
      short: '150-200 words',
      medium: '250-350 words',
      long: '400-500 words',
    };

    const toneGuide = {
      formal: 'formal and business-like',
      conversational: 'friendly yet professional',
      enthusiastic: 'energetic and passionate',
    };

    const prompt = this.buildPrompt(job, profile, {
      tone: toneGuide[tone],
      length: lengthGuide[length],
      emphasize,
      customInstructions,
    });

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the response
    const parsed = this.parseResponse(content.text);

    const coverLetter: CoverLetter = {
      id: generateId(),
      content: parsed.content,
      generatedAt: toISOString(new Date()),
      tone,
      customizations: {
        companySpecific: [],
        roleSpecific: [],
        skillHighlights: emphasize,
      },
      version: 1,
    };

    return coverLetter;
  }

  /**
   * Build the prompt for cover letter generation
   */
  private buildPrompt(
    job: JobListing,
    profile: UserProfile,
    options: {
      tone: string;
      length: string;
      emphasize: string[];
      customInstructions: string;
    }
  ): string {
    const experienceSummary = profile.experience
      .slice(0, 3)
      .map(e => `- ${e.title} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})`)
      .join('\n');

    const skillsList = profile.skills
      .slice(0, 15)
      .map(s => s.name)
      .join(', ');

    const educationSummary = profile.education
      .map(e => `- ${e.degree} in ${e.field} from ${e.institution}`)
      .join('\n');

    let prompt = `Write a cover letter for the following job application.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company.name}
Location: ${job.location}
${job.salary ? `Salary: ${job.salary}` : ''}

Job Description:
${job.description.substring(0, 2000)}

APPLICANT PROFILE:
Name: ${profile.firstName} ${profile.lastName}
${profile.summary ? `Summary: ${profile.summary}` : ''}

Experience:
${experienceSummary}

Skills: ${skillsList}

Education:
${educationSummary}

REQUIREMENTS:
- Tone: ${options.tone}
- Length: ${options.length}
- Do NOT include placeholder text like [Your Name], [Date], etc.
- Use the applicant's actual name and details
- Make it specific to this job and company
- Highlight relevant experience and skills that match the job requirements`;

    if (options.emphasize.length > 0) {
      prompt += `\n- Especially emphasize these skills/experiences: ${options.emphasize.join(', ')}`;
    }

    if (options.customInstructions) {
      prompt += `\n- Additional instructions: ${options.customInstructions}`;
    }

    prompt += `

OUTPUT FORMAT:
Return the cover letter in the following JSON format:
{
  "content": "The full cover letter text here",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}

Only respond with the JSON, no other text.`;

    return prompt;
  }

  /**
   * Parse the Claude response
   */
  private parseResponse(text: string): { content: string; keyPoints: string[] } {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(text);
      return {
        content: parsed.content,
        keyPoints: parsed.keyPoints || [],
      };
    } catch {
      // If not valid JSON, treat the whole text as the content
      return {
        content: text.trim(),
        keyPoints: [],
      };
    }
  }

  /**
   * Generate a quick thank-you follow-up email
   */
  async generateFollowUp(
    job: JobListing,
    profile: UserProfile,
    context: 'application' | 'interview' | 'offer'
  ): Promise<string> {
    const contextPrompts = {
      application: 'Write a brief follow-up email to check on the status of a job application submitted last week.',
      interview: 'Write a thank-you email after a job interview.',
      offer: 'Write a professional email to request more time to consider a job offer.',
    };

    const prompt = `${contextPrompts[context]}

Job: ${job.title} at ${job.company.name}
Applicant: ${profile.firstName} ${profile.lastName}

Write a brief, professional email (3-4 paragraphs max). Do not include placeholders.
Only return the email content, nothing else.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text.trim();
  }

  /**
   * Improve an existing cover letter
   */
  async improve(
    existingContent: string,
    job: JobListing,
    feedback: string
  ): Promise<string> {
    const prompt = `Improve this cover letter based on the feedback provided.

CURRENT COVER LETTER:
${existingContent}

JOB:
${job.title} at ${job.company.name}

FEEDBACK TO ADDRESS:
${feedback}

Rewrite the cover letter incorporating the feedback while maintaining professionalism.
Only return the improved cover letter text, nothing else.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text.trim();
  }
}
