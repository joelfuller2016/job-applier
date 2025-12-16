import { z } from 'zod';
import { JobPlatformSchema } from './job.js';

/**
 * Application status
 */
export const ApplicationStatusSchema = z.enum([
  'draft',           // Application prepared but not submitted
  'submitted',       // Application submitted
  'viewed',          // Application viewed by employer
  'in-review',       // Under review
  'interview',       // Interview scheduled/completed
  'offer',           // Offer received
  'rejected',        // Application rejected
  'withdrawn',       // Application withdrawn by user
  'expired',         // Job posting expired
  'error',           // Error during application
]);

export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

/**
 * Application method used
 */
export const ApplicationMethodSchema = z.enum([
  'easy-apply',      // Platform's quick apply
  'external',        // Redirected to company site
  'direct',          // Direct application on company site
  'email',           // Email application
  'referral',        // Through a referral
]);

export type ApplicationMethod = z.infer<typeof ApplicationMethodSchema>;

/**
 * Cover letter data
 */
export const CoverLetterSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  tone: z.enum(['formal', 'conversational', 'enthusiastic']),
  customizations: z.object({
    companySpecific: z.array(z.string()),
    roleSpecific: z.array(z.string()),
    skillHighlights: z.array(z.string()),
  }),
  generatedAt: z.string(),
  editedAt: z.string().optional(),
  version: z.number().default(1),
});

export type CoverLetter = z.infer<typeof CoverLetterSchema>;

/**
 * Application form field
 */
export const FormFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'file', 'date', 'number', 'email', 'phone', 'url']),
  label: z.string(),
  value: z.union([z.string(), z.boolean(), z.number(), z.array(z.string())]).optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

export type FormField = z.infer<typeof FormFieldSchema>;

/**
 * Application submission data
 */
export const ApplicationSubmissionSchema = z.object({
  formFields: z.array(FormFieldSchema),
  resumeUsed: z.string(), // Path or ID
  coverLetterUsed: z.string().optional(), // Cover letter ID
  additionalDocuments: z.array(z.object({
    name: z.string(),
    path: z.string(),
    type: z.string(),
  })).optional(),
  answers: z.record(z.string(), z.union([z.string(), z.boolean(), z.number(), z.array(z.string())])),
});

export type ApplicationSubmission = z.infer<typeof ApplicationSubmissionSchema>;

/**
 * Application event/activity log entry
 */
export const ApplicationEventSchema = z.object({
  id: z.string().uuid(),
  applicationId: z.string().uuid(),
  type: z.enum([
    'created',
    'submitted',
    'status-change',
    'response-received',
    'interview-scheduled',
    'follow-up-sent',
    'note-added',
    'error',
  ]),
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
});

export type ApplicationEvent = z.infer<typeof ApplicationEventSchema>;

/**
 * Complete job application record
 */
export const JobApplicationSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  jobId: z.string().uuid(),

  // Status tracking
  status: ApplicationStatusSchema,
  method: ApplicationMethodSchema,

  // Application content
  coverLetter: CoverLetterSchema.optional(),
  submission: ApplicationSubmissionSchema.optional(),

  // Platform info
  platform: JobPlatformSchema,
  platformApplicationId: z.string().optional(),

  // Match info
  matchScore: z.number().min(0).max(100).optional(),
  matchReasons: z.array(z.string()).optional(),

  // Response tracking
  responseReceived: z.boolean().default(false),
  responseDate: z.string().optional(),
  responseDetails: z.string().optional(),

  // Follow-up
  followUpDates: z.array(z.string()).optional(),
  nextFollowUp: z.string().optional(),

  // Notes
  notes: z.string().optional(),

  // Timestamps
  appliedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),

  // Activity history
  events: z.array(ApplicationEventSchema).optional(),
});

export type JobApplication = z.infer<typeof JobApplicationSchema>;

/**
 * Application statistics
 */
export const ApplicationStatsSchema = z.object({
  total: z.number(),
  byStatus: z.record(ApplicationStatusSchema, z.number()),
  byPlatform: z.record(JobPlatformSchema, z.number()),
  byDate: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  responseRate: z.number(),
  interviewRate: z.number(),
  averageResponseTime: z.number().optional(), // In days
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export type ApplicationStats = z.infer<typeof ApplicationStatsSchema>;
