/**
 * Hunt Router
 * Handles job hunting orchestration
 * 
 * SECURITY FIX: Now uses database-backed sessions instead of in-memory Map
 * See: https://github.com/joelfuller2016/job-applier/issues/37
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, aiRateLimitedProcedure } from '../trpc';

/**
 * Hunt router for automated job hunting
 */
export const huntRouter = router({
  /**
   * Start a new job hunt
   * SECURITY: Requires authentication + AI rate limiting (10/min)
   * This endpoint uses Anthropic + Exa APIs which have per-request costs
   */
  startHunt: aiRateLimitedProcedure
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
      // Verify profile ownership
      const profile = ctx.profileRepository.findById(input.profileId);
      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.profileId} not found`,
        });
      }

      if (profile.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this profile',
        });
      }

      // Check for existing active hunt session
      const existingSession = ctx.sessionRepository.findActiveByUserAndType(ctx.userId, 'hunt');
      if (existingSession) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A hunt session is already running. Stop it first.',
        });
      }

      // Create session in database BEFORE starting long-running operation
      const session = ctx.sessionRepository.create({
        userId: ctx.userId,
        type: 'hunt',
        config: {
          profileId: input.profileId,
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
        totalItems: input.maxJobs,
      });

      // Start hunt with session tracking
      try {
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
            // Event callbacks with database persistence
            onProgress: (message: string) => {
              // Check for cancellation
              if (ctx.sessionRepository.isCancelRequested(session.id)) {
                throw new Error('Hunt cancelled by user');
              }
              // Log progress message (could be stored in session logs if needed)
              console.log(`[Hunt ${session.id}] ${message}`);
            },
            onJobDiscovered: () => {
              const currentSession = ctx.sessionRepository.findById(session.id);
              ctx.sessionRepository.update(session.id, {
                stats: {
                  ...currentSession?.stats,
                  jobsDiscovered: (currentSession?.stats.jobsDiscovered ?? 0) + 1,
                },
              });
            },
            onJobMatched: () => {
              const currentSession = ctx.sessionRepository.findById(session.id);
              ctx.sessionRepository.update(session.id, {
                stats: {
                  ...currentSession?.stats,
                  jobsMatched: (currentSession?.stats.jobsMatched ?? 0) + 1,
                },
              });
            },
            onApplicationComplete: () => {
              const currentSession = ctx.sessionRepository.findById(session.id);
              ctx.sessionRepository.update(session.id, {
                stats: {
                  ...currentSession?.stats,
                  applicationsSubmitted: (currentSession?.stats.applicationsSubmitted ?? 0) + 1,
                },
              });
            },
          }
        );

        // Mark session as completed
        ctx.sessionRepository.update(session.id, { status: 'completed' });
        ctx.sessionRepository.addLog(session.id, 'info', 'Hunt completed successfully');

        return {
          ...result,
          sessionId: session.id,
        };
      } catch (error) {
        // Mark session as error
        const errorMessage = error instanceof Error ? error.message : String(error);
        ctx.sessionRepository.update(session.id, {
          status: errorMessage.includes('cancelled') ? 'stopped' : 'error',
          errorMessage,
        });
        ctx.sessionRepository.addLog(session.id, 'error', errorMessage);
        throw error;
      }
    }),

  /**
   * Stop a running hunt
   * SECURITY: Requires authentication
   */
  stopHunt: protectedProcedure
    .input(z.object({ sessionId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Find session - either by ID or get active one
      const session = input.sessionId
        ? ctx.sessionRepository.findById(input.sessionId)
        : ctx.sessionRepository.findActiveByUserAndType(ctx.userId, 'hunt');

      if (!session) {
        return {
          success: false,
          message: 'No active hunt session found',
        };
      }

      // Verify ownership
      if (session.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this session',
        });
      }

      // Request cancellation
      ctx.sessionRepository.requestCancel(session.id);
      ctx.sessionRepository.update(session.id, { status: 'stopped' });

      return {
        success: true,
        message: 'Hunt stopped',
      };
    }),

  /**
   * Quick apply to a specific company/job
   * SECURITY: Requires authentication + AI rate limiting (10/min)
   * This endpoint uses Anthropic API which has per-request costs
   */
  quickApply: aiRateLimitedProcedure
    .input(
      z.object({
        profileId: z.string(),
        company: z.string(),
        jobTitle: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify profile ownership
      const profile = ctx.profileRepository.findById(input.profileId);
      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.profileId} not found`,
        });
      }

      if (profile.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this profile',
        });
      }

      const result = await ctx.orchestrator.quickApply(
        input.company,
        input.jobTitle,
        profile,
        {
          onProgress: () => {
            // Quick apply is fast, no need for detailed progress tracking
          },
        }
      );

      return result;
    }),

  /**
   * Get hunt status
   * SECURITY: Requires authentication
   */
  getHuntStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = ctx.sessionRepository.findById(input.sessionId);

      // Verify ownership
      if (!session || session.userId !== ctx.userId) {
        return {
          sessionId: input.sessionId,
          status: 'not_found' as const,
          message: 'Session not found or access denied',
        };
      }

      return {
        sessionId: session.id,
        status: session.status,
        progress: session.progress,
        totalItems: session.totalItems,
        processedItems: session.processedItems,
        currentTask: session.currentTask,
        stats: session.stats,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        errorMessage: session.errorMessage,
      };
    }),

  /**
   * Get recent hunt sessions
   * SECURITY: Requires authentication
   */
  getRecentHunts: protectedProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = ctx.sessionRepository.findByUser(ctx.userId, {
        type: 'hunt',
        limit: input.limit,
      });

      // Filter by profileId if provided
      const filtered = input.profileId
        ? sessions.filter(s => (s.config as { profileId?: string }).profileId === input.profileId)
        : sessions;

      return filtered.map(s => ({
        id: s.id,
        status: s.status,
        config: s.config,
        stats: s.stats,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        errorMessage: s.errorMessage,
      }));
    }),
});
