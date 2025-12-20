/**
 * Applications Router
 * Handles job application operations
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { ApplicationStatus, ApplicationStatusSchema } from '@job-applier/core';

/**
 * Applications router for tracking job applications
 * SECURITY: All endpoints require authentication as they access user application data
 */
export const applicationsRouter = router({
  /**
   * List applications with filters
   * SECURITY: Requires authentication - exposes user's application data
   */
  list: protectedProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
        status: ApplicationStatusSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.status) {
        return ctx.applicationRepository.findByStatus(input.status as ApplicationStatus);
      }

      if (input.profileId) {
        // Verify the user owns this profile
        const profile = ctx.profileRepository.findById(input.profileId);
        if (profile?.userId && profile.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this profile',
          });
        }
        return ctx.applicationRepository.findByProfile(input.profileId);
      }

      // Get user's default profile's applications
      const profile = ctx.profileRepository.getDefaultForUser(ctx.userId);
      if (!profile) {
        return [];
      }

      return ctx.applicationRepository.findByProfile(profile.id);
    }),

  /**
   * Get application by ID
   * SECURITY: Requires authentication - exposes application details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = ctx.applicationRepository.findById(input.id);

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Application with ID ${input.id} not found`,
        });
      }

      // Verify ownership through profile
      const profile = ctx.profileRepository.findById(application.profileId);
      if (profile?.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this application',
        });
      }

      return application;
    }),

  /**
   * Get application statistics
   * SECURITY: Requires authentication - exposes user stats
   */
  getStats: protectedProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.profileId) {
        // Verify the user owns this profile
        const profile = ctx.profileRepository.findById(input.profileId);
        if (profile?.userId && profile.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this profile',
          });
        }
      }
      return ctx.applicationRepository.getStats(input.profileId);
    }),

  /**
   * Update application status
   * SECURITY: Requires authentication
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
      // Verify ownership
      const application = ctx.applicationRepository.findById(input.id);
      if (application) {
        const profile = ctx.profileRepository.findById(application.profileId);
        if (profile?.userId && profile.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to modify this application',
          });
        }
      }

      const updated = ctx.applicationRepository.updateStatus(
        input.id,
        input.status as ApplicationStatus,
        input.details
      );

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Application with ID ${input.id} not found`,
        });
      }

      return updated;
    }),

  /**
   * Add a note/event to an application
   * SECURITY: Requires authentication
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
      // Verify application exists and user has access
      const application = ctx.applicationRepository.findById(input.applicationId);
      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Application with ID ${input.applicationId} not found`,
        });
      }

      // Verify ownership through profile
      const profile = ctx.profileRepository.findById(application.profileId);
      if (profile?.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this application',
        });
      }

      const event = ctx.applicationRepository.addEvent(input.applicationId, {
        type: input.type,
        description: input.description,
        metadata: input.metadata,
      });

      return event;
    }),

  /**
   * Mark application as submitted
   * SECURITY: Requires authentication
   */
  markSubmitted: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        platformApplicationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const application = ctx.applicationRepository.findById(input.id);
      if (application) {
        const profile = ctx.profileRepository.findById(application.profileId);
        if (profile?.userId && profile.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to modify this application',
          });
        }
      }

      const updated = ctx.applicationRepository.markSubmitted(
        input.id,
        input.platformApplicationId
      );

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Application with ID ${input.id} not found`,
        });
      }

      return updated;
    }),

  /**
   * Check if already applied to a job
   * SECURITY: Requires authentication - queries user's application history
   */
  hasApplied: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        jobId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify the user owns this profile
      const profile = ctx.profileRepository.findById(input.profileId);
      if (profile?.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this profile',
        });
      }

      return ctx.applicationRepository.hasApplied(input.profileId, input.jobId);
    }),
});
