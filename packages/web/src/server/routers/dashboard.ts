/**
 * Dashboard Router
 * Handles dashboard data aggregation
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { ANONYMOUS_USER_ID } from '../../lib/constants';

/**
 * Helper function to verify profile ownership
 * SECURITY: Throws FORBIDDEN if user doesn't own the profile
 */
function verifyProfileOwnership(
  profile: { userId?: string | null },
  userId: string
) {
  if (!profile.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This profile has no owner and cannot be accessed.',
    });
  }
  if (profile.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to view this dashboard',
    });
  }
}

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
      // Get user's profile - either specified or their default
      const profile = input.profileId
        ? ctx.profileRepository.findById(input.profileId)
        : ctx.profileRepository.getDefaultForUser(ctx.userId);

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

      // SECURITY: Verify the user owns this profile
      verifyProfileOwnership(profile, ctx.userId);

      // Get application stats
      const stats = await ctx.applicationRepository.getStats(profile.id);

      // Get recent applications for activity feed
      const recentApplications = await ctx.applicationRepository.findByProfile(profile.id);
      const recentActivity = await Promise.all(
        recentApplications.slice(0, 10).map(async (app) => {
          // Get job details for the application
          const job = await ctx.jobRepository.findById(app.jobId);
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
        })
      );

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
      // Get user's profile - either specified or their default
      const profile = input.profileId
        ? ctx.profileRepository.findById(input.profileId)
        : ctx.profileRepository.getDefaultForUser(ctx.userId);

      if (!profile) {
        return [];
      }

      // SECURITY: Verify the user owns this profile
      verifyProfileOwnership(profile, ctx.userId);

      const applications = await ctx.applicationRepository.findByProfile(profile.id);

      const recentApps = applications.slice(0, input.limit);
      const results = await Promise.all(
        recentApps.map(async (app) => {
          const job = await ctx.jobRepository.findById(app.jobId);
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
        })
      );

      return results;
    }),
});
