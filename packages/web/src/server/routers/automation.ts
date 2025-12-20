/**
 * Automation Router
 * Handles automation control and status endpoints
 * 
 * NOTE: Session storage is in-memory (ephemeral). For production:
 * - Move to database (PostgreSQL/Redis)
 * - Implement proper distributed locking
 * - Add persistent AbortController state
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

// Session TTL in milliseconds (24 hours)
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Types
const AutomationConfigSchema = z.object({
  platforms: z.array(z.enum(['linkedin', 'indeed'])),
  searchQuery: z.string().optional(),
  maxApplicationsPerDay: z.number().min(1).max(100).default(25),
  maxApplicationsPerHour: z.number().min(1).max(20).default(5),
  headless: z.boolean().default(false),
  autoRetry: z.boolean().default(true),
});

// Extended session type with AbortController
interface AutomationSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  config: z.infer<typeof AutomationConfigSchema>;
  stats: {
    applicationsSubmitted: number;
    applicationsSkipped: number;
    errorsEncountered: number;
  };
  status: 'active' | 'paused' | 'completed' | 'stopped' | 'error';
  abortController?: AbortController;
  createdAt: number; // For TTL cleanup
}

// In-memory session store (placeholder - in production use database)
const sessionStore = new Map<string, AutomationSession>();

/**
 * Cleanup expired sessions (called periodically)
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      // Abort if still running
      session.abortController?.abort();
      sessionStore.delete(sessionId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

/**
 * Helper function to get session with ownership verification
 * SECURITY: Returns null for both not-found and not-owned (prevents enumeration)
 */
function getOwnedSession(sessionId: string, userId: string): AutomationSession | null {
  const session = sessionStore.get(sessionId);
  if (!session || session.userId !== userId) {
    return null;
  }
  return session;
}

/**
 * Helper function to get session and throw if not owned
 * SECURITY: Uses unified error to prevent enumeration
 */
function requireOwnedSession(sessionId: string, userId: string): AutomationSession {
  const session = getOwnedSession(sessionId, userId);
  if (!session) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied',
    });
  }
  return session;
}

export const automationRouter = router({
  /**
   * Get current automation status for the authenticated user
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    // Find active session for user
    const activeSession = Array.from(sessionStore.values())
      .find(s => s.userId === ctx.userId && s.status === 'active');
    
    if (activeSession) {
      return {
        state: 'running' as const,
        currentTask: undefined,
        progress: activeSession.stats.applicationsSubmitted,
        totalJobs: activeSession.config.maxApplicationsPerDay,
        processedJobs: activeSession.stats.applicationsSubmitted,
      };
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
      // Check if user already has an active session
      const existingActive = Array.from(sessionStore.values())
        .find(s => s.userId === ctx.userId && (s.status === 'active' || s.status === 'paused'));
      
      if (existingActive) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have an active automation session. Stop it before starting a new one.',
        });
      }
      
      const sessionId = crypto.randomUUID();
      const abortController = new AbortController();
      
      // Create session owned by the authenticated user
      const session: AutomationSession = {
        id: sessionId,
        userId: ctx.userId,
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
        abortController,
        createdAt: Date.now(),
      };
      
      sessionStore.set(sessionId, session);
      
      // TODO: Start actual automation with abortController.signal
      // automationEngine.start(session.config, { signal: abortController.signal });
      
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
      const session = requireOwnedSession(input.sessionId, ctx.userId);
      
      // Actually stop the automation
      session.abortController?.abort();
      session.status = 'stopped';
      session.endedAt = new Date().toISOString();
      sessionStore.set(input.sessionId, session);
      
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
      const session = requireOwnedSession(input.sessionId, ctx.userId);
      
      if (session.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only pause an active automation',
        });
      }
      
      session.status = 'paused';
      sessionStore.set(input.sessionId, session);
      
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
      const session = requireOwnedSession(input.sessionId, ctx.userId);
      
      if (session.status !== 'paused') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only resume a paused automation',
        });
      }
      
      session.status = 'active';
      sessionStore.set(input.sessionId, session);
      
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
        .map(({ abortController, ...rest }) => rest) // Don't expose AbortController
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
   * SECURITY: Returns null for not-found/not-owned (prevents enumeration)
   */
  getSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = getOwnedSession(input.id, ctx.userId);
      if (!session) {
        return null;
      }
      // Don't expose AbortController
      const { abortController, ...rest } = session;
      return rest;
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
      // If sessionId provided, verify ownership (silently return empty if not owned)
      if (input.sessionId) {
        const session = getOwnedSession(input.sessionId, ctx.userId);
        if (!session) {
          return { logs: [], total: 0 };
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
