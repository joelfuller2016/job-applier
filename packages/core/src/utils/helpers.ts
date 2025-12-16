import { Experience } from '../types/index.js';

/**
 * Skill aliases for normalization
 */
const SKILL_ALIASES: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'reactjs': 'react',
  'react.js': 'react',
  'node': 'node.js',
  'nodejs': 'node.js',
  'py': 'python',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'k8s': 'kubernetes',
  'tf': 'terraform',
  'aws lambda': 'aws',
  'ec2': 'aws',
  's3': 'aws',
  'gcp': 'google cloud',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'angular.js': 'angular',
  'angularjs': 'angular',
};

/**
 * Common words to filter from keyword extraction
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'we', 'you', 'he', 'she', 'it', 'they', 'them', 'their', 'our',
  'your', 'his', 'her', 'its', 'this', 'that', 'these', 'those', 'am',
  'being', 'having', 'doing', 'would', 'looking', 'seeking', 'great',
  'good', 'best', 'new', 'first', 'last', 'long', 'great', 'little', 'own',
  'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large',
  'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same',
  'able', 'about', 'above', 'after', 'again', 'all', 'also', 'any', 'because',
  'before', 'between', 'both', 'each', 'few', 'how', 'into', 'just', 'know',
  'make', 'more', 'most', 'much', 'no', 'not', 'now', 'only', 'over', 'some',
  'such', 'than', 'then', 'there', 'through', 'too', 'under', 'up', 'very',
  'what', 'when', 'where', 'which', 'while', 'who', 'why', 'work', 'working',
]);

/**
 * Normalize a skill name for comparison
 */
export function normalizeSkill(skill: string): string {
  const trimmed = skill.trim().toLowerCase();
  if (!trimmed) return '';
  return SKILL_ALIASES[trimmed] ?? trimmed;
}

/**
 * Parse years of experience from requirement text
 */
export function parseExperienceYears(text: string): number {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)/i,
    /(\d+)\s*-\s*\d+\s*(?:years?|yrs?)/i,
    /(\d+)\s*to\s*\d+\s*(?:years?|yrs?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return 0;
}

/**
 * Calculate total years of experience from experience array
 */
export function calculateYearsOfExperience(experience: Experience[]): number {
  if (experience.length === 0) return 0;

  // Build timeline of all work periods
  const periods: Array<{ start: Date; end: Date }> = [];

  for (const exp of experience) {
    const start = parseMonthYear(exp.startDate);
    const end = exp.endDate ? parseMonthYear(exp.endDate) : new Date();
    if (start && end) {
      periods.push({ start, end });
    }
  }

  if (periods.length === 0) return 0;

  // Sort periods by start date
  periods.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge overlapping periods
  const merged: Array<{ start: Date; end: Date }> = [periods[0]];

  for (let i = 1; i < periods.length; i++) {
    const current = periods[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Overlapping - extend if needed
      if (current.end > last.end) {
        last.end = current.end;
      }
    } else {
      // Non-overlapping
      merged.push(current);
    }
  }

  // Calculate total months
  let totalMonths = 0;
  for (const period of merged) {
    const months = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    totalMonths += months;
  }

  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}

/**
 * Parse YYYY-MM or similar date formats
 */
function parseMonthYear(dateStr: string): Date | null {
  const patterns = [
    /^(\d{4})-(\d{1,2})$/, // YYYY-MM
    /^(\d{1,2})\/(\d{4})$/, // MM/YYYY
    /^([A-Za-z]+)\s+(\d{4})$/, // Month YYYY
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let year: number, month: number;

      if (pattern === patterns[0]) {
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
      } else if (pattern === patterns[1]) {
        month = parseInt(match[1], 10) - 1;
        year = parseInt(match[2], 10);
      } else {
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december',
        ];
        month = monthNames.findIndex(m => m.startsWith(match[1].toLowerCase()));
        year = parseInt(match[2], 10);
      }

      if (year && month >= 0) {
        return new Date(year, month, 1);
      }
    }
  }

  // Try direct parsing as fallback
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Tokenize and normalize
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !STOP_WORDS.has(word));

  // Deduplicate
  return [...new Set(words)];
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random delay within a range
 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(ms);
}

/**
 * Chunk an array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}
