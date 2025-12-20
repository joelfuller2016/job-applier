/**
 * tRPC Initialization
 * Core tRPC setup with context, middleware, and authentication
 * 
 * SECURITY: Includes authentication and rate limiting middleware
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from '../lib/trpc/server';
import { ANONYMOUS_USER_ID } from '../lib/constants';

/**
 * Simple in-memory rate limiter
 * For production, consider using @upstash/ratelimit with Redis
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();
  
  constructor(
    private readonly windowMs: number = 60000, // 1 minute
    private readonly maxRequests: number = 60   // 60 requests per minute
  ) {}

  /**
   * Check if request should be rate limited
   * @returns true if request is allowed, false if rate limited
   */
  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.requests.get(key);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    if (!record || now > record.resetAt) {
      // New window
      this.requests.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return { allowed: true, remaining: this.maxRequests - record.count, resetAt: record.resetAt };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(key);
      }
    }
  }
}

// Rate limiters for different endpoint types
const generalRateLimiter = new RateLimiter(60000, 60);  // 60 requests/minute for general endpoints
const aiRateLimiter = new RateLimiter(60000, 10);       // 10 requests/minute for AI-heavy endpoints
const mutationRateLimiter = new RateLimiter(60000, 30); // 30 mutations/minute

/**
 * Initialize tRPC with context
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
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
  if (!ctx.userId || ctx.userId === ANONYMOUS_USER_ID) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to perform this action.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Narrow the type to ensure userId is defined and not 'default'
      userId: ctx.userId as string,
    },
  });
});

/**
 * Rate limiting middleware for general endpoints
 */
export const rateLimitMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  // Use userId if authenticated, otherwise use a fallback identifier
  const identifier = ctx.userId !== ANONYMOUS_USER_ID ? ctx.userId : 'anonymous';
  
  // Apply stricter limits for mutations
  const limiter = type === 'mutation' ? mutationRateLimiter : generalRateLimiter;
  const result = limiter.check(`${identifier}:${type}`);

  if (!result.allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Please try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
    });
  }

  return next();
});

/**
 * Rate limiting middleware for AI-heavy endpoints (Claude, Exa)
 */
export const aiRateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const identifier = ctx.userId !== ANONYMOUS_USER_ID ? ctx.userId : 'anonymous';
  const result = aiRateLimiter.check(`${identifier}:ai`);

  if (!result.allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `AI rate limit exceeded. Please try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
    });
  }

  return next();
});

/**
 * Protected procedure - requires authentication
 * Use this for any endpoint that modifies user data or accesses sensitive info
 */
export const protectedProcedure = t.procedure.use(authMiddleware);

/**
 * Rate-limited procedure - applies general rate limiting
 */
export const rateLimitedProcedure = t.procedure.use(rateLimitMiddleware);

/**
 * Protected + rate-limited procedure
 * Use this for mutations that need both auth and rate limiting
 */
export const protectedRateLimitedProcedure = t.procedure
  .use(authMiddleware)
  .use(rateLimitMiddleware);

/**
 * AI-rate-limited procedure
 * Use for endpoints that call Claude or Exa APIs
 */
export const aiRateLimitedProcedure = t.procedure
  .use(authMiddleware)
  .use(aiRateLimitMiddleware);

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
