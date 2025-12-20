/**
 * Applications Router
 * Handles job application operations
 * 
 * SECURITY: All mutations require authentication via protectedProcedure
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { ApplicationStatus, ApplicationStatusSchema } from '@job-applier/core';

/**
 * Applications router for tracking job applications
 */
export const applicationsRouter = router({
  /**
   * List applications with filters
   */
  list: publicProcedure
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
        return ctx.applicationRepository.findByProfile(input.profileId);
      }

      // Get default profile's applications
      const profile = ctx.profileRepository.getDefault();
      if (!profile) {
        return [];
      }

      return ctx.applicationRepository.findByProfile(profile.id);
    }),

  /**
   * Get application by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = ctx.applicationRepository.findById(input.id);

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Application with ID ${input.id} not found`,
        });
      }

      return application;
    }),

  /**
   * Get application statistics
   */
  getStats: publicProcedure
    .input(
      z.object({
        profileId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.applicationRepository.getStats(input.profileId);
    }),

  /**
   * Update application status
   * SECURITY: Requires authentication to prevent unauthorized status changes
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
      const application = ctx.applicationRepository.findById(input.id);

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Application with ID ${input.id} not found`,
        });
      }

      // SECURITY: Verify the application belongs to user's profile
      const profile = ctx.profileRepository.findById(application.profileId);
      if (profile?.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this application',
        });
      }

      const updated = ctx.applicationRepository.updateStatus(
        input.id,
        input.status as ApplicationStatus,
        input.details
      );

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
      // Verify application exists
      const application = ctx.applicationRepository.findById(input.applicationId);
      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Application with ID ${input.applicationId} not found`,
        });
      }

      // SECURITY: Verify the application belongs to user's profile
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
      const application = ctx.applicationRepository.findById(input.id);

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Application with ID ${input.id} not found`,
        });
      }

      // SECURITY: Verify the application belongs to user's profile
      const profile = ctx.profileRepository.findById(application.profileId);
      if (profile?.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this application',
        });
      }

      const updated = ctx.applicationRepository.markSubmitted(
        input.id,
        input.platformApplicationId
      );

      return updated;
    }),

  /**
   * Check if already applied to a job
   */
  hasApplied: publicProcedure
    .input(
      z.object({
        profileId: z.string(),
        jobId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.applicationRepository.hasApplied(input.profileId, input.jobId);
    }),
});
