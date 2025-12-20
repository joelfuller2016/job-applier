/**
 * Dashboard Router
 * Handles dashboard data aggregation
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

/**
 * Dashboard router for overview and stats
 */
export const dashboardRouter = router({
  /**
   * Get dashboard overview data
   * SECURITY: Requires authentication to view user's dashboard data
   */
  getOverview: protectedProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get default profile if not specified
      const profile = input.profileId
        ? ctx.profileRepository.findById(input.profileId)
        : ctx.profileRepository.getDefault();

      if (!profile) {
        return {
          stats: {
            jobsDiscovered: 0,
            applicationsSent: 0,
            successRate: 0,
            pendingActions: 0,
          },
          recentActivity: [],
          activeHunts: [],
        };
      }

      // Get application stats
      const stats = await ctx.applicationRepository.getStats(profile.id);

      // Get recent applications for activity feed
      const recentApplications = await ctx.applicationRepository.findByProfile(profile.id);
      const topApplications = recentApplications.slice(0, 10);

      // Bulk fetch jobs to avoid N+1 query
      const jobIds = topApplications.map(app => app.jobId);
      const jobsMap = ctx.jobRepository.findByIds(jobIds);

      const recentActivity = topApplications.map((app) => {
        const job = jobsMap.get(app.jobId);
        const company = job?.company || 'Unknown Company';
        const jobTitle = job?.title || 'Unknown Position';

        return {
          id: app.id,
          type: app.status === 'submitted' ? 'application_sent' as const : 'job_discovered' as const,
          title: app.status === 'submitted'
            ? `Application sent to ${company}`
            : `Discovered ${jobTitle} at ${company}`,
          description: jobTitle,
          timestamp: app.createdAt,
        };
      });

      // Calculate success rate
      const totalApplications = stats.total || 1; // Avoid division by zero
      const successfulApplications = (stats.byStatus?.interviewing || 0) +
                                      (stats.byStatus?.offered || 0) +
                                      (stats.byStatus?.accepted || 0);
      const successRate = Math.round((successfulApplications / totalApplications) * 100);

      // Pending actions count
      const pendingActions = (stats.byStatus?.pending || 0) + (stats.byStatus?.draft || 0);

      // Active hunt sessions for the dashboard widget
      const huntSessions = ctx.sessionRepository.findByUser(ctx.userId, {
        type: 'hunt',
        limit: 5,
      });

      const activeHunts = huntSessions
        .filter(session => ['active', 'paused', 'error'].includes(session.status))
        .map(session => {
          const config = session.config as { searchQuery?: string } | undefined;
          const statsData = session.stats ?? {};
          const statusMap = {
            active: 'running',
            paused: 'paused',
            error: 'failed',
          } as const;

          return {
            id: session.id,
            status: statusMap[session.status as keyof typeof statusMap] ?? 'running',
            searchQuery: config?.searchQuery ?? 'Job Hunt',
            jobsFound: statsData.jobsDiscovered ?? 0,
            applicationsSubmitted: statsData.applicationsSubmitted ?? 0,
            targetCount: session.totalItems || undefined,
            startedAt: session.startedAt,
            lastActivityAt: session.lastActivityAt,
            errorMessage: session.errorMessage ?? undefined,
          };
        });

      return {
        stats: {
          jobsDiscovered: stats.total || 0,
          applicationsSent: stats.byStatus?.submitted || 0,
          successRate,
          pendingActions,
        },
        recentActivity,
        activeHunts,
      };
    }),

  /**
   * Get recent activity
   * SECURITY: Requires authentication to view user's activity
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const profile = input.profileId
        ? ctx.profileRepository.findById(input.profileId)
        : ctx.profileRepository.getDefault();

      if (!profile) {
        return [];
      }

      const applications = await ctx.applicationRepository.findByProfile(profile.id);
      const recentApps = applications.slice(0, input.limit);

      // Bulk fetch jobs to avoid N+1 query
      const jobIds = recentApps.map(app => app.jobId);
      const jobsMap = ctx.jobRepository.findByIds(jobIds);

      const results = recentApps.map((app) => {
        const job = jobsMap.get(app.jobId);
        const company = job?.company || 'Unknown Company';
        const jobTitle = job?.title || 'Unknown Position';

        return {
          id: app.id,
          type: app.status === 'submitted' ? 'application_sent' as const : 'job_discovered' as const,
          title: app.status === 'submitted'
            ? `Application sent to ${company}`
            : `Discovered ${jobTitle} at ${company}`,
          description: jobTitle,
          timestamp: app.createdAt,
        };
      });

      return results;
    }),
});
