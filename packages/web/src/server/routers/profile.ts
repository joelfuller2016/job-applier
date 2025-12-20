/**
 * Profile Router
 * Handles user profile operations with multi-profile support
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { UserProfileSchema, JobPreferencesSchema, ContactInfoSchema, SkillSchema, WorkExperienceSchema, EducationSchema, CertificationSchema, ProjectSchema } from '@job-applier/core';

/**
 * Extended profile schema with additional fields
 */
const ExtendedProfileInputSchema = UserProfileSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  resumeContent: z.string().optional(),
  coverLetterTemplate: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Map of action verbs to their past tense forms for error messages
 */
const ACTION_PAST_TENSE: Record<string, string> = {
  modify: 'modified',
  delete: 'deleted',
  duplicate: 'duplicated',
  access: 'accessed',
  use: 'used',
};

/**
 * Helper function to verify profile ownership
 * SECURITY: Throws FORBIDDEN if user doesn't own the profile
 */
function verifyProfileOwnership(
  profile: { userId?: string | null },
  userId: string,
  action: string = 'modify'
) {
  const pastTense = ACTION_PAST_TENSE[action] || `${action}d`;
  
  if (!profile.userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `This profile has no owner and cannot be ${pastTense}.`,
    });
  }
  if (profile.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You do not have permission to ${action} this profile`,
    });
  }
}

/**
 * Helper function to get profile with unified error handling
 * SECURITY: Returns same error for not-found and not-owned (prevents enumeration)
 */
function getOwnedProfile(
  profileRepository: { findById: (id: string) => { userId?: string | null } | null },
  profileId: string,
  userId: string
): { userId?: string | null } {
  const profile = profileRepository.findById(profileId);
  
  // SECURITY: Unified error prevents profile ID enumeration
  if (!profile || !profile.userId || profile.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied',
    });
  }
  
  return profile;
}


/**
 * Profile router with CRUD operations
 */
export const profileRouter = router({
  /**
   * Get the current user's default profile
   * SECURITY: Requires authentication, returns only user's profile
   */
  getCurrentProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.profileRepository.getDefaultForUser(ctx.userId);
    }),

  /**
   * Get user profile by ID
   * SECURITY: Requires authentication and ownership
   * Uses unified error to prevent profile ID enumeration
   */
  getProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // SECURITY: Unified error for not-found and not-owned
      return getOwnedProfile(ctx.profileRepository, input.id, ctx.userId);
    }),

  /**
   * Get all profiles for the current user
   * SECURITY: Requires authentication, returns only user's profiles
   */
  listProfiles: protectedProcedure
    .query(async ({ ctx }) => {
      // SECURITY: Only return profiles owned by the authenticated user
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
   * SECURITY: Requires authentication and ownership
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: ExtendedProfileInputSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Unified error for not-found and not-owned
      getOwnedProfile(ctx.profileRepository, input.id, ctx.userId);
      
      const updated = ctx.profileRepository.update(input.id, input.data);
      return updated;
    }),

  /**
   * Delete a profile
   * SECURITY: Requires authentication and ownership
   */
  deleteProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Unified error for not-found and not-owned
      getOwnedProfile(ctx.profileRepository, input.id, ctx.userId);

      ctx.profileRepository.delete(input.id);
      return { success: true };
    }),

  /**
   * Set a profile as default
   * SECURITY: Requires authentication and ownership
   */
  setDefaultProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Unified error for not-found and not-owned
      getOwnedProfile(ctx.profileRepository, input.id, ctx.userId);

      return ctx.profileRepository.setDefault(input.id, ctx.userId);
    }),

  /**
   * Update profile contact information
   */
  updateContactInfo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        contact: ContactInfoSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Unified error for not-found and not-owned
      getOwnedProfile(ctx.profileRepository, input.id, ctx.userId);
      
      return ctx.profileRepository.update(input.id, { contact: input.contact });
    }),

  /**
   * Update profile job preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        preferences: JobPreferencesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Unified error for not-found and not-owned
      getOwnedProfile(ctx.profileRepository, input.id, ctx.userId);
      
      return ctx.profileRepository.update(input.id, { preferences: input.preferences });
    }),

  /**
   * Add a skill to profile
   */
  addSkill: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        skill: SkillSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { skills?: Array<{ name: string }> };

      const skills = [...(profile.skills || []), input.skill];
      return ctx.profileRepository.update(input.profileId, { skills });
    }),

  /**
   * Remove a skill from profile
   */
  removeSkill: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        skillName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { skills?: Array<{ name: string }> };

      const skills = (profile.skills || []).filter(s => s.name !== input.skillName);
      return ctx.profileRepository.update(input.profileId, { skills });
    }),

  /**
   * Add work experience
   */
  addExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experience: WorkExperienceSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { experience?: Array<unknown> };

      const experience = [...(profile.experience || []), input.experience];
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Update work experience
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
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { experience?: Array<{ id?: string }> };

      const experience = (profile.experience || []).map(exp =>
        exp.id === input.experienceId ? { ...exp, ...input.experience } : exp
      );
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Remove work experience
   */
  removeExperience: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        experienceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { experience?: Array<{ id?: string }> };

      const experience = (profile.experience || []).filter(e => e.id !== input.experienceId);
      return ctx.profileRepository.update(input.profileId, { experience });
    }),

  /**
   * Add education
   */
  addEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        education: EducationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { education?: Array<unknown> };

      const education = [...(profile.education || []), input.education];
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Update education
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
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { education?: Array<{ id?: string }> };

      const education = (profile.education || []).map(edu =>
        edu.id === input.educationId ? { ...edu, ...input.education } : edu
      );
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Remove education
   */
  removeEducation: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        educationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { education?: Array<{ id?: string }> };

      const education = (profile.education || []).filter(e => e.id !== input.educationId);
      return ctx.profileRepository.update(input.profileId, { education });
    }),

  /**
   * Add project
   */
  addProject: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        project: ProjectSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { projects?: Array<unknown> };

      const projects = [...(profile.projects || []), input.project];
      return ctx.profileRepository.update(input.profileId, { projects });
    }),

  /**
   * Add certification
   */
  addCertification: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        certification: CertificationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId) as { certifications?: Array<unknown> };

      const certifications = [...(profile.certifications || []), input.certification];
      return ctx.profileRepository.update(input.profileId, { certifications });
    }),

  /**
   * Update resume content
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
      // SECURITY: Unified error for not-found and not-owned
      getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId);
      
      return ctx.profileRepository.update(input.profileId, {
        resumeContent: input.resumeContent,
        resumePath: input.resumePath,
        parsedAt: new Date().toISOString(),
      });
    }),

  /**
   * Update cover letter template
   */
  updateCoverLetterTemplate: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        coverLetterTemplate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Unified error for not-found and not-owned
      getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId);
      
      return ctx.profileRepository.update(input.profileId, {
        coverLetterTemplate: input.coverLetterTemplate,
      });
    }),

  /**
   * Import resume and create/update profile
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
        // SECURITY: Unified error for not-found and not-owned
        getOwnedProfile(ctx.profileRepository, input.profileId, ctx.userId);

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
   */
  duplicateProfile: protectedProcedure
    .input(z.object({ id: z.string(), newName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const profile = getOwnedProfile(ctx.profileRepository, input.id, ctx.userId) as {
        id?: string;
        userId?: string;
        createdAt?: string;
        updatedAt?: string;
        isDefault?: boolean;
        firstName?: string;
        lastName?: string;
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

      return ctx.profileRepository.create(profileData, ctx.userId);
    }),
});
