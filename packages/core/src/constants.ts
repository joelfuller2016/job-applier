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

/**
 * Session management settings
 */
export const SESSION_SETTINGS = {
  /** Maximum session age in hours before it expires */
  MAX_AGE_HOURS: 24,
  /** Minimum hours since last activity to consider session stale */
  STALE_THRESHOLD_HOURS: 12,
} as const;

/**
 * API token limits for Claude AI
 */
export const CLAUDE_TOKEN_LIMITS = {
  /** Default max tokens for general requests */
  DEFAULT: 4096,
  /** Max tokens for resume parsing */
  RESUME_PARSING: 1024,
  /** Max tokens for cover letter generation */
  COVER_LETTER: 1500,
  /** Max tokens for cover letter refinement */
  COVER_LETTER_REFINEMENT: 1500,
  /** Max tokens for cover letter feedback */
  COVER_LETTER_FEEDBACK: 500,
  /** Max tokens for job matching analysis */
  JOB_MATCHING: 800,
  /** Max tokens for page analysis */
  PAGE_ANALYSIS: 4096,
  /** Max tokens for form analysis */
  FORM_ANALYSIS: 1024,
  /** Max tokens for error analysis */
  ERROR_ANALYSIS: 256,
} as const;

/**
 * Default Claude temperature for different tasks
 */
export const CLAUDE_TEMPERATURE = {
  DEFAULT: 0.7,
  CREATIVE: 0.9,
  PRECISE: 0.3,
} as const;

/**
 * Text extraction limits (characters)
 */
export const TEXT_EXTRACTION_LIMITS = {
  /** Standard text extraction limit */
  STANDARD: 5000,
  /** Extended text extraction limit */
  EXTENDED: 10000,
  /** Career page text limit */
  CAREER_PAGE: 3000,
  /** Job description preview limit */
  JOB_DESCRIPTION_PREVIEW: 1000,
  /** Full job description limit */
  JOB_DESCRIPTION_FULL: 2000,
} as const;

/**
 * Socket.io connection settings
 */
export const SOCKET_SETTINGS = {
  /** Number of reconnection attempts */
  RECONNECTION_ATTEMPTS: 5,
  /** Initial delay between reconnection attempts (ms) */
  RECONNECTION_DELAY: 1000,
  /** Maximum delay between reconnection attempts (ms) */
  RECONNECTION_DELAY_MAX: 5000,
} as const;

/**
 * Retry and backoff settings
 */
export const RETRY_SETTINGS = {
  /** Base delay for exponential backoff (ms) */
  BASE_DELAY: 1000,
  /** Maximum delay for exponential backoff (ms) */
  MAX_DELAY: 60000,
  /** Default number of retries */
  DEFAULT_RETRIES: 3,
} as const;

/**
 * HTTP status codes for error handling
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Rate limiter settings
 */
export const RATE_LIMITER_SETTINGS = {
  /** Default window duration (ms) - 1 minute */
  WINDOW_DURATION: 60000,
  /** Rate limiter cleanup interval (ms) - 5 minutes */
  CLEANUP_INTERVAL: 5 * 60 * 1000,
  /** Default max requests per window */
  DEFAULT_MAX_REQUESTS: 60,
  /** General API rate limit (requests per window) */
  GENERAL_LIMIT: 100,
  /** Mutation rate limit (requests per window) */
  MUTATION_LIMIT: 30,
  /** AI endpoint rate limit (requests per window) */
  AI_LIMIT: 10,
} as const;

/**
 * Automation settings
 */
export const AUTOMATION_SETTINGS = {
  /** Maximum applications per day */
  MAX_APPLICATIONS_PER_DAY: 100,
  /** Maximum applications per hour */
  MAX_APPLICATIONS_PER_HOUR: 20,
  /** Default applications per day */
  DEFAULT_APPLICATIONS_PER_DAY: 25,
  /** Default applications per hour */
  DEFAULT_APPLICATIONS_PER_HOUR: 5,
  /** Pause after this many applications */
  PAUSE_AFTER_APPLICATIONS: 5,
  /** Pause duration (ms) - 1 minute */
  PAUSE_DURATION: 60000,
  /** Maximum logs to keep in store */
  MAX_LOGS: 500,
  /** Minimum delay between applications (seconds) */
  MIN_DELAY_SECONDS: 30,
  /** Maximum delay between applications (seconds) */
  MAX_DELAY_SECONDS: 90,
} as const;

/**
 * Search and discovery settings
 */
export const SEARCH_SETTINGS = {
  /** Maximum jobs to fetch in a search */
  MAX_JOBS: 50,
  /** Default match threshold percentage */
  DEFAULT_MATCH_THRESHOLD: 50,
  /** Maximum results from Exa API */
  EXA_MAX_RESULTS: 100,
} as const;

/**
 * Pagination limits
 */
export const PAGINATION_LIMITS = {
  /** Standard page limit for listings */
  STANDARD: 100,
  /** Extended page limit for bulk operations */
  EXTENDED: 500,
  /** Default page size */
  DEFAULT_PAGE_SIZE: 20,
} as const;

/**
 * Viewport dimensions for browser automation
 */
export const VIEWPORT_SIZES = {
  DESKTOP: { width: 1920, height: 1080 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 667 },
  LAPTOP: { width: 1280, height: 720 },
} as const;

/**
 * Human-like delay ranges for browser automation (ms)
 */
export const HUMAN_DELAY_RANGES = {
  /** Very short delay for rapid actions */
  VERY_SHORT: { min: 50, max: 150 },
  /** Short delay between actions */
  SHORT: { min: 300, max: 600 },
  /** Medium delay for page transitions */
  MEDIUM: { min: 1500, max: 2500 },
  /** Long delay for significant actions */
  LONG: { min: 2000, max: 3000 },
} as const;

/**
 * Navigation settings
 */
export const NAVIGATION_SETTINGS = {
  /** Maximum navigation steps in a job search */
  MAX_STEPS: 10,
  /** Maximum pages to process in form loop */
  MAX_FORM_PAGES: 20,
} as const;

/**
 * Database settings
 */
export const DATABASE_SETTINGS = {
  /** SQLite busy timeout (ms) */
  BUSY_TIMEOUT: 5000,
  /** Search timeout for Exa API (ms) */
  SEARCH_TIMEOUT: 30000,
} as const;

/**
 * Test timeouts (ms)
 */
export const TEST_TIMEOUTS = {
  /** Default test timeout */
  DEFAULT: 30000,
  /** Extended test timeout for slow operations */
  EXTENDED: 120000,
  /** Page load timeout in tests */
  PAGE_LOAD: 60000,
} as const;

/**
 * Experience calculation constants
 */
export const EXPERIENCE_CONSTANTS = {
  /** Average days in a year for experience calculation */
  DAYS_PER_YEAR: 365.25,
  /** Minimum word length for keyword overlap matching */
  MIN_WORD_LENGTH: 2,
} as const;
