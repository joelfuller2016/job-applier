/**
 * tRPC Initialization
 * Core tRPC setup with context, middleware, and authentication
 * 
 * SECURITY: Includes rate limiting to prevent API abuse
 * See: https://github.com/joelfuller2016/job-applier/issues/18
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from '../lib/trpc/server';
import { ANONYMOUS_USER_ID } from '../lib/constants';
import {
  checkRateLimit,
  RATE_LIMITS,
  type RateLimitConfig,
} from '../lib/rate-limit';

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
 * Get identifier for rate limiting
 * Uses userId if authenticated, otherwise falls back to IP
 */
function getRateLimitIdentifier(ctx: Context): string {
  if (ctx.userId && ctx.userId !== ANONYMOUS_USER_ID) {
    return `user:${ctx.userId}`;
  }
  // Fallback to IP or a default for anonymous users
  return `ip:${ctx.ip || 'unknown'}`;
}

/**
 * Create rate limit middleware with configurable limits
 */
function createRateLimitMiddleware(config: RateLimitConfig, prefix?: string) {
  return t.middleware(async ({ ctx, path, next }) => {
    const identifier = getRateLimitIdentifier(ctx);
    const result = checkRateLimit(identifier, config, prefix || path);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Please try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
      });
    }

    return next();
  });
}

/**
 * General rate limit middleware (100 requests/min)
 * Applied to all public procedures by default
 */
export const generalRateLimitMiddleware = createRateLimitMiddleware(RATE_LIMITS.GENERAL);

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
 * Rate-limited public procedure
 * 100 requests per minute per user/IP
 */
export const rateLimitedProcedure = t.procedure.use(generalRateLimitMiddleware);

/**
 * Protected procedure - requires authentication
 * Use this for any endpoint that modifies user data or accesses sensitive info
 * Includes general rate limiting
 */
export const protectedProcedure = t.procedure
  .use(generalRateLimitMiddleware)
  .use(authMiddleware);

/**
 * AI-rate-limited procedure (10 requests/min)
 * Use for endpoints that call expensive AI APIs (Claude, Exa)
 */
export const aiRateLimitMiddleware = createRateLimitMiddleware(RATE_LIMITS.AI_OPERATIONS, 'ai');

export const aiRateLimitedProcedure = t.procedure
  .use(aiRateLimitMiddleware)
  .use(authMiddleware);

/**
 * Expensive operation procedure (3 per 5 min)
 * Use for hunt.startHunt, automation.start, etc.
 */
export const expensiveRateLimitMiddleware = createRateLimitMiddleware(
  RATE_LIMITS.EXPENSIVE_OPERATIONS,
  'expensive'
);

export const expensiveProcedure = t.procedure
  .use(expensiveRateLimitMiddleware)
  .use(authMiddleware);

/**
 * Search-rate-limited procedure (30 requests/min)
 * Use for job search, profile search, etc.
 */
export const searchRateLimitMiddleware = createRateLimitMiddleware(RATE_LIMITS.SEARCH, 'search');

export const searchProcedure = t.procedure
  .use(searchRateLimitMiddleware)
  .use(authMiddleware);

/**
 * Auth-rate-limited procedure (10 requests/min)
 * Use for login, signup, password reset, etc.
 * Prevents brute force attacks
 */
export const authRateLimitMiddleware = createRateLimitMiddleware(RATE_LIMITS.AUTH, 'auth');

export const authRateLimitedProcedure = t.procedure.use(authRateLimitMiddleware);

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
export const loggedProcedure = rateLimitedProcedure.use(loggerMiddleware);

/**
 * Protected + Logged procedure
 */
export const protectedLoggedProcedure = protectedProcedure.use(loggerMiddleware);
