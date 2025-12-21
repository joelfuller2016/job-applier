/**
 * tRPC Initialization
 * Core tRPC setup with context, middleware, authentication, and rate limiting
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from '../lib/trpc/server';
import { ANONYMOUS_USER_ID, LEGACY_DEFAULT_USER_ID } from '../lib/constants';

/**
 * Rate Limiter Implementation
 * Sliding window rate limiter with automatic cleanup
 *
 * NOTE: This is an in-memory implementation suitable for single-instance deployments.
 * For horizontal scaling, replace with Redis-based implementation.
 */
class RateLimiter {
  private requests: Map<string, { count: number; windowStart: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly windowMs: number = 60000,
    private readonly maxRequests: number = 60
  ) {
    // Cleanup stale entries every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    // Ensure cleanup interval does not prevent process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now - record.windowStart >= this.windowMs) {
      this.requests.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.windowStart + this.windowMs,
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: record.windowStart + this.windowMs,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of Array.from(this.requests.entries())) {
      if (now - record.windowStart >= this.windowMs * 2) {
        this.requests.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Rate limiters for different endpoint categories
const generalRateLimiter = new RateLimiter(60000, 100);  // 100 req/min for general queries
const mutationRateLimiter = new RateLimiter(60000, 30);  // 30 mutations/min
const aiRateLimiter = new RateLimiter(60000, 10);        // 10 AI calls/min

/**
 * Determine if we're in production environment
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Initialize tRPC with context
 *
 * SECURITY: Error formatter sanitizes responses to prevent information leakage
 * - In production: Only return safe error codes and messages, no stack traces
 * - In development: Include full error details for debugging
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // In production, sanitize error responses to prevent stack trace exposure
    if (isProduction) {
      return {
        ...shape,
        data: {
          ...shape.data,
          // Only include Zod validation errors (safe to expose)
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
          // Never include stack traces in production
          stack: undefined,
        },
        // Sanitize the message for internal errors
        message: shape.code === 'INTERNAL_SERVER_ERROR'
          ? 'An unexpected error occurred. Please try again later.'
          : shape.message,
      };
    }

    // In development, include full error details for debugging
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure builders
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware for authentication
 * Ensures user is authenticated before proceeding
 */
export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  // Check if user is authenticated (not using anonymous/unauthenticated user)
  if (!ctx.userId || ctx.userId === ANONYMOUS_USER_ID || ctx.userId === LEGACY_DEFAULT_USER_ID) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to perform this action.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Narrow the type to ensure userId is defined and not anonymous/default
      userId: ctx.userId as string,
    },
  });
});

/**
 * Get rate limit key from context
 */
function getRateLimitKey(ctx: Context): string {
  if (
    ctx.userId &&
    ctx.userId !== ANONYMOUS_USER_ID &&
    ctx.userId !== LEGACY_DEFAULT_USER_ID
  ) {
    return `user:${ctx.userId}`;
  }
  return `anon:${ctx.userId || 'unknown'}`;
}

/**
 * Rate limiting middleware factory
 */
function createRateLimitMiddleware(limiter: RateLimiter, limitType: string) {
  return t.middleware(async ({ ctx, next }) => {
    const key = getRateLimitKey(ctx);
    const result = limiter.check(key);

    if (!result.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded for ${limitType}. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
      });
    }

    return next();
  });
}

const generalRateLimitMiddleware = createRateLimitMiddleware(generalRateLimiter, 'API requests');
const mutationRateLimitMiddleware = createRateLimitMiddleware(mutationRateLimiter, 'mutations');
const aiRateLimitMiddleware = createRateLimitMiddleware(aiRateLimiter, 'AI operations');

/**
 * Protected procedure - requires authentication
 * Use this for any endpoint that modifies user data or accesses sensitive info
 */
export const protectedProcedure = t.procedure.use(authMiddleware);

/**
 * Rate-limited public procedure (100 req/min)
 */
export const rateLimitedPublicProcedure = t.procedure.use(generalRateLimitMiddleware);

/**
 * Rate-limited protected procedure for mutations (30/min)
 */
export const rateLimitedMutationProcedure = t.procedure
  .use(authMiddleware)
  .use(mutationRateLimitMiddleware);

/**
 * Rate-limited procedure for AI operations (10/min)
 * SECURITY: Protects expensive Anthropic/Exa API calls from abuse
 */
export const aiRateLimitedProcedure = t.procedure
  .use(authMiddleware)
  .use(aiRateLimitMiddleware);

/**
 * Admin user IDs - configurable via environment variable
 * Format: comma-separated list of user IDs
 * Example: ADMIN_USER_IDS=user123,user456
 * If not set, any authenticated user is treated as admin (single-user mode)
 */
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * Admin middleware - checks for admin role
 */
export const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || ctx.userId === ANONYMOUS_USER_ID || ctx.userId === LEGACY_DEFAULT_USER_ID) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to perform this action.',
    });
  }

  // If no admin IDs are configured, treat all authenticated users as admins (single-user mode)
  const isAdmin = ADMIN_USER_IDS.length === 0 ? true : ADMIN_USER_IDS.includes(ctx.userId);

  if (!isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Administrator access required.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId as string,
      isAdmin: true,
    },
  });
});

/**
 * Admin procedure - requires authentication AND admin role
 * Use this for system-wide settings, user management, etc.
 */
export const adminProcedure = t.procedure.use(adminMiddleware);

/**
 * Middleware for logging (optional)
 */
export const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (result.ok) {
    console.log(`[tRPC] ${type} ${path} - ${durationMs}ms`);
  } else {
    console.error(`[tRPC] ${type} ${path} - ${durationMs}ms - ERROR:`, result.error);
  }

  return result;
});

/**
 * Logged procedure (with timing)
 */
export const loggedProcedure = publicProcedure.use(loggerMiddleware);

/**
 * Protected + Logged procedure
 */
export const protectedLoggedProcedure = protectedProcedure.use(loggerMiddleware);
