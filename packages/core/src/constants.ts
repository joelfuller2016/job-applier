/**
 * Application-wide constants
 */

/**
 * Supported job platforms
 */
export const SUPPORTED_PLATFORMS = [
  'linkedin',
  'indeed',
  'glassdoor',
  'ziprecruiter',
  'dice',
  'wellfound',
  'builtin',
] as const;

/**
 * Default rate limits per platform (requests per minute)
 */
export const DEFAULT_RATE_LIMITS: Record<string, number> = {
  linkedin: 10,
  indeed: 15,
  glassdoor: 12,
  ziprecruiter: 15,
  dice: 20,
  wellfound: 15,
  builtin: 20,
  exa: 60,
  anthropic: 50,
};

/**
 * Default delays between actions (milliseconds)
 */
export const DEFAULT_DELAYS = {
  BETWEEN_APPLICATIONS: 30000, // 30 seconds
  BETWEEN_PAGE_LOADS: 2000,    // 2 seconds
  BETWEEN_CLICKS: 500,         // 0.5 seconds
  TYPING_DELAY: 50,            // 50ms per character
  AFTER_LOGIN: 5000,           // 5 seconds
  AFTER_SUBMIT: 3000,          // 3 seconds
};

/**
 * Maximum values
 */
export const MAX_VALUES = {
  APPLICATIONS_PER_DAY: 100,
  RETRIES_PER_APPLICATION: 3,
  COVER_LETTER_LENGTH: 5000,
  RESUME_FILE_SIZE_MB: 10,
  JOBS_PER_SEARCH: 100,
  CONCURRENT_BROWSERS: 3,
};

/**
 * File extensions
 */
export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
export const ALLOWED_COVER_LETTER_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

/**
 * Experience level mappings
 */
export const EXPERIENCE_YEARS_MAP: Record<string, [number, number]> = {
  entry: [0, 2],
  mid: [2, 5],
  senior: [5, 10],
  lead: [7, 15],
  manager: [5, 15],
  director: [10, 20],
  executive: [15, 30],
};

/**
 * Skill categories
 */
export const SKILL_CATEGORIES = [
  'technical',
  'soft',
  'language',
  'tool',
  'framework',
  'other',
] as const;

/**
 * Application status flow
 */
export const STATUS_FLOW: Record<string, string[]> = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['viewed', 'in-review', 'rejected', 'withdrawn', 'expired'],
  viewed: ['in-review', 'interview', 'rejected', 'withdrawn'],
  'in-review': ['interview', 'rejected', 'withdrawn'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['rejected', 'withdrawn'],
  rejected: [],
  withdrawn: [],
  expired: [],
  error: ['draft', 'withdrawn'],
};

/**
 * Common job search keywords by role
 */
export const COMMON_KEYWORDS: Record<string, string[]> = {
  'software-engineer': [
    'software engineer',
    'software developer',
    'backend engineer',
    'full stack developer',
    'SWE',
  ],
  'frontend': [
    'frontend developer',
    'frontend engineer',
    'UI developer',
    'react developer',
    'javascript developer',
  ],
  'backend': [
    'backend developer',
    'backend engineer',
    'server-side developer',
    'API developer',
  ],
  'data-science': [
    'data scientist',
    'machine learning engineer',
    'ML engineer',
    'AI engineer',
    'data analyst',
  ],
  'devops': [
    'devops engineer',
    'site reliability engineer',
    'SRE',
    'platform engineer',
    'infrastructure engineer',
  ],
  'product': [
    'product manager',
    'product owner',
    'PM',
    'technical product manager',
  ],
};

/**
 * Browser automation timeouts (milliseconds)
 */
export const BROWSER_TIMEOUTS = {
  PAGE_LOAD: 30000,
  ELEMENT_VISIBLE: 10000,
  NAVIGATION: 30000,
  FILE_UPLOAD: 60000,
  FORM_SUBMIT: 15000,
};

/**
 * Claude API model identifiers
 */
export const CLAUDE_MODELS = {
  SONNET: 'claude-sonnet-4-20250514',
  HAIKU: 'claude-3-5-haiku-20241022',
  OPUS: 'claude-opus-4-20250514',
} as const;

/**
 * Default Claude model for different tasks
 */
export const DEFAULT_CLAUDE_MODELS = {
  RESUME_PARSING: CLAUDE_MODELS.SONNET,
  COVER_LETTER: CLAUDE_MODELS.SONNET,
  JOB_MATCHING: CLAUDE_MODELS.HAIKU, // Faster for matching
  FORM_FILLING: CLAUDE_MODELS.HAIKU,
};

/**
 * Database table names
 */
export const DB_TABLES = {
  PROFILES: 'profiles',
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  MATCHES: 'job_matches',
  EVENTS: 'application_events',
  CREDENTIALS: 'platform_credentials',
  SETTINGS: 'settings',
};

/**
 * Log levels
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
} as const;
