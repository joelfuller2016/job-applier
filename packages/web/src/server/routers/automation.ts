/**
 * Automation Router
 * Handles automation control and status endpoints
 *
 * SECURITY: Session operations verify ownership
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, rateLimitedMutationProcedure } from '../trpc';

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

type AutomationSession = z.infer<typeof AutomationSessionSchema>;

const activeSessions: Map<string, AutomationSession> = new Map();

function getUserSession(userId: string): AutomationSession | null {
  for (const session of Array.from(activeSessions.values())) {
    if (session.userId === userId && session.status === 'active') {
      return session;
    }
  }
  return null;
}

function verifySessionOwnership(sessionId: string, userId: string): AutomationSession {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation session not found.' });
  }
  if (session.userId !== userId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this automation session.' });
  }
  return session;
}

export const automationRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const session = getUserSession(ctx.userId);
    if (!session) {
      return { state: 'idle' as const, progress: 0, totalJobs: 0, processedJobs: 0 };
    }
    return {
      state: 'running' as const,
      sessionId: session.id,
      progress: session.stats.applicationsSubmitted,
      totalJobs: session.config.maxApplicationsPerDay,
      processedJobs: session.stats.applicationsSubmitted,
    };
  }),

  getConfig: publicProcedure.query(async () => ({
    platforms: ['linkedin'] as ('linkedin' | 'indeed')[],
    searchQuery: '',
    maxApplicationsPerDay: 25,
    maxApplicationsPerHour: 5,
    headless: false,
    autoRetry: true,
  })),

  updateConfig: rateLimitedMutationProcedure
    .input(AutomationConfigSchema.partial())
    .mutation(async ({ ctx, input }) => {
      console.log(`User ${ctx.userId} updating config`);
      return { success: true, config: input };
    }),

  start: rateLimitedMutationProcedure
    .input(z.object({
      platforms: z.array(z.enum(['linkedin', 'indeed'])),
      searchQuery: z.string().optional(),
      maxApplications: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (getUserSession(ctx.userId)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Active session exists.' });
      }
      const sessionId = crypto.randomUUID();
      activeSessions.set(sessionId, {
        id: sessionId,
        userId: ctx.userId,
        startedAt: new Date().toISOString(),
        config: { ...input, maxApplicationsPerDay: input.maxApplications || 25, maxApplicationsPerHour: 5, headless: false, autoRetry: true },
        stats: { applicationsSubmitted: 0, applicationsSkipped: 0, errorsEncountered: 0 },
        status: 'active',
      });
      return { success: true, sessionId, message: 'Automation started' };
    }),

  stop: protectedProcedure
    .input(z.object({ sessionId: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const session = input?.sessionId 
        ? verifySessionOwnership(input.sessionId, ctx.userId)
        : getUserSession(ctx.userId);
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'No active session.' });
      session.status = 'stopped';
      session.endedAt = new Date().toISOString();
      return { success: true, message: 'Stopped' };
    }),

  pause: protectedProcedure
    .input(z.object({ sessionId: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const session = input?.sessionId 
        ? verifySessionOwnership(input.sessionId, ctx.userId)
        : getUserSession(ctx.userId);
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'No active session.' });
      return { success: true, message: 'Paused' };
    }),

  resume: protectedProcedure
    .input(z.object({ sessionId: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const session = input?.sessionId 
        ? verifySessionOwnership(input.sessionId, ctx.userId)
        : getUserSession(ctx.userId);
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'No active session.' });
      return { success: true, message: 'Resumed' };
    }),

  getSessions: protectedProcedure
    .input(z.object({ limit: z.number().default(10), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const userSessions = Array.from(activeSessions.values()).filter(s => s.userId === ctx.userId);
      return { sessions: userSessions.slice(input.offset, input.offset + input.limit), total: userSessions.length };
    }),

  getSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = activeSessions.get(input.id);
      if (!session) return null;
      if (session.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }
      return session;
    }),

  getLogs: protectedProcedure
    .input(z.object({ sessionId: z.string().optional(), limit: z.number().default(100) }))
    .query(async ({ ctx, input }) => {
      if (input.sessionId) verifySessionOwnership(input.sessionId, ctx.userId);
      return { logs: [], total: 0 };
    }),

  getRateLimitStatus: protectedProcedure.query(async () => ({
    dailyLimit: 25, dailyUsed: 0, dailyRemaining: 25,
    hourlyLimit: 5, hourlyUsed: 0, hourlyRemaining: 5,
    resetTime: new Date(Date.now() + 3600000).toISOString(),
  })),
});
