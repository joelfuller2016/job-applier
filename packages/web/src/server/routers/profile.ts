/**
 * Profile Router
 * Handles user profile operations
 */

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { UserProfileSchema } from '@job-applier/core';

/**
 * Profile router with CRUD operations
 */
export const profileRouter = router({
  /**
   * Get user profile by ID
   */
  getProfile: publicProcedure
    .input(z.object({ id: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      if (input?.id) {
        return ctx.profileRepository.findById(input.id);
      }

      // Get default profile if no ID provided
      return ctx.profileRepository.getDefault();
    }),

  /**
   * Get all profiles
   */
  listProfiles: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.profileRepository.findAll();
    }),

  /**
   * Create a new profile
   */
  createProfile: publicProcedure
    .input(UserProfileSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      return ctx.profileRepository.create(input);
    }),

  /**
   * Update existing profile
   */
  updateProfile: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: UserProfileSchema.partial().omit({ id: true, createdAt: true, updatedAt: true }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = ctx.profileRepository.update(input.id, input.data);

      if (!updated) {
        throw new Error(`Profile with ID ${input.id} not found`);
      }

      return updated;
    }),

  /**
   * Delete a profile
   */
  deleteProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = ctx.profileRepository.delete(input.id);

      if (!deleted) {
        throw new Error(`Profile with ID ${input.id} not found`);
      }

      return { success: true };
    }),

  /**
   * Import resume and create/update profile
   * This would integrate with the resume parser
   */
  importResume: publicProcedure
    .input(
      z.object({
        resumePath: z.string(),
        profileId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Integrate with @job-applier/resume-parser
      // For now, just update the resume path on existing profile or return error

      if (input.profileId) {
        const profile = ctx.profileRepository.findById(input.profileId);
        if (!profile) {
          throw new Error(`Profile with ID ${input.profileId} not found`);
        }

        return ctx.profileRepository.update(input.profileId, {
          resumePath: input.resumePath,
          parsedAt: new Date().toISOString(),
        });
      }

      throw new Error('Resume parsing not yet implemented. Please provide a profileId to update.');
    }),
});
