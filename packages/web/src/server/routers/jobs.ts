/**
 * Jobs Router
 * Handles job listing operations
 * 
 * SECURITY FIX: Mutations now use adminProcedure since jobs are shared resources
 * See: https://github.com/joelfuller2016/job-applier/issues/27
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { JobSearchQuery } from '@job-applier/core';

/**
 * Jobs router for browsing and searching job listings
 */
export const jobsRouter = router({
  /**
   * List jobs with optional filters
   * NOTE: Public - job listings are shared resources
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
   * NOTE: Public - job details are shared resources
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = ctx.jobRepository.findById(input.id);

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Job with ID ${input.id} not found`,
        });
      }

      return job;
    }),

  /**
   * Search jobs with filters
   * NOTE: Public - job search is available to all users
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
   * NOTE: Public - statistics are available to all users
   */
  countByPlatform: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.jobRepository.countByPlatform();
    }),

  /**
   * Update job status (for manual edits)
   * SECURITY: Requires ADMIN access - jobs are shared resources
   * Regular users should track applications via the applications router
   */
  updateStatus: adminProcedure
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
      const updated = ctx.jobRepository.update(input.id, input.updates);

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Job with ID ${input.id} not found`,
        });
      }

      return updated;
    }),

  /**
   * Delete a job
   * SECURITY: Requires ADMIN access - jobs are shared resources
   * Only administrators should be able to remove jobs from the system
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = ctx.jobRepository.delete(input.id);

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Job with ID ${input.id} not found`,
        });
      }

      return { success: true };
    }),
});
