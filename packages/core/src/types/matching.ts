import { z } from 'zod';
import { JobListingSchema } from './job.js';
import { UserProfileSchema } from './profile.js';

/**
 * Skill match detail
 */
export const SkillMatchSchema = z.object({
  skill: z.string(),
  required: z.boolean(),
  userHas: z.boolean(),
  proficiencyMatch: z.enum(['exact', 'above', 'below', 'none']),
  weight: z.number().min(0).max(1),
});

export type SkillMatch = z.infer<typeof SkillMatchSchema>;

/**
 * Experience match detail
 */
export const ExperienceMatchSchema = z.object({
  requiredYears: z.number().optional(),
  userYears: z.number(),
  relevantRoles: z.array(z.string()),
  industryMatch: z.boolean(),
  seniorityMatch: z.enum(['exact', 'above', 'below']),
});

export type ExperienceMatch = z.infer<typeof ExperienceMatchSchema>;

/**
 * Location match detail
 */
export const LocationMatchSchema = z.object({
  jobLocation: z.string(),
  userLocation: z.string().optional(),
  remoteCompatible: z.boolean(),
  willingToRelocate: z.boolean(),
  distance: z.number().optional(), // Miles/km
  matchType: z.enum(['exact', 'remote', 'willing-to-relocate', 'nearby', 'no-match']),
});

export type LocationMatch = z.infer<typeof LocationMatchSchema>;

/**
 * Salary match detail
 */
export const SalaryMatchSchema = z.object({
  jobSalaryMin: z.number().optional(),
  jobSalaryMax: z.number().optional(),
  userExpectation: z.number().optional(),
  meetsMinimum: z.boolean(),
  percentageMatch: z.number().optional(), // How close to user expectation
});

export type SalaryMatch = z.infer<typeof SalaryMatchSchema>;

/**
 * Complete job-profile match analysis
 */
export const JobMatchSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  profileId: z.string().uuid(),

  // Overall score (0-100)
  overallScore: z.number().min(0).max(100),

  // Category scores
  skillScore: z.number().min(0).max(100),
  experienceScore: z.number().min(0).max(100),
  locationScore: z.number().min(0).max(100),
  salaryScore: z.number().min(0).max(100),

  // Detailed breakdowns
  skillMatches: z.array(SkillMatchSchema),
  experienceMatch: ExperienceMatchSchema,
  locationMatch: LocationMatchSchema,
  salaryMatch: SalaryMatchSchema.optional(),

  // AI analysis
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendations: z.array(z.string()),

  // Fit assessment
  fitCategory: z.enum(['excellent', 'good', 'moderate', 'stretch', 'unlikely']),
  confidence: z.number().min(0).max(1),

  // Application suggestions
  suggestedApproach: z.string().optional(),
  customizationTips: z.array(z.string()).optional(),

  // Timestamps
  analyzedAt: z.string(),
});

export type JobMatch = z.infer<typeof JobMatchSchema>;

/**
 * Batch matching request
 */
export const BatchMatchRequestSchema = z.object({
  profile: UserProfileSchema,
  jobs: z.array(JobListingSchema),
  options: z.object({
    minScore: z.number().min(0).max(100).default(50),
    maxResults: z.number().min(1).max(100).default(20),
    sortBy: z.enum(['score', 'salary', 'date', 'company']).default('score'),
    includeRecommendations: z.boolean().default(true),
  }).optional(),
});

export type BatchMatchRequest = z.infer<typeof BatchMatchRequestSchema>;

/**
 * Batch matching results
 */
export const BatchMatchResultsSchema = z.object({
  matches: z.array(JobMatchSchema),
  totalAnalyzed: z.number(),
  aboveThreshold: z.number(),
  averageScore: z.number(),
  topCategories: z.array(z.object({
    category: z.string(),
    count: z.number(),
    avgScore: z.number(),
  })),
  analyzedAt: z.string(),
  processingTime: z.number(), // milliseconds
});

export type BatchMatchResults = z.infer<typeof BatchMatchResultsSchema>;

/**
 * Match preferences for customization
 */
export const MatchPreferencesSchema = z.object({
  weights: z.object({
    skills: z.number().min(0).max(1).default(0.4),
    experience: z.number().min(0).max(1).default(0.3),
    location: z.number().min(0).max(1).default(0.15),
    salary: z.number().min(0).max(1).default(0.15),
  }),
  strictSkillMatching: z.boolean().default(false),
  includeStretchRoles: z.boolean().default(true),
  remoteBonus: z.number().min(0).max(20).default(10), // Bonus points for remote
});

export type MatchPreferences = z.infer<typeof MatchPreferencesSchema>;
