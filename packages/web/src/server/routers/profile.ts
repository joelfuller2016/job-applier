/**
 * Profile Router
 * Handles user profile operations with multi-profile support
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { UserProfileSchema, JobPreferencesSchema, ContactInfoSchema, SkillSchema, WorkExperienceSchema, EducationSchema, CertificationSchema, ProjectSchema } from '@job-applier/core';
import { ANONYMOUS_USER_ID } from '../../lib/constants';

/**
 * Helper function to verify profile ownership
 * Throws TRPCError if the user doesn't own the profile
 * @param ctx - The tRPC context containing userId and profileRepository
 * @param profileId - The ID of the profile to verify
 * @returns The profile if ownership is verified
 */
async function verifyProfileOwnership(
  ctx: { userId: string; profileRepository: { findById: (id: string) => unknown } },
  profileId: string
) {
  const profile = ctx.profileRepository.findById(profileId) as {
    id: string;
    userId?: string;
  } | null;

  if (!profile) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Profile not found',
    });
  }

  // Orphaned profiles (no userId) cannot be modified
  if (!profile.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This profile has no owner and cannot be modified. Please create a new profile.',
    });
  }

  if (profile.userId !== ctx.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to modify this profile',
    });
  }

  return profile;
}

/**
 * Extended profile schema with additional fields
 */
const ExtendedProfileInputSchema = UserProfileSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  resumeContent: z.string().optional(),
  coverLetterTemplate: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Profile router with CRUD operations
 */
export const profileRouter = router({
  /**
   * Get the current user's profile (default profile for authenticated user)
   */
  getCurrentProfile: publicProcedure
    .query(async ({ ctx }) => {
      if (ctx.userId === ANONYMOUS_USER_ID) {
        // Anonymous users get the default profile (read-only)
        return ctx.profileRepository.getDefault();
      }
      return ctx.profileRepository.getDefaultForUser(ctx.userId);
    }),

  /**
   * Get user profile by ID
   */
  getProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.id);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.id} not found`,
        });
      }

      // Verify ownership - allow read access to orphaned profiles only for anonymous users
      if (ctx.userId !== ANONYMOUS_USER_ID) {
        // Authenticated users can only access their own profiles
        if (profile.userId && profile.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this profile',
          });
        }
      }

      return profile;
    }),

  /**
   * Get all profiles for the current user
   */
  listProfiles: publicProcedure
    .query(async ({ ctx }) => {
      if (ctx.userId === ANONYMOUS_USER_ID) {
        // Anonymous users can only see public/default profiles
        return ctx.profileRepository.findAll();
      }
      return ctx.profileRepository.findByUserId(ctx.userId);
    }),

  /**
   * Create a new profile
   * SECURITY: Requires authentication
   */
  createProfile: protectedProcedure
    .input(ExtendedProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.profileRepository.create(input, ctx.userId);
    }),

  /**
   * Update existing profile
   * SECURITY: Requires authentication
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: ExtendedProfileInputSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.id);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.id} not found`,
        });
      }

      // Verify ownership - orphaned profiles (no userId) cannot be modified
      if (!profile.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This profile has no owner and cannot be modified. Please create a new profile.',
        });
      }

      if (profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this profile',
        });
      }

      const updated = ctx.profileRepository.update(input.id, input.data);
      return updated;
    }),

  /**
   * Delete a profile
   * SECURITY: Requires authentication
   */
  deleteProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.id);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.id} not found`,
        });
      }

      // Verify ownership - orphaned profiles (no userId) cannot be deleted
      if (!profile.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This profile has no owner and cannot be deleted. Contact an administrator.',
        });
      }

      if (profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this profile',
        });
      }

      ctx.profileRepository.delete(input.id);
      return { success: true };
    }),

  /**
   * Set a profile as default
   * SECURITY: Requires authentication
   */
  setDefaultProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.id);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.id} not found`,
        });
      }

      if (profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this profile',
        });
      }

      return ctx.profileRepository.setDefault(input.id, ctx.userId);
    }),

  /**
   * Update profile contact information
   * SECURITY: Requires authentication and ownership verification
   */
  updateContactInfo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        contact: ContactInfoSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.id);
      return ctx.profileRepository.update(input.id, { contact: input.contact });
    }),

  /**
   * Update profile job preferences
   * SECURITY: Requires authentication and ownership verification
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        preferences: JobPreferencesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.id);
      return ctx.profileRepository.update(input.id, { preferences: input.preferences });
    }),

  /**
   * Add a skill to profile
   * SECURITY: Requires authentication and ownership verification
   */
  addSkill: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        skill: SkillSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const skills = [...((profile as { skills?: unknown[] })?.skills || []), input.skill];
      return ctx.profileRepository.update(input.profileId, { skills });
    }),

  /**
   * Remove a skill from profile
   * SECURITY: Requires authentication and ownership verification
   */
  removeSkill: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        skillName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const skills = ((profile as { skills?: { name: string }[] })?.skills || []).filter(s => s.name !== input.skillName);
      return ctx.profileRepository.update(input.profileId, { skills });
    }),

  /**
   * Add work experience
   * SECURITY: Requires authentication and ownership verification
   */
  addExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experience: WorkExperienceSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const experience = [...((profile as { experience?: unknown[] })?.experience || []), input.experience];
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Update work experience
   * SECURITY: Requires authentication and ownership verification
   */
  updateExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experienceId: z.string(),
        experience: WorkExperienceSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const experience = ((profile as { experience?: { id: string }[] })?.experience || []).map(exp =>
        exp.id === input.experienceId ? { ...exp, ...input.experience } : exp
      );
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Remove work experience
   * SECURITY: Requires authentication and ownership verification
   */
  removeExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experienceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const experience = ((profile as { experience?: { id: string }[] })?.experience || []).filter(e => e.id !== input.experienceId);
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Add education
   * SECURITY: Requires authentication and ownership verification
   */
  addEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        education: EducationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const education = [...((profile as { education?: unknown[] })?.education || []), input.education];
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Update education
   * SECURITY: Requires authentication and ownership verification
   */
  updateEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        educationId: z.string(),
        education: EducationSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const education = ((profile as { education?: { id: string }[] })?.education || []).map(edu =>
        edu.id === input.educationId ? { ...edu, ...input.education } : edu
      );
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Remove education
   * SECURITY: Requires authentication and ownership verification
   */
  removeEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        educationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const education = ((profile as { education?: { id: string }[] })?.education || []).filter(e => e.id !== input.educationId);
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Add project
   * SECURITY: Requires authentication and ownership verification
   */
  addProject: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        project: ProjectSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const projects = [...((profile as { projects?: unknown[] })?.projects || []), input.project];
      return ctx.profileRepository.update(input.profileId, { projects });
    }),

  /**
   * Add certification
   * SECURITY: Requires authentication and ownership verification
   */
  addCertification: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        certification: CertificationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      const profile = ctx.profileRepository.findById(input.profileId);
      const certifications = [...((profile as { certifications?: unknown[] })?.certifications || []), input.certification];
      return ctx.profileRepository.update(input.profileId, { certifications });
    }),

  /**
   * Update resume content
   * SECURITY: Requires authentication and ownership verification
   */
  updateResumeContent: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        resumeContent: z.string(),
        resumePath: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      return ctx.profileRepository.update(input.profileId, {
        resumeContent: input.resumeContent,
        resumePath: input.resumePath,
        parsedAt: new Date().toISOString(),
      });
    }),

  /**
   * Update cover letter template
   * SECURITY: Requires authentication and ownership verification
   */
  updateCoverLetterTemplate: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        coverLetterTemplate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing modification
      await verifyProfileOwnership(ctx, input.profileId);

      return ctx.profileRepository.update(input.profileId, {
        coverLetterTemplate: input.coverLetterTemplate,
      });
    }),

  /**
   * Import resume and create/update profile
   * SECURITY: Requires authentication and ownership verification
   */
  importResume: protectedProcedure
    .input(
      z.object({
        resumePath: z.string(),
        profileId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.profileId) {
        // Verify ownership before allowing modification
        await verifyProfileOwnership(ctx, input.profileId);

        return ctx.profileRepository.update(input.profileId, {
          resumePath: input.resumePath,
          parsedAt: new Date().toISOString(),
        });
      }

      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Resume parsing not yet implemented. Please provide a profileId to update.',
      });
    }),

  /**
   * Duplicate a profile
   * SECURITY: Requires authentication and ownership verification
   */
  duplicateProfile: protectedProcedure
    .input(z.object({ id: z.string(), newName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before allowing duplication (profile contains sensitive data)
      await verifyProfileOwnership(ctx, input.id);

      const profile = ctx.profileRepository.findById(input.id) as {
        id: string;
        userId?: string;
        createdAt?: string;
        updatedAt?: string;
        isDefault?: boolean;
        firstName: string;
        lastName: string;
      };

      // Create a copy of the profile
      const { id, userId, createdAt, updatedAt, isDefault, ...profileData } = profile;

      // Update name if provided
      if (input.newName) {
        const nameParts = input.newName.split(' ');
        profileData.firstName = nameParts[0] || profileData.firstName;
        profileData.lastName = nameParts.slice(1).join(' ') || profileData.lastName;
      } else {
        profileData.firstName = `${profileData.firstName} (Copy)`;
      }

      const newUserId = ctx.userId === ANONYMOUS_USER_ID ? undefined : ctx.userId;
      return ctx.profileRepository.create(profileData, newUserId);
    }),
});
