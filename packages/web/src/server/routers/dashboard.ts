/**
 * Dashboard Router
 * Handles dashboard data aggregation
 *
 * SECURITY: All endpoints require authentication and verify profile ownership
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Verify that the authenticated user owns the profile
 *
 * @throws TRPCError FORBIDDEN if user doesn't own the profile or profile is orphaned
 */
function verifyProfileOwnership(
  profile: { userId?: string | null } | null,
  userId: string
): void {
  if (!profile) {
    return; // Will be handled by caller
  }

  // Orphaned profiles (no userId) should not be accessible via dashboard
  // This prevents data leakage from legacy/orphaned profiles
  if (!profile.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This profile cannot be accessed',
    });
  }

  // Profiles must belong to the authenticated user
  if (profile.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this profile',
    });
  }
}

/**
 * Dashboard router for overview and stats
 */
export const dashboardRouter = router({
  /**
   * Get dashboard overview data
   * SECURITY: Requires authentication and verifies profile ownership
   */
  getOverview: protectedProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get profile - prioritize user's default, then specified profileId
      const profile = input.profileId
        ? ctx.profileRepository.findById(input.profileId)
        : ctx.profileRepository.getDefaultForUser(ctx.userId);

      // Verify ownership before returning data
      verifyProfileOwnership(profile, ctx.userId);

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

      return {
        stats: {
          jobsDiscovered: stats.total || 0,
          applicationsSent: stats.byStatus?.submitted || 0,
          successRate,
          pendingActions,
        },
        recentActivity,
        activeHunts: [], // TODO: Implement when hunt tracking is available
      };
    }),

  /**
   * Get recent activity
   * SECURITY: Requires authentication and verifies profile ownership
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get profile - prioritize user's default, then specified profileId
      const profile = input.profileId
        ? ctx.profileRepository.findById(input.profileId)
        : ctx.profileRepository.getDefaultForUser(ctx.userId);

      // Verify ownership before returning data
      verifyProfileOwnership(profile, ctx.userId);

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
