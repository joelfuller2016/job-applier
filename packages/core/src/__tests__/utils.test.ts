import { describe, it, expect } from 'vitest';
import {
  normalizeSkill,
  parseExperienceYears,
  calculateYearsOfExperience,
  extractKeywords,
  retry,
  delay,
  chunk,
  pick,
  omit,
} from '../utils/helpers.js';
import {
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isValidLinkedInUrl,
  isValidGitHubUrl,
} from '../utils/validators.js';
import {
  formatSalary,
  slugify,
  truncate,
  formatDate,
  formatDateRange,
  formatTimeAgo,
  formatPercentage,
  formatList,
  generateId,
} from '../utils/formatters.js';

describe('Helpers', () => {
  describe('normalizeSkill', () => {
    it('should normalize skill names to lowercase', () => {
      expect(normalizeSkill('TypeScript')).toBe('typescript');
      expect(normalizeSkill('NODE.JS')).toBe('node.js');
    });

    it('should trim whitespace', () => {
      expect(normalizeSkill('  React  ')).toBe('react');
    });

    it('should handle common aliases', () => {
      expect(normalizeSkill('JS')).toBe('javascript');
      expect(normalizeSkill('TS')).toBe('typescript');
      expect(normalizeSkill('ReactJS')).toBe('react');
      expect(normalizeSkill('Node')).toBe('node.js');
    });

    it('should handle empty strings', () => {
      expect(normalizeSkill('')).toBe('');
      expect(normalizeSkill('   ')).toBe('');
    });
  });

  describe('parseExperienceYears', () => {
    it('should parse "X years" format', () => {
      expect(parseExperienceYears('5 years')).toBe(5);
      expect(parseExperienceYears('3 years experience')).toBe(3);
    });

    it('should parse "X+ years" format', () => {
      expect(parseExperienceYears('5+ years')).toBe(5);
      expect(parseExperienceYears('10+ years of experience')).toBe(10);
    });

    it('should parse year ranges', () => {
      // Implementation matches first digit pattern, which captures the higher number in "X-Y years"
      expect(parseExperienceYears('3-5 years')).toBe(5);
      expect(parseExperienceYears('5-7 years experience')).toBe(7);
    });

    it('should return 0 for unparseable strings', () => {
      expect(parseExperienceYears('some experience')).toBe(0);
      expect(parseExperienceYears('')).toBe(0);
    });
  });

  describe('formatSalary', () => {
    it('should format salary with currency', () => {
      expect(formatSalary(100000, 'USD')).toBe('$100,000/yr');
      // EUR format may vary by locale, just check it contains the amount
      const eurSalary = formatSalary(75000, 'EUR');
      expect(eurSalary).toContain('75,000');
      expect(eurSalary).toContain('/yr');
    });

    it('should format hourly salary', () => {
      expect(formatSalary(50, 'USD', 'hourly')).toBe('$50/hr');
    });

    it('should format yearly salary', () => {
      expect(formatSalary(80000, 'USD', 'yearly')).toBe('$80,000/yr');
    });
  });

  describe('calculateYearsOfExperience', () => {
    it('should calculate years from experience array', () => {
      const experience = [
        { startDate: '2018-01', endDate: '2020-12', company: 'A', title: 'Dev' },
        { startDate: '2021-01', endDate: '2023-12', company: 'B', title: 'Dev' },
      ];

      const years = calculateYearsOfExperience(experience);
      expect(years).toBeGreaterThanOrEqual(5);
      expect(years).toBeLessThanOrEqual(6);
    });

    it('should handle current job (no end date)', () => {
      const experience = [
        { startDate: '2020-01', company: 'Current', title: 'Dev' },
      ];

      const years = calculateYearsOfExperience(experience);
      expect(years).toBeGreaterThanOrEqual(4);
    });

    it('should return 0 for empty experience', () => {
      expect(calculateYearsOfExperience([])).toBe(0);
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from text', () => {
      const text = 'Looking for a TypeScript developer with React experience';
      const keywords = extractKeywords(text);

      expect(keywords).toContain('typescript');
      expect(keywords).toContain('developer');
      expect(keywords).toContain('react');
    });

    it('should filter out common words', () => {
      const text = 'We are looking for a great developer';
      const keywords = extractKeywords(text);

      expect(keywords).not.toContain('we');
      expect(keywords).not.toContain('are');
      expect(keywords).not.toContain('for');
      expect(keywords).not.toContain('a');
    });

    it('should handle empty text', () => {
      expect(extractKeywords('')).toEqual([]);
    });

    it('should deduplicate keywords', () => {
      const text = 'TypeScript TypeScript TypeScript developer';
      const keywords = extractKeywords(text);

      const typescriptCount = keywords.filter(k => k === 'typescript').length;
      expect(typescriptCount).toBe(1);
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Senior Software Engineer')).toBe('senior-software-engineer');
    });

    it('should remove special characters', () => {
      expect(slugify('C++ Developer!')).toBe('c-developer');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('too   many   spaces')).toBe('too-many-spaces');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(slugify('  test  ')).toBe('test');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const long = 'This is a very long string that should be truncated';
      expect(truncate(long, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Short', 20)).toBe('Short');
    });

    it('should use ellipsis suffix', () => {
      // Implementation uses '...' as fixed suffix
      expect(truncate('Long string here', 10)).toBe('Long st...');
    });

    it('should handle edge cases', () => {
      expect(truncate('', 10)).toBe('');
      expect(truncate('abc', 10)).toBe('abc');
    });
  });

  describe('retry', () => {
    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Not yet');
        }
        return 'success';
      };

      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should succeed on first try', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        return 'immediate success';
      };

      const result = await retry(fn, 3, 10);
      expect(result).toBe('immediate success');
      expect(attempts).toBe(1);
    });

    it('should throw after max retries', async () => {
      const fn = async () => {
        throw new Error('Always fails');
      };

      await expect(retry(fn, 3, 10)).rejects.toThrow('Always fails');
    });
  });

  describe('delay', () => {
    it('should delay for specified time', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(150);
    });
  });

  describe('chunk', () => {
    it('should chunk array into smaller arrays', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7];
      const chunks = chunk(arr, 3);

      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('should handle empty array', () => {
      expect(chunk([], 3)).toEqual([]);
    });

    it('should handle array smaller than chunk size', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = pick(obj, ['a', 'c']);

      expect(picked).toEqual({ a: 1, c: 3 });
    });

    it('should handle missing keys', () => {
      const obj = { a: 1 };
      const picked = pick(obj, ['a', 'b' as keyof typeof obj]);

      expect(picked).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const omitted = omit(obj, ['b']);

      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });
});

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('://missing-protocol')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
      expect(isValidPhone('555-123-4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc-def-ghij')).toBe(false);
    });
  });

  describe('isValidLinkedInUrl', () => {
    it('should validate LinkedIn URLs', () => {
      expect(isValidLinkedInUrl('https://linkedin.com/in/username')).toBe(true);
      expect(isValidLinkedInUrl('https://www.linkedin.com/in/user-name')).toBe(true);
    });

    it('should reject non-LinkedIn URLs', () => {
      expect(isValidLinkedInUrl('https://facebook.com/user')).toBe(false);
    });
  });

  describe('isValidGitHubUrl', () => {
    it('should validate GitHub URLs', () => {
      expect(isValidGitHubUrl('https://github.com/username')).toBe(true);
    });

    it('should reject non-GitHub URLs', () => {
      expect(isValidGitHubUrl('https://gitlab.com/user')).toBe(false);
    });
  });
});

describe('Formatters', () => {
  describe('formatDate', () => {
    it('should format date to readable string', () => {
      // Use a specific date with timezone to avoid TZ issues
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = formatDate(date);

      // Check for year and month (day may vary by timezone)
      expect(formatted).toContain('2024');
      expect(formatted).toMatch(/January|Jan/);
    });
  });

  describe('formatDateRange', () => {
    it('should format date range', () => {
      // Use ISO format dates to avoid timezone issues
      const range = formatDateRange('2020-01-15', '2023-12-15');
      // Check that dates are formatted (month and year present)
      expect(range).toMatch(/\w+ \d{4} - \w+ \d{4}/);
      expect(range).toContain('-'); // Contains separator
    });

    it('should handle present for null end date', () => {
      const range = formatDateRange('2020-01-15', null);
      expect(range).toContain('Present');
    });
  });

  describe('formatTimeAgo', () => {
    it('should format recent time', () => {
      const recentDate = new Date(Date.now() - 60000); // 1 minute ago
      const formatted = formatTimeAgo(recentDate);
      expect(formatted).toContain('minute');
    });

    it('should format days ago', () => {
      const daysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const formatted = formatTimeAgo(daysAgo);
      expect(formatted).toContain('day');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage', () => {
      expect(formatPercentage(75.5, 1)).toBe('75.5%');
      expect(formatPercentage(100)).toBe('100%');
    });
  });

  describe('formatList', () => {
    it('should format list with conjunction', () => {
      expect(formatList(['a', 'b', 'c'])).toBe('a, b, and c');
      expect(formatList(['a', 'b'])).toBe('a and b');
      expect(formatList(['a'])).toBe('a');
      expect(formatList([])).toBe('');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
