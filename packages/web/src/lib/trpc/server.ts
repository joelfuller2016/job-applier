/**
 * tRPC Server Context
 * Provides context for tRPC procedures (repositories, config, etc.)
 */

import { getServerSession } from 'next-auth';
import { profileRepository, userRepository } from '@job-applier/database';
import { jobRepository } from '@job-applier/database';
import { applicationRepository } from '@job-applier/database';
import { getConfigManager } from '@job-applier/config';
import { JobHunterOrchestrator } from '@job-applier/ai-job-hunter';
import { authOptions } from '@/lib/auth';
import { ANONYMOUS_USER_ID } from '@/lib/constants';

/**
 * Create context for tRPC
 * This runs for every request and provides access to dependencies
 */
export async function createContext() {
  const configManager = getConfigManager();
  const config = configManager.getConfig();
  const orchestrator = new JobHunterOrchestrator();

  // Get the session from NextAuth
  const session = await getServerSession(authOptions);

  return {
    // Auth
    session,
    // SECURITY: Use the ANONYMOUS_USER_ID constant for unauthenticated users
    // This ensures consistency with auth middleware checks
    userId: session?.user?.id ?? ANONYMOUS_USER_ID,

    // Repositories
    profileRepository,
    userRepository,
    jobRepository,
    applicationRepository,

    // Services
    configManager,
    config,
    orchestrator,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
