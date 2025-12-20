/**
 * Automation Router
 * Handles automation control and status endpoints
 * 
 * SECURITY FIX: Now uses database-backed sessions instead of in-memory Map
 * See: https://github.com/joelfuller2016/job-applier/issues/37
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';

// Types
const AutomationStatusSchema = z.object({
  state: z.enum(['idle', 'running', 'paused', 'error']),
  currentTask: z.string().optional(),
  progress: z.number().optional(),
  totalJobs: z.number().optional(),
  processedJobs: z.number().optional(),
  platform: z.enum(['linkedin', 'indeed', 'both']).optional(),
  startedAt: z.string().optional(),
  lastActivity: z.string().optional(),
});

const AutomationConfigSchema = z.object({
  platforms: z.array(z.enum(['linkedin', 'indeed'])),
  searchQuery: z.string().optional(),
  maxApplicationsPerDay: z.number().min(1).max(100).default(25),
  maxApplicationsPerHour: z.number().min(1).max(20).default(5),
  headless: z.boolean().default(false),
  autoRetry: z.boolean().default(true),
});

const AutomationSessionSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  config: AutomationConfigSchema,
  stats: z.object({
    applicationsSubmitted: z.number(),
    applicationsSkipped: z.number(),
    errorsEncountered: z.number(),
  }),
  status: z.enum(['active', 'completed', 'stopped', 'error']),
});

export const automationRouter = router({
  /**
   * Get current automation status
   */
  getStatus: publicProcedure.query(async ({ ctx }) => {
    // Check for active session in database
    if (ctx.userId && ctx.sessionRepository) {
      const activeSession = ctx.sessionRepository.findActiveByUserAndType(ctx.userId, 'automation');
      if (activeSession) {
        return {
          state: activeSession.status === 'paused' ? 'paused' as const : 'running' as const,
          currentTask: activeSession.currentTask,
          progress: activeSession.progress,
          totalJobs: activeSession.totalItems,
          processedJobs: activeSession.processedItems,
          startedAt: activeSession.startedAt,
          lastActivity: activeSession.lastActivityAt,
        };
      }
    }
    
    return {
      state: 'idle' as const,
      currentTask: undefined,
      progress: 0,
      totalJobs: 0,
      processedJobs: 0,
    };
  }),

  /**
   * Get automation configuration
   * SECURITY: Requires authentication
   */
  getConfig: protectedProcedure.query(async () => {
    // In a real implementation, this would read from config/database
    return {
      platforms: ['linkedin'] as ('linkedin' | 'indeed')[],
      searchQuery: '',
      maxApplicationsPerDay: 25,
      maxApplicationsPerHour: 5,
      headless: false,
      autoRetry: true,
    };
  }),

  /**
   * Update automation configuration
   * SECURITY: Requires authentication
   */
  updateConfig: protectedProcedure
    .input(AutomationConfigSchema.partial())
    .mutation(async ({ input }) => {
      // In a real implementation, this would save to config/database
      return { success: true, config: input };
    }),

  /**
   * Start automation
   * SECURITY: Requires authentication
   */
  start: protectedProcedure
    .input(
      z.object({
        platforms: z.array(z.enum(['linkedin', 'indeed'])),
        searchQuery: z.string().optional(),
        maxApplications: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing active session
      const existingSession = ctx.sessionRepository.findActiveByUserAndType(ctx.userId, 'automation');
      if (existingSession) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An automation session is already running. Stop it first.',
        });
      }

      // Create new session in database
      const session = ctx.sessionRepository.create({
        userId: ctx.userId,
        type: 'automation',
        config: {
          platforms: input.platforms,
          searchQuery: input.searchQuery,
          maxApplications: input.maxApplications,
        },
        totalItems: input.maxApplications ?? 25,
      });

      return {
        success: true,
        sessionId: session.id,
        message: 'Automation started',
      };
    }),

  /**
   * Stop automation
   * SECURITY: Requires authentication
   */
  stop: protectedProcedure.mutation(async ({ ctx }) => {
    const session = ctx.sessionRepository.findActiveByUserAndType(ctx.userId, 'automation');
    if (!session) {
      return {
        success: false,
        message: 'No active automation session found',
      };
    }

    // Request cancellation (polling-based)
    ctx.sessionRepository.requestCancel(session.id);
    ctx.sessionRepository.update(session.id, { status: 'stopped' });

    return {
      success: true,
      message: 'Automation stopped',
    };
  }),

  /**
   * Pause automation
   * SECURITY: Requires authentication
   */
  pause: protectedProcedure.mutation(async ({ ctx }) => {
    const session = ctx.sessionRepository.findActiveByUserAndType(ctx.userId, 'automation');
    if (!session) {
      return {
        success: false,
        message: 'No active automation session found',
      };
    }

    ctx.sessionRepository.update(session.id, { status: 'paused' });

    return {
      success: true,
      message: 'Automation paused',
    };
  }),

  /**
   * Resume automation
   * SECURITY: Requires authentication
   */
  resume: protectedProcedure.mutation(async ({ ctx }) => {
    const session = ctx.sessionRepository.findActiveByUserAndType(ctx.userId, 'automation');
    if (!session || session.status !== 'paused') {
      return {
        success: false,
        message: 'No paused automation session found',
      };
    }

    ctx.sessionRepository.update(session.id, { status: 'active' });

    return {
      success: true,
      message: 'Automation resumed',
    };
  }),

  /**
   * Get automation history/sessions
   * SECURITY: Requires authentication
   */
  getSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = ctx.sessionRepository.findByUser(ctx.userId, {
        type: 'automation',
        limit: input.limit,
        offset: input.offset,
      });

      return {
        sessions: sessions.map(s => ({
          id: s.id,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          config: s.config,
          stats: {
            applicationsSubmitted: s.stats.applicationsSubmitted ?? 0,
            applicationsSkipped: s.stats.applicationsSkipped ?? 0,
            errorsEncountered: s.stats.errorsEncountered ?? 0,
          },
          status: s.status,
        })),
        total: sessions.length,
      };
    }),

  /**
   * Get session by ID
   * SECURITY: Requires authentication
   */
  getSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = ctx.sessionRepository.findById(input.id);
      
      // Verify ownership
      if (!session || session.userId !== ctx.userId) {
        return null;
      }

      return {
        id: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        config: session.config,
        stats: {
          applicationsSubmitted: session.stats.applicationsSubmitted ?? 0,
          applicationsSkipped: session.stats.applicationsSkipped ?? 0,
          errorsEncountered: session.stats.errorsEncountered ?? 0,
        },
        status: session.status,
      };
    }),

  /**
   * Get automation logs
   * SECURITY: Requires authentication
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        level: z.enum(['info', 'warn', 'error', 'debug']).optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.sessionId) {
        return { logs: [], total: 0 };
      }

      // Verify session ownership
      const session = ctx.sessionRepository.findById(input.sessionId);
      if (!session || session.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this session',
        });
      }

      const logs = ctx.sessionRepository.getLogs(input.sessionId, {
        level: input.level,
        limit: input.limit,
        offset: input.offset,
      });

      return {
        logs: logs.map(l => ({
          id: l.id,
          timestamp: l.timestamp,
          level: l.level,
          message: l.message,
          context: l.context,
        })),
        total: logs.length,
      };
    }),

  /**
   * Get rate limit status
   */
  getRateLimitStatus: publicProcedure.query(async () => {
    // In a real implementation, this would check rate limits
    return {
      dailyLimit: 25,
      dailyUsed: 0,
      dailyRemaining: 25,
      hourlyLimit: 5,
      hourlyUsed: 0,
      hourlyRemaining: 5,
      resetTime: new Date(Date.now() + 3600000).toISOString(),
    };
  }),
});
