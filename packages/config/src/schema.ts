import { z } from 'zod';

/**
 * Claude API configuration schema
 */
export const ClaudeConfigSchema = z.object({
  apiKey: z.string().min(1, 'Claude API key is required'),
  model: z.string().default('claude-sonnet-4-20250514'),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(1).default(0.7),
});

export type ClaudeConfig = z.infer<typeof ClaudeConfigSchema>;

/**
 * Exa API configuration schema
 */
export const ExaConfigSchema = z.object({
  apiKey: z.string().min(1, 'Exa API key is required'),
  maxResults: z.number().int().positive().default(100),
  searchTimeout: z.number().int().positive().default(30000),
});

export type ExaConfig = z.infer<typeof ExaConfigSchema>;

/**
 * Database configuration schema
 */
export const DatabaseConfigSchema = z.object({
  path: z.string().min(1, 'Database path is required'),
  walMode: z.boolean().default(true),
  busyTimeout: z.number().int().positive().default(5000),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

/**
 * Browser automation configuration schema
 */
export const BrowserConfigSchema = z.object({
  headless: z.boolean().default(true),
  slowMo: z.number().int().min(0).default(0),
  timeout: z.number().int().positive().default(30000),
  userAgent: z.string().optional(),
  viewport: z.object({
    width: z.number().int().positive().default(1920),
    height: z.number().int().positive().default(1080),
  }).default({}),
  downloadPath: z.string().optional(),
});

export type BrowserConfig = z.infer<typeof BrowserConfigSchema>;

/**
 * Rate limiting configuration schema
 */
export const RateLimitConfigSchema = z.object({
  maxApplicationsPerDay: z.number().int().positive().default(50),
  maxApplicationsPerHour: z.number().int().positive().default(10),
  minDelayBetweenActions: z.number().int().min(0).default(2000),
  maxDelayBetweenActions: z.number().int().min(0).default(5000),
  pauseAfterApplications: z.number().int().positive().default(5),
  pauseDuration: z.number().int().positive().default(60000),
});

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

/**
 * Platform-specific configuration schema
 */
export const PlatformConfigSchema = z.object({
  linkedin: z.object({
    enabled: z.boolean().default(true),
    email: z.string().email().optional(),
    password: z.string().optional(),
    useEasyApply: z.boolean().default(true),
  }).default({}),
  indeed: z.object({
    enabled: z.boolean().default(true),
    email: z.string().email().optional(),
    password: z.string().optional(),
  }).default({}),
  glassdoor: z.object({
    enabled: z.boolean().default(false),
    email: z.string().email().optional(),
    password: z.string().optional(),
  }).default({}),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

/**
 * Logging configuration schema
 */
export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  file: z.string().optional(),
  console: z.boolean().default(true),
  timestamps: z.boolean().default(true),
});

export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;

/**
 * Application preferences schema
 */
export const ApplicationPreferencesSchema = z.object({
  defaultKeywords: z.string().default(''),
  defaultLocation: z.string().default(''),
  minMatchScore: z.number().min(0).max(100).default(70),
  autoApply: z.boolean().default(false),
  requireReview: z.boolean().default(true),
  skipAppliedJobs: z.boolean().default(true),
  coverLetterStyle: z.enum(['professional', 'casual', 'technical']).default('professional'),
  customizePerJob: z.boolean().default(true),
});

export type ApplicationPreferences = z.infer<typeof ApplicationPreferencesSchema>;

/**
 * Complete application configuration schema
 */
export const AppConfigSchema = z.object({
  claude: ClaudeConfigSchema,
  exa: ExaConfigSchema,
  database: DatabaseConfigSchema,
  browser: BrowserConfigSchema.default({}),
  rateLimit: RateLimitConfigSchema.default({}),
  platforms: PlatformConfigSchema.default({}),
  logging: LoggingConfigSchema.default({}),
  preferences: ApplicationPreferencesSchema.default({}),
  dataDir: z.string().default('./data'),
  environment: z.enum(['development', 'production', 'test']).default('development'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Environment variables schema for loading from .env
 */
export const EnvSchema = z.object({
  // Required API keys
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  EXA_API_KEY: z.string().min(1, 'EXA_API_KEY is required'),

  // Database
  DATABASE_PATH: z.string().default('./data/job-applier.db'),

  // Claude settings
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-20250514'),
  CLAUDE_MAX_TOKENS: z.string().transform(Number).default('4096'),
  CLAUDE_TEMPERATURE: z.string().transform(Number).default('0.7'),

  // Exa settings
  EXA_MAX_RESULTS: z.string().transform(Number).default('100'),

  // Browser settings
  BROWSER_HEADLESS: z.string().transform(v => v === 'true').default('true'),
  BROWSER_SLOW_MO: z.string().transform(Number).default('0'),
  BROWSER_TIMEOUT: z.string().transform(Number).default('30000'),

  // Rate limits
  MAX_APPLICATIONS_PER_DAY: z.string().transform(Number).default('50'),
  MAX_APPLICATIONS_PER_HOUR: z.string().transform(Number).default('10'),
  MIN_DELAY_BETWEEN_ACTIONS: z.string().transform(Number).default('2000'),
  MAX_DELAY_BETWEEN_ACTIONS: z.string().transform(Number).default('5000'),

  // Platform credentials (optional)
  LINKEDIN_EMAIL: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email().optional()
  ),
  LINKEDIN_PASSWORD: z.string().optional(),
  INDEED_EMAIL: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email().optional()
  ),
  INDEED_PASSWORD: z.string().optional(),

  // Application settings
  MIN_MATCH_SCORE: z.string().transform(Number).default('70'),
  AUTO_APPLY: z.string().transform(v => v === 'true').default('false'),
  REQUIRE_REVIEW: z.string().transform(v => v === 'true').default('true'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FILE: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATA_DIR: z.string().default('./data'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
