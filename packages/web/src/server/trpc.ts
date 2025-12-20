/**
 * tRPC Initialization
 * Core tRPC setup with context, middleware, and authentication
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from '../lib/trpc/server';
import { ANONYMOUS_USER_ID } from '../lib/constants';

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
 * Protected procedure - requires authentication
 * Use this for any endpoint that modifies user data or accesses sensitive info
 */
export const protectedProcedure = t.procedure.use(authMiddleware);

/**
 * Get list of admin user IDs from environment
 * ADMIN_USER_IDS should be a comma-separated list of user IDs
 */
function getAdminUserIds(): string[] {
  const adminIds = process.env.ADMIN_USER_IDS || '';
  return adminIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

/**
 * Middleware for admin authentication
 * Ensures user is authenticated AND is an administrator
 * 
 * SECURITY: Admin users are configured via ADMIN_USER_IDS environment variable.
 * If no admins are configured, NO ONE can access admin endpoints (fail-secure).
 */
export const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  // First, ensure user is authenticated
  if (!ctx.userId || ctx.userId === ANONYMOUS_USER_ID) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to perform this action.',
    });
  }

  // Check if user is in the admin list
  const adminUserIds = getAdminUserIds();
  
  // SECURITY: If no admins configured, fail secure (no one gets admin access)
  if (adminUserIds.length === 0) {
    console.warn('[SECURITY] No ADMIN_USER_IDS configured. Admin endpoints are disabled.');
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Administrator access required. No administrators configured.',
    });
  }

  if (!adminUserIds.includes(ctx.userId)) {
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
