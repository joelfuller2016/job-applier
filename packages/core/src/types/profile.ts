import { z } from 'zod';

/**
 * Contact information for a user profile
 */
export const ContactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  portfolio: z.string().url().optional(),
  location: z.string().optional(),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;

/**
 * Work experience entry
 */
export const WorkExperienceSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string(), // ISO date
  endDate: z.string().nullable(), // null means current
  description: z.string(),
  highlights: z.array(z.string()),
  skills: z.array(z.string()),
});

export type WorkExperience = z.infer<typeof WorkExperienceSchema>;

/**
 * Education entry
 */
export const EducationSchema = z.object({
  id: z.string().uuid(),
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  gpa: z.number().min(0).max(4).optional(),
  honors: z.array(z.string()).optional(),
});

export type Education = z.infer<typeof EducationSchema>;

/**
 * Skill with proficiency level
 */
export const SkillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['technical', 'soft', 'language', 'tool', 'framework', 'other']),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number().min(0).optional(),
});

export type Skill = z.infer<typeof SkillSchema>;

/**
 * Certification or license
 */
export const CertificationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  issuer: z.string().min(1),
  issueDate: z.string(),
  expirationDate: z.string().nullable(),
  credentialId: z.string().optional(),
  url: z.string().url().optional(),
});

export type Certification = z.infer<typeof CertificationSchema>;

/**
 * Project entry for portfolio
 */
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  url: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  technologies: z.array(z.string()),
  highlights: z.array(z.string()),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * Job preferences for matching
 */
export const JobPreferencesSchema = z.object({
  targetRoles: z.array(z.string()),
  targetIndustries: z.array(z.string()).optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  preferredLocations: z.array(z.string()),
  remotePreference: z.enum(['remote-only', 'hybrid', 'onsite', 'flexible']),
  willingToRelocate: z.boolean(),
  excludedCompanies: z.array(z.string()).optional(),
  excludedIndustries: z.array(z.string()).optional(),
  visaRequired: z.boolean().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
});

export type JobPreferences = z.infer<typeof JobPreferencesSchema>;

/**
 * Complete user profile for job applications
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  headline: z.string().optional(), // Professional headline
  summary: z.string().optional(), // Professional summary
  contact: ContactInfoSchema,
  experience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  skills: z.array(SkillSchema),
  certifications: z.array(CertificationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  preferences: JobPreferencesSchema,
  resumePath: z.string().optional(), // Path to original resume file
  parsedAt: z.string().optional(), // ISO timestamp of last parse
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Parsed resume data from AI analysis
 */
export const ParsedResumeSchema = z.object({
  rawText: z.string(),
  profile: UserProfileSchema.partial(),
  extractedSkills: z.array(z.string()),
  suggestedRoles: z.array(z.string()),
  strengthAreas: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
  parseConfidence: z.number().min(0).max(1),
  parseTimestamp: z.string(),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;
