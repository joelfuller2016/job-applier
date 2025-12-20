/**
 * Hunt Router
 * Handles job hunting orchestration
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';

/**
 * Helper function to verify profile ownership
 * SECURITY: Throws FORBIDDEN if user doesn't own the profile
 */
function verifyProfileOwnership(
  profile: { userId?: string | null },
  userId: string,
  action: string = 'use'
) {
  if (!profile.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This profile has no owner and cannot be used for job hunting.',
    });
  }
  if (profile.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to use this profile',
    });
  }
}

// In-memory hunt session store (placeholder - in production use database)
const huntSessionStore = new Map<string, {
  id: string;
  userId: string;
  profileId: string;
  status: 'running' | 'stopped' | 'completed' | 'error';
  startedAt: string;
  endedAt?: string;
}>();

/**
 * Hunt router for automated job hunting
 */
export const huntRouter = router({
  /**
   * Start a new job hunt
   * SECURITY: Requires authentication and profile ownership
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

      // SECURITY: Verify the user owns this profile
      verifyProfileOwnership(profile, ctx.userId);

      // Create hunt session owned by the user
      const sessionId = crypto.randomUUID();
      huntSessionStore.set(sessionId, {
        id: sessionId,
        userId: ctx.userId,
        profileId: input.profileId,
        status: 'running',
        startedAt: new Date().toISOString(),
      });

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

      // Update session status
      const session = huntSessionStore.get(sessionId);
      if (session) {
        session.status = 'completed';
        session.endedAt = new Date().toISOString();
        huntSessionStore.set(sessionId, session);
      }

      return { ...result, sessionId };
    }),

  /**
   * Stop a running hunt
   * SECURITY: Requires authentication and hunt ownership
   */
  stopHunt: protectedProcedure
    .input(z.object({ huntId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = huntSessionStore.get(input.huntId);
      
      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Hunt session with ID ${input.huntId} not found`,
        });
      }
      
      // SECURITY: Verify the user owns this hunt session
      if (session.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to stop this hunt',
        });
      }
      
      // Update session status
      session.status = 'stopped';
      session.endedAt = new Date().toISOString();
      huntSessionStore.set(input.huntId, session);
      
      return { 
        success: true, 
        huntId: input.huntId, 
        status: 'stopped' 
      };
    }),

  /**
   * Quick apply to a specific company/job
   * SECURITY: Requires authentication and profile ownership
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

      // SECURITY: Verify the user owns this profile
      verifyProfileOwnership(profile, ctx.userId);

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
   * Get hunt status
   * SECURITY: Requires authentication and hunt ownership
   */
  getHuntStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = huntSessionStore.get(input.sessionId);
      
      if (!session) {
        return {
          sessionId: input.sessionId,
          status: 'not_found' as const,
          message: 'Hunt session not found',
        };
      }
      
      // SECURITY: Verify the user owns this hunt session
      if (session.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this hunt status',
        });
      }
      
      return {
        sessionId: input.sessionId,
        status: session.status,
        profileId: session.profileId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      };
    }),

  /**
   * Get recent hunt sessions for the authenticated user
   * SECURITY: Requires authentication, returns only user's hunts
   */
  getRecentHunts: protectedProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // SECURITY: Filter sessions by authenticated user
      let userSessions = Array.from(huntSessionStore.values())
        .filter(session => session.userId === ctx.userId);
      
      // Optionally filter by profile
      if (input.profileId) {
        userSessions = userSessions.filter(session => session.profileId === input.profileId);
      }
      
      // Sort by startedAt descending and limit
      return userSessions
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, input.limit);
    }),
});
