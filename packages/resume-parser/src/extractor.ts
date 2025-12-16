import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ValidationError } from '@job-applier/core';

/**
 * Supported file types for resume extraction
 */
export type SupportedFileType = 'pdf' | 'docx' | 'doc' | 'txt';

/**
 * Extracted resume content
 */
export interface ExtractedContent {
  text: string;
  metadata: {
    fileName: string;
    fileType: SupportedFileType;
    fileSize: number;
    extractedAt: string;
    pageCount?: number;
  };
}

/**
 * Get the file type from a file path
 */
export function getFileType(filePath: string): SupportedFileType {
  const ext = path.extname(filePath).toLowerCase().slice(1);

  if (['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
    return ext as SupportedFileType;
  }

  throw new ValidationError(
    `Unsupported file type: ${ext}`,
    [`File type '${ext}' is not supported. Supported types: pdf, docx, doc, txt`]
  );
}

/**
 * Extract text from a PDF file
 */
async function extractFromPdf(filePath: string): Promise<{ text: string; pageCount: number }> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    pageCount: data.numpages,
  };
}

/**
 * Extract text from a DOCX file
 */
async function extractFromDocx(filePath: string): Promise<{ text: string }> {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });

  return {
    text: result.value,
  };
}

/**
 * Extract text from a plain text file
 */
async function extractFromTxt(filePath: string): Promise<{ text: string }> {
  const text = fs.readFileSync(filePath, 'utf-8');

  return { text };
}

/**
 * Extract text content from a resume file
 */
export async function extractResumeContent(filePath: string): Promise<ExtractedContent> {
  if (!fs.existsSync(filePath)) {
    throw new ValidationError(
      'Resume file not found',
      [`File does not exist: ${filePath}`]
    );
  }

  const stats = fs.statSync(filePath);
  const fileType = getFileType(filePath);
  const fileName = path.basename(filePath);

  let text: string;
  let pageCount: number | undefined;

  switch (fileType) {
    case 'pdf': {
      const result = await extractFromPdf(filePath);
      text = result.text;
      pageCount = result.pageCount;
      break;
    }
    case 'docx':
    case 'doc': {
      const result = await extractFromDocx(filePath);
      text = result.text;
      break;
    }
    case 'txt': {
      const result = await extractFromTxt(filePath);
      text = result.text;
      break;
    }
    default:
      throw new ValidationError(
        `Unsupported file type: ${fileType}`,
        [`File type '${fileType}' is not supported`]
      );
  }

  // Clean up the extracted text
  text = cleanExtractedText(text);

  return {
    text,
    metadata: {
      fileName,
      fileType,
      fileSize: stats.size,
      extractedAt: new Date().toISOString(),
      pageCount,
    },
  };
}

/**
 * Clean up extracted text
 */
function cleanExtractedText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace from lines
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove leading/trailing whitespace from the whole text
    .trim();
}

/**
 * Validate that the extracted content looks like a resume
 */
export function validateResumeContent(content: ExtractedContent): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const text = content.text.toLowerCase();

  // Check minimum length
  if (content.text.length < 200) {
    issues.push('Resume content is too short (less than 200 characters)');
  }

  // Check for common resume sections
  const commonSections = [
    'experience',
    'education',
    'skills',
    'work history',
    'employment',
    'qualifications',
  ];

  const foundSections = commonSections.filter(section => text.includes(section));
  if (foundSections.length === 0) {
    issues.push('Resume does not appear to contain common resume sections');
  }

  // Check for contact information indicators
  const contactIndicators = ['email', '@', 'phone', 'linkedin', 'github'];
  const hasContactInfo = contactIndicators.some(indicator => text.includes(indicator));
  if (!hasContactInfo) {
    issues.push('Resume does not appear to contain contact information');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
