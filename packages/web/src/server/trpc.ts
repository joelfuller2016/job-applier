/**
 * tRPC Initialization
 * Core tRPC setup with context, middleware, and authentication
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from '../lib/trpc/server';

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
  // Check if user is authenticated (not using default/anonymous user)
  if (!ctx.userId || ctx.userId === 'default') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
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
 * Protected procedure - requires authentication
 * Use this for any endpoint that modifies user data or accesses sensitive info
 */
export const protectedProcedure = t.procedure.use(authMiddleware);

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
