/**
 * Jobs Router
 * Handles job listing operations
 *
 * SECURITY: Read operations are public (jobs are discoverable)
 * Mutations require authentication AND relationship verification
 * Users can only modify jobs they have applications for
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { JobSearchQuery } from '@job-applier/core';

/**
 * Verify that the current user has permission to modify a job
 * Users can only modify jobs they have applications for
 *
 * @throws TRPCError NOT_FOUND if job or profile doesn't exist
 * @throws TRPCError FORBIDDEN if user has no application for the job
 */
async function verifyJobAccess(
  ctx: {
    profileRepository: {
      getDefaultForUser: (userId: string) => { id: string; userId?: string | null } | null;
    };
    applicationRepository: {
      hasApplied: (profileId: string, jobId: string) => boolean;
    };
    jobRepository: {
      findById: (id: string) => Record<string, unknown> | null;
    };
    userId: string;
  },
  jobId: string
) {
  // Verify job exists
  const job = ctx.jobRepository.findById(jobId);
  if (!job) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Job not found',
    });
  }

  // Get user's profile
  const profile = ctx.profileRepository.getDefaultForUser(ctx.userId);
  if (!profile) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User profile not found. Please create a profile first.',
    });
  }

  // Check if user has applied to this job
  const hasApplied = ctx.applicationRepository.hasApplied(profile.id, jobId);
  if (!hasApplied) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You can only modify jobs you have applied to',
    });
  }

  return { job, profile };
}

/**
 * Jobs router for browsing and searching job listings
 *
 * SECURITY:
 * - Read operations (list, getById, search, countByPlatform) are public
 * - Write operations (updateStatus, delete) require authentication + job access
 */
export const jobsRouter = router({
  /**
   * List jobs with optional filters
   * PUBLIC: Jobs are discoverable by anyone
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.jobRepository.getRecent(input.limit);
    }),

  /**
   * Get job by ID
   * PUBLIC: Job details are viewable by anyone
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = ctx.jobRepository.findById(input.id);

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }

      return job;
    }),

  /**
   * Search jobs with filters
   * PUBLIC: Search is available to anyone
   */
  search: publicProcedure
    .input(
      z.object({
        keywords: z.array(z.string()).optional(),
        location: z.string().optional(),
        platforms: z.array(z.enum(['linkedin', 'indeed', 'company_site', 'other'])).optional(),
        employmentType: z.string().optional(),
        experienceLevel: z.string().optional(),
        remote: z.boolean().optional(),
        postedWithin: z.enum(['24h', '7d', '14d', '30d']).optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.jobRepository.search(input as Partial<JobSearchQuery>);
    }),

  /**
   * Get job counts by platform
   * PUBLIC: Statistics are viewable by anyone
   */
  countByPlatform: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.jobRepository.countByPlatform();
    }),

  /**
   * Update job status (for manual edits)
   * SECURITY: Requires authentication AND application for the job
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        updates: z.object({
          expiresAt: z.string().optional(),
          applicationDeadline: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to modify this job
      await verifyJobAccess(ctx, input.id);

      const updated = ctx.jobRepository.update(input.id, input.updates);

      if (!updated) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update job',
        });
      }

      return updated;
    }),

  /**
   * Delete a job
   * SECURITY: Requires authentication AND application for the job
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to delete this job
      await verifyJobAccess(ctx, input.id);

      const deleted = ctx.jobRepository.delete(input.id);

      if (!deleted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete job',
        });
      }

      return { success: true };
    }),
});
