import { UserProfile } from '@job-applier/core';
import {
  extractResumeContent,
  validateResumeContent,
  getFileType,
  type ExtractedContent,
  type SupportedFileType,
} from './extractor.js';
import { parseResumeWithClaude, extractKeySkills } from './parser.js';

/**
 * Parse result containing the profile and any warnings
 */
export interface ParseResult {
  profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;
  warnings: string[];
  metadata: {
    fileName: string;
    fileType: SupportedFileType;
    fileSize: number;
    extractedAt: string;
    parsedAt: string;
    pageCount?: number;
  };
}

/**
 * Resume parser class
 */
export class ResumeParser {
  /**
   * Parse a resume file and extract structured data
   */
  async parse(filePath: string): Promise<ParseResult> {
    // Extract text content from file
    const content = await extractResumeContent(filePath);

    // Validate the content
    const validation = validateResumeContent(content);
    const warnings: string[] = [...validation.issues];

    // Parse with Claude
    const profile = await parseResumeWithClaude(content);

    return {
      profile,
      warnings,
      metadata: {
        ...content.metadata,
        parsedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Extract only the text content from a resume
   */
  async extractText(filePath: string): Promise<ExtractedContent> {
    return extractResumeContent(filePath);
  }

  /**
   * Extract key skills from a resume
   */
  async extractSkills(filePath: string): Promise<string[]> {
    const content = await extractResumeContent(filePath);
    return extractKeySkills(content);
  }

  /**
   * Validate a resume file
   */
  async validate(filePath: string): Promise<{
    valid: boolean;
    fileType: SupportedFileType;
    issues: string[];
  }> {
    const fileType = getFileType(filePath);
    const content = await extractResumeContent(filePath);
    const validation = validateResumeContent(content);

    return {
      valid: validation.valid,
      fileType,
      issues: validation.issues,
    };
  }

  /**
   * Get supported file types
   */
  getSupportedTypes(): SupportedFileType[] {
    return ['pdf', 'docx', 'doc', 'txt'];
  }
}

// Export a singleton instance
export const resumeParser = new ResumeParser();

// Re-export types and utilities
export {
  extractResumeContent,
  validateResumeContent,
  getFileType,
  parseResumeWithClaude,
  extractKeySkills,
  type ExtractedContent,
  type SupportedFileType,
};
