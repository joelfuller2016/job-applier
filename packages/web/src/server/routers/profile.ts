/**
 * Profile Router
 * Handles user profile operations with multi-profile support
 *
 * SECURITY: All mutation endpoints verify profile ownership before modification.
 * Users can only modify profiles they own (profile.userId === ctx.userId).
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import type { UserProfile } from '@job-applier/core';
import {
  UserProfileSchema,
  JobPreferencesSchema,
  ContactInfoSchema,
  SkillSchema,
  WorkExperienceSchema,
  EducationSchema,
  CertificationSchema,
  ProjectSchema,
} from '@job-applier/core';
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
 * Verify that the current user owns the profile
 * SECURITY: Prevents IDOR attacks by ensuring users can only modify their own profiles
 *
 * @throws TRPCError NOT_FOUND if profile doesn't exist
 * @throws TRPCError FORBIDDEN if user doesn't own the profile or profile has no owner
 */
function verifyProfileOwnership(
  ctx: {
    profileRepository: {
      findById: (id: string) => UserProfile | null;
    };
    userId: string;
  },
  profileId: string
) {
  const profile = ctx.profileRepository.findById(profileId);

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
      message: 'This profile has no owner and cannot be modified.',
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
   * SECURITY: Requires authentication - users can only access their own profiles
   */
  getProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return verifyProfileOwnership(ctx, input.id);
    }),

  /**
   * Get all profiles for the current user
   * SECURITY: Requires authentication - users can only see their own profiles
   */
  listProfiles: protectedProcedure
    .query(async ({ ctx }) => {
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
      verifyProfileOwnership(ctx, input.id);
      return ctx.profileRepository.update(input.id, input.data);
    }),

  /**
   * Delete a profile
   * SECURITY: Requires authentication
   */
  deleteProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      verifyProfileOwnership(ctx, input.id);
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
      verifyProfileOwnership(ctx, input.id);
      return ctx.profileRepository.setDefault(input.id, ctx.userId);
    }),

  /**
   * Update profile contact information
   * SECURITY: Requires authentication AND ownership verification
   */
  updateContactInfo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        contact: ContactInfoSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      verifyProfileOwnership(ctx, input.id);
      return ctx.profileRepository.update(input.id, { contact: input.contact });
    }),

  /**
   * Update profile job preferences
   * SECURITY: Requires authentication AND ownership verification
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        preferences: JobPreferencesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      verifyProfileOwnership(ctx, input.id);
      return ctx.profileRepository.update(input.id, { preferences: input.preferences });
    }),

  /**
   * Add a skill to profile
   * SECURITY: Requires authentication AND ownership verification
   */
  addSkill: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        skill: SkillSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const skills = [...(profile.skills || []), input.skill];
      return ctx.profileRepository.update(input.profileId, { skills });
    }),

  /**
   * Remove a skill from profile
   * SECURITY: Requires authentication AND ownership verification
   */
  removeSkill: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        skillName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const skills = (profile.skills || []).filter((skill) => skill.name !== input.skillName);
      return ctx.profileRepository.update(input.profileId, { skills });
    }),

  /**
   * Add work experience
   * SECURITY: Requires authentication AND ownership verification
   */
  addExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experience: WorkExperienceSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const experience = [...(profile.experience || []), input.experience];
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Update work experience
   * SECURITY: Requires authentication AND ownership verification
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
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const experience = (profile.experience || []).map((exp) =>
        exp.id === input.experienceId ? { ...exp, ...input.experience } : exp
      );
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Remove work experience
   * SECURITY: Requires authentication AND ownership verification
   */
  removeExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experienceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const experience = (profile.experience || []).filter((exp) => exp.id !== input.experienceId);
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Add education
   * SECURITY: Requires authentication AND ownership verification
   */
  addEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        education: EducationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const education = [...(profile.education || []), input.education];
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Update education
   * SECURITY: Requires authentication AND ownership verification
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
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const education = (profile.education || []).map((edu) =>
        edu.id === input.educationId ? { ...edu, ...input.education } : edu
      );
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Remove education
   * SECURITY: Requires authentication AND ownership verification
   */
  removeEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        educationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const education = (profile.education || []).filter((edu) => edu.id !== input.educationId);
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Add project
   * SECURITY: Requires authentication AND ownership verification
   */
  addProject: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        project: ProjectSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const projects = [...(profile.projects || []), input.project];
      return ctx.profileRepository.update(input.profileId, { projects });
    }),

  /**
   * Add certification
   * SECURITY: Requires authentication AND ownership verification
   */
  addCertification: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        certification: CertificationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.profileId);
      const certifications = [...(profile.certifications || []), input.certification];
      return ctx.profileRepository.update(input.profileId, { certifications });
    }),

  /**
   * Update resume content
   * SECURITY: Requires authentication AND ownership verification
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
      verifyProfileOwnership(ctx, input.profileId);
      return ctx.profileRepository.update(input.profileId, {
        resumeContent: input.resumeContent,
        resumePath: input.resumePath,
        parsedAt: new Date().toISOString(),
      });
    }),

  /**
   * Update cover letter template
   * SECURITY: Requires authentication AND ownership verification
   */
  updateCoverLetterTemplate: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        coverLetterTemplate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      verifyProfileOwnership(ctx, input.profileId);
      return ctx.profileRepository.update(input.profileId, {
        coverLetterTemplate: input.coverLetterTemplate,
      });
    }),

  /**
   * Import resume and create/update profile
   * SECURITY: Requires authentication AND ownership verification
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
        verifyProfileOwnership(ctx, input.profileId);
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
   * SECURITY: Requires authentication AND ownership verification of source profile
   */
  duplicateProfile: protectedProcedure
    .input(z.object({ id: z.string(), newName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const profile = verifyProfileOwnership(ctx, input.id);

      // Create a copy of the profile (profile is guaranteed to exist after ownership check)
      const { id, userId, createdAt, updatedAt, isDefault, ...profileData } = profile;

      // Update name if provided
      if (input.newName) {
        const nameParts = input.newName.split(' ');
        profileData.firstName = nameParts[0] || profileData.firstName;
        profileData.lastName = nameParts.slice(1).join(' ') || profileData.lastName;
      } else {
        profileData.firstName = `${profileData.firstName} (Copy)`;
      }

      // Always create the copy under the current user's ownership
      return ctx.profileRepository.create(profileData, ctx.userId);
    }),
});
