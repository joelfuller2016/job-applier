/**
 * tRPC Initialization
 * Core tRPC setup with context and middleware
 */

import { initTRPC } from '@trpc/server';
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
