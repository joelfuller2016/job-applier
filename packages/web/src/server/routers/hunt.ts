/**
 * Hunt Router
 * Handles job hunting orchestration
 * 
 * SECURITY: All mutations require authentication via protectedProcedure
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';

/**
 * Hunt router for automated job hunting
 */
export const huntRouter = router({
  /**
   * Start a new job hunt
   * SECURITY: Requires authentication - users can only hunt with their own profiles
   */
  startHunt: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        searchQuery: z.string(),
        maxJobs: z.number().min(1).max(50).default(10),
        matchThreshold: z.number().min(0).max(100).default(50),
        sources: z.array(z.enum(['exa', 'linkedin', 'indeed', 'company_site'])).optional(),
        includeCompanies: z.array(z.string()).optional(),
        excludeCompanies: z.array(z.string()).optional(),
        autoApply: z.boolean().default(false),
        requireConfirmation: z.boolean().default(true),
        dryRun: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const profile = ctx.profileRepository.findById(input.profileId);
      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.profileId} not found`,
        });
      }

      // SECURITY: Verify profile belongs to authenticated user
      if (profile.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to use this profile',
        });
      }

      // Start hunt (this will be long-running, consider making it async with status tracking)
      const result = await ctx.orchestrator.hunt(
        profile,
        {
          searchQuery: input.searchQuery,
          maxJobs: input.maxJobs,
          matchThreshold: input.matchThreshold,
          sources: input.sources,
          includeCompanies: input.includeCompanies,
          excludeCompanies: input.excludeCompanies,
          autoApply: input.autoApply,
          requireConfirmation: input.requireConfirmation,
          dryRun: input.dryRun,
        },
        {
          onProgress: (message) => {
            console.log(`[Hunt Progress] ${message}`);
            // TODO: Emit via WebSocket or store in database
          },
          onJobDiscovered: (job) => {
            console.log(`[Hunt] Discovered: ${job.title} at ${job.company}`);
          },
          onJobMatched: (job, score) => {
            console.log(`[Hunt] Matched: ${job.title} at ${job.company} (${score}%)`);
          },
          onApplicationComplete: (attempt) => {
            console.log(`[Hunt] Application: ${attempt.status} - ${attempt.jobTitle}`);
          },
        }
      );

      return result;
    }),

  /**
   * Quick apply to a specific company/job
   * SECURITY: Requires authentication - users can only apply with their own profiles
   */
  quickApply: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        company: z.string(),
        jobTitle: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const profile = ctx.profileRepository.findById(input.profileId);
      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.profileId} not found`,
        });
      }

      // SECURITY: Verify profile belongs to authenticated user
      if (profile.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to use this profile',
        });
      }

      const result = await ctx.orchestrator.quickApply(
        input.company,
        input.jobTitle,
        profile,
        {
          onProgress: (message) => {
            console.log(`[Quick Apply] ${message}`);
          },
        }
      );

      return result;
    }),

  /**
   * Get hunt status (placeholder for future WebSocket/polling implementation)
   */
  getHuntStatus: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      // TODO: Implement hunt status tracking
      // This would query a hunt sessions table or in-memory store
      return {
        sessionId: input.sessionId,
        status: 'unknown' as const,
        message: 'Hunt status tracking not yet implemented',
      };
    }),

  /**
   * Get recent hunt sessions
   */
  getRecentHunts: publicProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async () => {
      // TODO: Implement hunt history tracking
      // This would query a hunt sessions table
      return [];
    }),
});
