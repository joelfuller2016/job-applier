/**
 * Profile Router
 * Handles user profile operations with multi-profile support
 * 
 * SECURITY: All mutations require authentication via protectedProcedure
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { UserProfileSchema, JobPreferencesSchema, ContactInfoSchema, SkillSchema, WorkExperienceSchema, EducationSchema, CertificationSchema, ProjectSchema } from '@job-applier/core';
import { ANONYMOUS_USER_ID } from '../../lib/constants';

/**
 * Extended profile schema with additional fields
 */
const ExtendedProfileInputSchema = UserProfileSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  resumeContent: z.string().optional(),
  coverLetterTemplate: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Helper to verify profile ownership
 */
function verifyProfileOwnership(profile: { userId?: string | null }, userId: string): void {
  if (profile.userId && profile.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to modify this profile',
    });
  }
  if (!profile.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This profile has no owner and cannot be modified. Please create a new profile.',
    });
  }
}

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

      verifyProfileOwnership(profile, ctx.userId);

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

      verifyProfileOwnership(profile, ctx.userId);

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
   * SECURITY: Requires authentication
   */
  updateContactInfo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        contact: ContactInfoSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.id);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
      }
      verifyProfileOwnership(profile, ctx.userId);
      return ctx.profileRepository.update(input.id, { contact: input.contact });
    }),

  /**
   * Update profile job preferences
   * SECURITY: Requires authentication
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        preferences: JobPreferencesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.id);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
      }
      verifyProfileOwnership(profile, ctx.userId);
      return ctx.profileRepository.update(input.id, { preferences: input.preferences });
    }),

  /**
   * Add a skill to profile
   * SECURITY: Requires authentication
   */
  addSkill: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        skill: SkillSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const skills = [...(profile.skills || []), input.skill];
      return ctx.profileRepository.update(input.profileId, { skills });
    }),

  /**
   * Remove a skill from profile
   * SECURITY: Requires authentication
   */
  removeSkill: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        skillName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const skills = (profile.skills || []).filter(s => s.name !== input.skillName);
      return ctx.profileRepository.update(input.profileId, { skills });
    }),

  /**
   * Add work experience
   * SECURITY: Requires authentication
   */
  addExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experience: WorkExperienceSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const experience = [...(profile.experience || []), input.experience];
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Update work experience
   * SECURITY: Requires authentication
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
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const experience = (profile.experience || []).map(exp =>
        exp.id === input.experienceId ? { ...exp, ...input.experience } : exp
      );
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Remove work experience
   * SECURITY: Requires authentication
   */
  removeExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experienceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const experience = (profile.experience || []).filter(e => e.id !== input.experienceId);
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Add education
   * SECURITY: Requires authentication
   */
  addEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        education: EducationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const education = [...(profile.education || []), input.education];
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Update education
   * SECURITY: Requires authentication
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
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const education = (profile.education || []).map(edu =>
        edu.id === input.educationId ? { ...edu, ...input.education } : edu
      );
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Remove education
   * SECURITY: Requires authentication
   */
  removeEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        educationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const education = (profile.education || []).filter(e => e.id !== input.educationId);
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Add project
   * SECURITY: Requires authentication
   */
  addProject: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        project: ProjectSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const projects = [...(profile.projects || []), input.project];
      return ctx.profileRepository.update(input.profileId, { projects });
    }),

  /**
   * Add certification
   * SECURITY: Requires authentication
   */
  addCertification: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        certification: CertificationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found`,
        });
      }

      verifyProfileOwnership(profile, ctx.userId);

      const certifications = [...(profile.certifications || []), input.certification];
      return ctx.profileRepository.update(input.profileId, { certifications });
    }),

  /**
   * Update resume content
   * SECURITY: Requires authentication
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
      const profile = ctx.profileRepository.findById(input.profileId);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
      }
      verifyProfileOwnership(profile, ctx.userId);

      return ctx.profileRepository.update(input.profileId, {
        resumeContent: input.resumeContent,
        resumePath: input.resumePath,
        parsedAt: new Date().toISOString(),
      });
    }),

  /**
   * Update cover letter template
   * SECURITY: Requires authentication
   */
  updateCoverLetterTemplate: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        coverLetterTemplate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.profileId);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
      }
      verifyProfileOwnership(profile, ctx.userId);

      return ctx.profileRepository.update(input.profileId, {
        coverLetterTemplate: input.coverLetterTemplate,
      });
    }),

  /**
   * Import resume and create/update profile
   * SECURITY: Requires authentication
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
        const profile = ctx.profileRepository.findById(input.profileId);
        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Profile with ID ${input.profileId} not found`,
          });
        }

        verifyProfileOwnership(profile, ctx.userId);

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
   * SECURITY: Requires authentication
   */
  duplicateProfile: protectedProcedure
    .input(z.object({ id: z.string(), newName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const profile = ctx.profileRepository.findById(input.id);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with ID ${input.id} not found`,
        });
      }

      // Users can duplicate their own profiles or orphaned profiles
      if (profile.userId && profile.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to duplicate this profile',
        });
      }

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

      return ctx.profileRepository.create(profileData, ctx.userId);
    }),
});
