/**
 * Hunt Router
 * Handles job hunting orchestration
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

/**
 * Helper function to verify profile ownership
 * SECURITY: Throws FORBIDDEN if user doesn't own the profile
 */
function verifyProfileOwnership(
  profile: { userId?: string | null },
  userId: string
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

// Extended hunt session type with AbortController
interface HuntSession {
  id: string;
  userId: string;
  profileId: string;
  status: 'running' | 'stopped' | 'completed' | 'error';
  startedAt: string;
  endedAt?: string;
  error?: string;
  abortController?: AbortController;
  createdAt: number; // For TTL cleanup
}

// In-memory hunt session store (placeholder - in production use database)
const huntSessionStore = new Map<string, HuntSession>();

/**
 * Cleanup expired sessions (called periodically)
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of huntSessionStore.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      // Abort if still running
      session.abortController?.abort();
      huntSessionStore.delete(sessionId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

/**
 * Helper function to get session with ownership verification
 * SECURITY: Returns null for both not-found and not-owned (prevents enumeration)
 */
function getOwnedSession(sessionId: string, userId: string): HuntSession | null {
  const session = huntSessionStore.get(sessionId);
  if (!session || session.userId !== userId) {
    return null;
  }
  return session;
}

/**
 * Helper function to get session and throw if not owned
 * SECURITY: Uses unified error to prevent enumeration
 */
function requireOwnedSession(sessionId: string, userId: string): HuntSession {
  const session = getOwnedSession(sessionId, userId);
  if (!session) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied',
    });
  }
  return session;
}

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
          code: 'FORBIDDEN',
          message: 'Access denied', // Unified error prevents profile enumeration
        });
      }

      // SECURITY: Verify the user owns this profile
      verifyProfileOwnership(profile, ctx.userId);

      // Check if user already has a running hunt
      const existingRunning = Array.from(huntSessionStore.values())
        .find(s => s.userId === ctx.userId && s.status === 'running');
      
      if (existingRunning) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have a running hunt. Stop it before starting a new one.',
        });
      }

      // Create hunt session owned by the user
      const sessionId = crypto.randomUUID();
      const abortController = new AbortController();
      
      const session: HuntSession = {
        id: sessionId,
        userId: ctx.userId,
        profileId: input.profileId,
        status: 'running',
        startedAt: new Date().toISOString(),
        abortController,
        createdAt: Date.now(),
      };
      
      huntSessionStore.set(sessionId, session);

      try {
        // Start hunt with abort signal for cancellation
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
            signal: abortController.signal, // Pass signal for cancellation
            onProgress: (message) => {
              console.log(`[Hunt Progress] ${message}`);
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

        // Update session status on success
        session.status = 'completed';
        session.endedAt = new Date().toISOString();
        huntSessionStore.set(sessionId, session);

        return { ...result, sessionId };
      } catch (error) {
        // Update session status on error
        session.status = 'error';
        session.endedAt = new Date().toISOString();
        session.error = error instanceof Error ? error.message : 'Unknown error';
        huntSessionStore.set(sessionId, session);
        
        // Re-throw for client handling
        throw error;
      }
    }),

  /**
   * Stop a running hunt
   * SECURITY: Requires authentication and hunt ownership
   */
  stopHunt: protectedProcedure
    .input(z.object({ huntId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Unified error prevents enumeration
      const session = requireOwnedSession(input.huntId, ctx.userId);
      
      // Actually cancel the running hunt
      session.abortController?.abort();
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
          code: 'FORBIDDEN',
          message: 'Access denied', // Unified error prevents profile enumeration
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
   * SECURITY: Requires authentication, returns null for not-owned (prevents enumeration)
   */
  getHuntStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = getOwnedSession(input.sessionId, ctx.userId);
      
      if (!session) {
        // Return not_found status instead of throwing (consistent UX)
        // But don't reveal whether session exists
        return {
          sessionId: input.sessionId,
          status: 'not_found' as const,
          message: 'Session not found or access denied',
        };
      }
      
      return {
        sessionId: input.sessionId,
        status: session.status,
        profileId: session.profileId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        error: session.error,
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
      
      // Sort by startedAt descending, limit, and remove AbortController
      return userSessions
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, input.limit)
        .map(({ abortController, ...rest }) => rest);
    }),
});
