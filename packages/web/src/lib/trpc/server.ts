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

/**
 * Singleton instance for JobHunterOrchestrator
 * Reused across requests for efficiency and state persistence
 */
let orchestratorInstance: JobHunterOrchestrator | null = null;

function getOrchestrator(): JobHunterOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new JobHunterOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * Create context for tRPC
 * This runs for every request and provides access to dependencies
 */
export async function createContext() {
  const configManager = getConfigManager();
  const config = configManager.getConfig();
  const orchestrator = getOrchestrator();

  // Get the session from NextAuth
  const session = await getServerSession(authOptions);

  return {
    // Auth
    session,
    userId: session?.user?.id ?? 'default',

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
