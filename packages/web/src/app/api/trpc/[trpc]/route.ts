/**
 * Next.js API Route Handler for tRPC
 * Handles all tRPC requests at /api/trpc/*
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';
import { appRouter } from '../../../../server/routers/_app';
import { createContext } from '../../../../lib/trpc/server';

/**
 * Handle all HTTP methods
 */
const handler = async (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }: { path?: string; error: any }) => {
            console.error(
              `[tRPC] Error on ${path ?? '<no-path>'}:`,
              error
            );
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };
