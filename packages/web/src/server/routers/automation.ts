/**
 * Automation Router
 * Handles automation control and status endpoints
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
  userId: z.string(),
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

/**
 * Helper function to verify session ownership
 * SECURITY: Throws FORBIDDEN if user doesn't own the session
 */
async function verifySessionOwnership(
  sessionId: string,
  userId: string,
  getSessionFn: (id: string) => Promise<{ userId?: string | null } | null>
): Promise<void> {
  const session = await getSessionFn(sessionId);
  
  if (!session) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Session with ID ${sessionId} not found`,
    });
  }
  
  if (!session.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This session has no owner and cannot be controlled.',
    });
  }
  
  if (session.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to control this automation session',
    });
  }
}

// In-memory session store (placeholder - in production use database)
const sessionStore = new Map<string, z.infer<typeof AutomationSessionSchema>>();

// Helper to get session from store
async function getSessionFromStore(sessionId: string) {
  return sessionStore.get(sessionId) || null;
}

export const automationRouter = router({
  /**
   * Get current automation status for the authenticated user
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    // In a real implementation, this would query the automation engine
    // filtered by ctx.userId
    return {
      state: 'idle' as const,
      currentTask: undefined,
      progress: 0,
      totalJobs: 0,
      processedJobs: 0,
    };
  }),

  /**
   * Get automation configuration for the authenticated user
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    // In a real implementation, this would read from config/database
    // filtered by ctx.userId
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
   * SECURITY: Requires authentication, config is user-scoped
   */
  updateConfig: protectedProcedure
    .input(AutomationConfigSchema.partial())
    .mutation(async ({ ctx, input }) => {
      // In a real implementation, this would save to config/database
      // scoped to ctx.userId
      return { success: true, config: input };
    }),

  /**
   * Start automation
   * SECURITY: Requires authentication, creates session owned by user
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
      const sessionId = crypto.randomUUID();
      
      // Create session owned by the authenticated user
      const session: z.infer<typeof AutomationSessionSchema> = {
        id: sessionId,
        userId: ctx.userId, // SECURITY: Session is owned by authenticated user
        startedAt: new Date().toISOString(),
        config: {
          platforms: input.platforms,
          searchQuery: input.searchQuery,
          maxApplicationsPerDay: input.maxApplications || 25,
          maxApplicationsPerHour: 5,
          headless: false,
          autoRetry: true,
        },
        stats: {
          applicationsSubmitted: 0,
          applicationsSkipped: 0,
          errorsEncountered: 0,
        },
        status: 'active',
      };
      
      sessionStore.set(sessionId, session);
      
      return {
        success: true,
        sessionId,
        message: 'Automation started',
      };
    }),

  /**
   * Stop automation
   * SECURITY: Requires authentication and session ownership
   */
  stop: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Verify user owns this session
      await verifySessionOwnership(input.sessionId, ctx.userId, getSessionFromStore);
      
      // Update session status
      const session = sessionStore.get(input.sessionId);
      if (session) {
        session.status = 'stopped';
        session.endedAt = new Date().toISOString();
        sessionStore.set(input.sessionId, session);
      }
      
      return {
        success: true,
        message: 'Automation stopped',
      };
    }),

  /**
   * Pause automation
   * SECURITY: Requires authentication and session ownership
   */
  pause: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Verify user owns this session
      await verifySessionOwnership(input.sessionId, ctx.userId, getSessionFromStore);
      
      return {
        success: true,
        message: 'Automation paused',
      };
    }),

  /**
   * Resume automation
   * SECURITY: Requires authentication and session ownership
   */
  resume: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Verify user owns this session
      await verifySessionOwnership(input.sessionId, ctx.userId, getSessionFromStore);
      
      return {
        success: true,
        message: 'Automation resumed',
      };
    }),

  /**
   * Get automation history/sessions for the authenticated user
   * SECURITY: Requires authentication, returns only user's sessions
   */
  getSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // SECURITY: Filter sessions by authenticated user
      const userSessions = Array.from(sessionStore.values())
        .filter(session => session.userId === ctx.userId)
        .slice(input.offset, input.offset + input.limit);
      
      const totalUserSessions = Array.from(sessionStore.values())
        .filter(session => session.userId === ctx.userId).length;
      
      return {
        sessions: userSessions,
        total: totalUserSessions,
      };
    }),

  /**
   * Get session by ID
   * SECURITY: Requires authentication and session ownership
   */
  getSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = sessionStore.get(input.id);
      
      if (!session) {
        return null;
      }
      
      // SECURITY: Verify user owns this session
      if (session.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this session',
        });
      }
      
      return session;
    }),

  /**
   * Get automation logs
   * SECURITY: Requires authentication, returns only user's logs
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
      // If sessionId provided, verify ownership
      if (input.sessionId) {
        const session = sessionStore.get(input.sessionId);
        if (session && session.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view logs for this session',
          });
        }
      }
      
      // In a real implementation, this would query logs from storage
      // filtered by ctx.userId and optionally input.sessionId
      return {
        logs: [] as Array<{
          id: string;
          timestamp: string;
          level: 'info' | 'warn' | 'error' | 'debug';
          message: string;
          context?: Record<string, unknown>;
        }>,
        total: 0,
      };
    }),

  /**
   * Get rate limit status for the authenticated user
   * SECURITY: Requires authentication, returns user's rate limits
   */
  getRateLimitStatus: protectedProcedure.query(async ({ ctx }) => {
    // In a real implementation, this would check rate limits for ctx.userId
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
