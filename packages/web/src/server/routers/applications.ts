/**
 * Applications Router
 * Handles job application operations
 *
 * SECURITY: All endpoints require authentication and verify ownership
 * Applications are owned through their profile chain: Application -> Profile -> User
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { ApplicationStatus, ApplicationStatusSchema } from '@job-applier/core';

/**
 * Verify that the current user owns the application
 * Applications are owned through their profile chain: Application -> Profile -> User
 *
 * @throws TRPCError NOT_FOUND if application or profile doesn't exist
 * @throws TRPCError FORBIDDEN if user doesn't own the application
 */
async function verifyApplicationOwnership(
  ctx: {
    applicationRepository: {
      findById: (id: string) => { profileId: string } | null;
    };
    profileRepository: {
      findById: (id: string) => { userId?: string | null } | null;
    };
    userId: string;
  },
  applicationId: string
) {
  const application = ctx.applicationRepository.findById(applicationId);

  if (!application) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Application not found',
    });
  }

  // Verify ownership through profile
  const profile = ctx.profileRepository.findById(application.profileId);

  if (!profile) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Associated profile not found',
    });
  }

  if (profile.userId !== ctx.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this application',
    });
  }

  return { application, profile };
}

/**
 * Get the authenticated user's default profile
 *
 * @throws TRPCError NOT_FOUND if user has no profile
 */
async function getAuthenticatedUserProfile(
  ctx: {
    profileRepository: {
      getDefaultForUser: (userId: string) => { id: string; userId?: string | null } | null;
    };
    userId: string;
  }
) {
  const profile = ctx.profileRepository.getDefaultForUser(ctx.userId);

  if (!profile) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User profile not found. Please create a profile first.',
    });
  }

  return profile;
}

/**
 * Applications router for tracking job applications
 *
 * SECURITY: All endpoints use protectedProcedure and verify ownership
 */
export const applicationsRouter = router({
  /**
   * List applications for the authenticated user
   * SECURITY: Returns only the current user's applications
   */
  list: protectedProcedure
    .input(
      z.object({
        status: ApplicationStatusSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get the authenticated user's profile
      const profile = await getAuthenticatedUserProfile(ctx);

      // Return only this user's applications
      if (input.status) {
        // Note: If findByProfileAndStatus doesn't exist, use findByProfile and filter
        const applications = ctx.applicationRepository.findByProfile(profile.id);
        return applications.filter((app: { status: string }) => app.status === input.status);
      }

      return ctx.applicationRepository.findByProfile(profile.id);
    }),

  /**
   * Get application by ID
   * SECURITY: Verifies user owns the application
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership before returning
      await verifyApplicationOwnership(ctx, input.id);

      // Re-fetch full application data
      return ctx.applicationRepository.findById(input.id);
    }),

  /**
   * Get application statistics for the authenticated user
   * SECURITY: Returns only the current user's stats
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      // Get the authenticated user's profile
      const profile = await getAuthenticatedUserProfile(ctx);

      // Return only this user's stats
      return ctx.applicationRepository.getStats(profile.id);
    }),

  /**
   * Update application status
   * SECURITY: Requires authentication AND ownership verification
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: ApplicationStatusSchema,
        details: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before updating
      await verifyApplicationOwnership(ctx, input.id);

      const updated = ctx.applicationRepository.updateStatus(
        input.id,
        input.status as ApplicationStatus,
        input.details
      );

      if (!updated) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update application status',
        });
      }

      return updated;
    }),

  /**
   * Add a note/event to an application
   * SECURITY: Requires authentication AND ownership verification
   */
  addNote: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        type: z.enum([
          'created',
          'submitted',
          'status-change',
          'response-received',
          'interview-scheduled',
          'follow-up-sent',
          'note-added',
          'error',
        ] as const),
        description: z.string(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before adding note
      await verifyApplicationOwnership(ctx, input.applicationId);

      const event = ctx.applicationRepository.addEvent(input.applicationId, {
        type: input.type,
        description: input.description,
        metadata: input.metadata,
      });

      return event;
    }),

  /**
   * Mark application as submitted
   * SECURITY: Requires authentication AND ownership verification
   */
  markSubmitted: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        platformApplicationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before marking as submitted
      await verifyApplicationOwnership(ctx, input.id);

      const updated = ctx.applicationRepository.markSubmitted(
        input.id,
        input.platformApplicationId
      );

      if (!updated) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark application as submitted',
        });
      }

      return updated;
    }),

  /**
   * Check if authenticated user has already applied to a job
   * SECURITY: Only checks the current user's applications
   */
  hasApplied: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get the authenticated user's profile
      const profile = await getAuthenticatedUserProfile(ctx);

      // Check only this user's applications
      return ctx.applicationRepository.hasApplied(profile.id, input.jobId);
    }),
});
