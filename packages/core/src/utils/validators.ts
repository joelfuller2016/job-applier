import { z } from 'zod';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validate LinkedIn profile URL
 */
export function isValidLinkedInUrl(url: string): boolean {
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[\w-]+\/?$/i;
  return linkedinRegex.test(url);
}

/**
 * Validate GitHub profile URL
 */
export function isValidGitHubUrl(url: string): boolean {
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/i;
  return githubRegex.test(url);
}

/**
 * Validate date string in ISO format
 */
export function isValidISODate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate that a date is in the past
 */
export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date < new Date();
}

/**
 * Validate salary range
 */
export function isValidSalaryRange(min?: number, max?: number): boolean {
  if (min !== undefined && max !== undefined) {
    return min >= 0 && max >= min;
  }
  if (min !== undefined) {
    return min >= 0;
  }
  if (max !== undefined) {
    return max >= 0;
  }
  return true;
}

/**
 * Sanitize string for database storage
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 10000); // Limit length
}

/**
 * Validate and sanitize file path
 */
export function isValidFilePath(path: string): boolean {
  // Prevent path traversal
  if (path.includes('..') || path.includes('\0')) {
    return false;
  }
  // Check for valid characters
  const pathRegex = /^[\w\-./\\: ]+$/;
  return pathRegex.test(path);
}

/**
 * Validate API key format (Anthropic)
 */
export function isValidAnthropicApiKey(key: string): boolean {
  return key.startsWith('sk-ant-') && key.length >= 50;
}

/**
 * Generic validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate data against a Zod schema
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Create a validator function from a Zod schema
 */
export function createValidator<T>(
  schema: z.ZodSchema<T>
): (data: unknown) => ValidationResult<T> {
  return (data: unknown) => validateWithSchema(schema, data);
}
