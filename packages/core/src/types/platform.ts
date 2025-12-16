import { z } from 'zod';
import { JobPlatform, JobPlatformSchema, JobListingSchema, JobSearchQuerySchema } from './job.js';
import { JobApplicationSchema, ApplicationSubmissionSchema } from './application.js';
import { UserProfileSchema } from './profile.js';

/**
 * Platform authentication status
 */
export const AuthStatusSchema = z.enum([
  'authenticated',
  'expired',
  'invalid',
  'not-configured',
  'rate-limited',
  'blocked',
]);

export type AuthStatus = z.infer<typeof AuthStatusSchema>;

/**
 * Platform credentials
 */
export const PlatformCredentialsSchema = z.object({
  platform: JobPlatformSchema,
  email: z.string().email().optional(),
  password: z.string().optional(),
  apiKey: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  cookies: z.array(z.object({
    name: z.string(),
    value: z.string(),
    domain: z.string(),
    path: z.string().optional(),
    expires: z.number().optional(),
    httpOnly: z.boolean().optional(),
    secure: z.boolean().optional(),
  })).optional(),
});

export type PlatformCredentials = z.infer<typeof PlatformCredentialsSchema>;

/**
 * Platform capability flags
 */
export const PlatformCapabilitiesSchema = z.object({
  jobSearch: z.boolean(),
  easyApply: z.boolean(),
  externalApply: z.boolean(),
  saveJob: z.boolean(),
  profileSync: z.boolean(),
  applicationTracking: z.boolean(),
  messaging: z.boolean(),
  companyResearch: z.boolean(),
  salaryInsights: z.boolean(),
});

export type PlatformCapabilities = z.infer<typeof PlatformCapabilitiesSchema>;

/**
 * Platform rate limiting info
 */
export const RateLimitInfoSchema = z.object({
  requestsPerMinute: z.number(),
  requestsPerHour: z.number(),
  requestsPerDay: z.number(),
  currentMinute: z.number().default(0),
  currentHour: z.number().default(0),
  currentDay: z.number().default(0),
  lastReset: z.string(),
  cooldownUntil: z.string().optional(),
});

export type RateLimitInfo = z.infer<typeof RateLimitInfoSchema>;

/**
 * Platform adapter configuration
 */
export const PlatformConfigSchema = z.object({
  platform: JobPlatformSchema,
  enabled: z.boolean(),
  credentials: PlatformCredentialsSchema.optional(),
  capabilities: PlatformCapabilitiesSchema,
  rateLimit: RateLimitInfoSchema,
  baseUrl: z.string().url(),
  selectors: z.record(z.string(), z.string()).optional(), // CSS selectors for automation
  customSettings: z.record(z.string(), z.unknown()).optional(),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

/**
 * Platform adapter interface
 */
export interface IPlatformAdapter {
  platform: JobPlatform;

  // Authentication
  authenticate(): Promise<AuthStatus>;
  checkAuthStatus(): Promise<AuthStatus>;
  logout(): Promise<void>;

  // Job operations
  searchJobs(query: z.infer<typeof JobSearchQuerySchema>): Promise<z.infer<typeof JobListingSchema>[]>;
  getJobDetails(jobId: string): Promise<z.infer<typeof JobListingSchema> | null>;
  saveJob(jobId: string): Promise<boolean>;

  // Application operations
  applyToJob(
    job: z.infer<typeof JobListingSchema>,
    profile: z.infer<typeof UserProfileSchema>,
    submission: z.infer<typeof ApplicationSubmissionSchema>
  ): Promise<z.infer<typeof JobApplicationSchema>>;

  getApplicationStatus(applicationId: string): Promise<z.infer<typeof JobApplicationSchema> | null>;

  // Profile operations
  syncProfile?(profile: z.infer<typeof UserProfileSchema>): Promise<boolean>;

  // Rate limiting
  checkRateLimit(): Promise<RateLimitInfo>;
  waitForRateLimit(): Promise<void>;
}

/**
 * Platform adapter factory result
 */
export const PlatformAdapterResultSchema = z.object({
  success: z.boolean(),
  platform: JobPlatformSchema,
  error: z.string().optional(),
  data: z.unknown().optional(),
});

export type PlatformAdapterResult = z.infer<typeof PlatformAdapterResultSchema>;

/**
 * Multi-platform operation result
 */
export const MultiPlatformResultSchema = z.object({
  results: z.array(PlatformAdapterResultSchema),
  successCount: z.number(),
  failureCount: z.number(),
  totalPlatforms: z.number(),
});

export type MultiPlatformResult = z.infer<typeof MultiPlatformResultSchema>;
