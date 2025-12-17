/**
 * tRPC Server Context
 * Provides context for tRPC procedures (repositories, config, etc.)
 */

import { profileRepository } from '@job-applier/database';
import { jobRepository } from '@job-applier/database';
import { applicationRepository } from '@job-applier/database';
import { getConfigManager } from '@job-applier/config';
import { JobHunterOrchestrator } from '@job-applier/ai-job-hunter';

/**
 * Create context for tRPC
 * This runs for every request and provides access to dependencies
 */
export async function createContext() {
  const configManager = getConfigManager();
  const config = configManager.getConfig();
  const orchestrator = new JobHunterOrchestrator();

  return {
    // Repositories
    profileRepository,
    jobRepository,
    applicationRepository,

    // Services
    configManager,
    config,
    orchestrator,

    // Helpers
    userId: 'default', // In the future, this would come from auth
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
