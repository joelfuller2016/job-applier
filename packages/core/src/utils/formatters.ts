/**
 * Format a date to ISO string
 */
export function toISOString(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * Format a date to human-readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options ?? {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date range (e.g., for work experience)
 */
export function formatDateRange(start: string, end: string | null): string {
  const startDate = formatDate(start, { year: 'numeric', month: 'short' });
  const endDate = end ? formatDate(end, { year: 'numeric', month: 'short' }) : 'Present';
  return `${startDate} - ${endDate}`;
}

/**
 * Calculate duration between two dates
 */
export function calculateDuration(start: string, end: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const months = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}

/**
 * Format salary to human-readable string
 */
export function formatSalary(
  amount: number,
  currency = 'USD',
  period: 'hourly' | 'yearly' = 'yearly'
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(amount);
  return period === 'hourly' ? `${formatted}/hr` : `${formatted}/yr`;
}

/**
 * Format salary range
 */
export function formatSalaryRange(
  min?: number,
  max?: number,
  currency = 'USD'
): string {
  if (min && max) {
    return `${formatSalary(min, currency)} - ${formatSalary(max, currency)}`;
  }
  if (min) {
    return `${formatSalary(min, currency)}+`;
  }
  if (max) {
    return `Up to ${formatSalary(max, currency)}`;
  }
  return 'Not specified';
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format company size range
 */
export function formatCompanySize(size: string): string {
  const sizeMap: Record<string, string> = {
    '1-10': 'Startup (1-10 employees)',
    '11-50': 'Small (11-50 employees)',
    '51-200': 'Medium (51-200 employees)',
    '201-500': 'Medium-Large (201-500 employees)',
    '501-1000': 'Large (501-1000 employees)',
    '1001-5000': 'Enterprise (1001-5000 employees)',
    '5001-10000': 'Large Enterprise (5001-10000 employees)',
    '10000+': 'Major Corporation (10000+ employees)',
  };
  return sizeMap[size] ?? size;
}

/**
 * Format list to human-readable string
 */
export function formatList(items: string[], conjunction = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast}, ${conjunction} ${last}`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Format time ago (relative time)
 */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];

  for (const [secondsInInterval, label] of intervals) {
    const count = Math.floor(seconds / secondsInInterval);
    if (count >= 1) {
      return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Slugify a string (for URLs or file names)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
