/**
 * Main App Router
 * Combines all sub-routers into a single tRPC router
 */

import { router } from '../trpc';
import { authRouter } from './auth';
import { profileRouter } from './profile';
import { jobsRouter } from './jobs';
import { applicationsRouter } from './applications';
import { huntRouter } from './hunt';
import { settingsRouter } from './settings';
import { dashboardRouter } from './dashboard';
import { automationRouter } from './automation';

/**
 * Main application router
 * Merges all feature routers
 */
export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  hunt: huntRouter,
  settings: settingsRouter,
  dashboard: dashboardRouter,
  automation: automationRouter,
});

/**
 * Export type definition for client
 */
export type AppRouter = typeof appRouter;
