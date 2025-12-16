import { z } from 'zod';

/**
 * Job platform identifiers
 */
export const JobPlatformSchema = z.enum([
  'linkedin',
  'indeed',
  'glassdoor',
  'ziprecruiter',
  'monster',
  'dice',
  'angellist',
  'wellfound',
  'builtin',
  'levels-fyi',
  'company-website',
  'other',
]);

export type JobPlatform = z.infer<typeof JobPlatformSchema>;

/**
 * Employment type
 */
export const EmploymentTypeSchema = z.enum([
  'full-time',
  'part-time',
  'contract',
  'temporary',
  'internship',
  'freelance',
]);

export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

/**
 * Experience level required
 */
export const ExperienceLevelSchema = z.enum([
  'entry',
  'mid',
  'senior',
  'lead',
  'manager',
  'director',
  'executive',
]);

export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

/**
 * Work arrangement type
 */
export const WorkArrangementSchema = z.enum([
  'remote',
  'hybrid',
  'onsite',
]);

export type WorkArrangement = z.infer<typeof WorkArrangementSchema>;

/**
 * Salary information
 */
export const SalaryInfoSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string().default('USD'),
  period: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']).default('yearly'),
  isEstimate: z.boolean().default(false),
});

export type SalaryInfo = z.infer<typeof SalaryInfoSchema>;

/**
 * Company information
 */
export const CompanyInfoSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+']).optional(),
  description: z.string().optional(),
  glassdoorRating: z.number().min(0).max(5).optional(),
  linkedinUrl: z.string().url().optional(),
});

export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;

/**
 * Job listing from any platform
 */
export const JobListingSchema = z.object({
  id: z.string().uuid(),
  externalId: z.string(), // Platform-specific ID
  platform: JobPlatformSchema,

  // Basic info
  title: z.string().min(1),
  company: CompanyInfoSchema,
  location: z.string(),

  // Job details
  description: z.string(),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()).optional(),
  qualifications: z.object({
    required: z.array(z.string()),
    preferred: z.array(z.string()),
  }).optional(),

  // Classification
  employmentType: EmploymentTypeSchema.optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
  workArrangement: WorkArrangementSchema.optional(),

  // Compensation
  salary: SalaryInfoSchema.optional(),
  benefits: z.array(z.string()).optional(),

  // Skills
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()).optional(),

  // URLs
  url: z.string().url(),
  applyUrl: z.string().url().optional(),

  // Metadata
  postedAt: z.string().optional(), // ISO timestamp
  expiresAt: z.string().optional(),
  discoveredAt: z.string(), // When we found it
  updatedAt: z.string(),

  // Application info
  easyApply: z.boolean().default(false),
  applicationDeadline: z.string().optional(),
  applicantCount: z.number().optional(),
});

export type JobListing = z.infer<typeof JobListingSchema>;

/**
 * Job search query parameters
 */
export const JobSearchQuerySchema = z.object({
  keywords: z.array(z.string()),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  employmentType: EmploymentTypeSchema.optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  postedWithin: z.enum(['24h', '7d', '14d', '30d']).optional(),
  platforms: z.array(JobPlatformSchema).optional(),
  excludeCompanies: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
});

export type JobSearchQuery = z.infer<typeof JobSearchQuerySchema>;

/**
 * Job search results
 */
export const JobSearchResultsSchema = z.object({
  query: JobSearchQuerySchema,
  jobs: z.array(JobListingSchema),
  totalResults: z.number(),
  page: z.number(),
  hasMore: z.boolean(),
  searchedAt: z.string(),
});

export type JobSearchResults = z.infer<typeof JobSearchResultsSchema>;
