import { run, get, all, saveDatabase } from '../connection.js';
import {
  UserProfile,
  UserProfileSchema,
  generateId,
  toISOString,
  DatabaseError,
} from '@job-applier/core';

/**
 * Extended profile type with additional fields for database
 */
export interface ExtendedProfile extends UserProfile {
  userId?: string;
  resumeContent?: string;
  coverLetterTemplate?: string;
  isDefault?: boolean;
}

/**
 * Profile repository for database operations
 */
export class ProfileRepository {
  /**
   * Create a new profile
   */
  create(profile: Omit<ExtendedProfile, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): ExtendedProfile {
    const now = toISOString(new Date());

    const newProfile: ExtendedProfile = {
      ...profile,
      id: generateId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };

    // If this is the first profile for a user, make it default
    if (userId) {
      const existingProfiles = this.findByUserId(userId);
      if (existingProfiles.length === 0) {
        newProfile.isDefault = true;
      }
    }

    try {
      run(`
        INSERT INTO profiles (
          id, user_id, name, headline, summary, contact_info, experience, education,
          skills, certifications, projects, preferences, resume_path, resume_content,
          cover_letter_template, is_default, parsed_at, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        newProfile.id,
        newProfile.userId ?? null,
        `${newProfile.firstName} ${newProfile.lastName}`,
        newProfile.headline ?? null,
        newProfile.summary ?? null,
        JSON.stringify(newProfile.contact),
        JSON.stringify(newProfile.experience),
        JSON.stringify(newProfile.education),
        JSON.stringify(newProfile.skills),
        JSON.stringify(newProfile.certifications ?? []),
        JSON.stringify(newProfile.projects ?? []),
        JSON.stringify(newProfile.preferences),
        newProfile.resumePath ?? null,
        newProfile.resumeContent ?? null,
        newProfile.coverLetterTemplate ?? null,
        newProfile.isDefault ? 1 : 0,
        newProfile.parsedAt ?? null,
        newProfile.createdAt,
        newProfile.updatedAt
      ]);

      saveDatabase();
      return newProfile;
    } catch (error) {
      throw new DatabaseError(
        `Failed to create profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find a profile by ID
   */
  findById(id: string): ExtendedProfile | null {
    try {
      const row = get<Record<string, unknown>>('SELECT * FROM profiles WHERE id = ?', [id]);

      if (!row) {
        return null;
      }

      return this.rowToProfile(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find profiles by user ID
   */
  findByUserId(userId: string): ExtendedProfile[] {
    try {
      const rows = all<Record<string, unknown>>(
        'SELECT * FROM profiles WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
        [userId]
      );
      return rows.map(row => this.rowToProfile(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find profiles by user: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the default profile for a user
   */
  getDefaultForUser(userId: string): ExtendedProfile | null {
    try {
      const row = get<Record<string, unknown>>(
        'SELECT * FROM profiles WHERE user_id = ? AND is_default = 1',
        [userId]
      );

      if (!row) {
        // Fall back to first profile
        const profiles = this.findByUserId(userId);
        return profiles[0] ?? null;
      }

      return this.rowToProfile(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find default profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Set a profile as default for a user
   */
  setDefault(id: string, userId: string): ExtendedProfile | null {
    try {
      // Unset all profiles as default for this user
      run('UPDATE profiles SET is_default = 0 WHERE user_id = ?', [userId]);

      // Set the specified profile as default
      run('UPDATE profiles SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);

      saveDatabase();
      return this.findById(id);
    } catch (error) {
      throw new DatabaseError(
        `Failed to set default profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find all profiles
   */
  findAll(): ExtendedProfile[] {
    try {
      const rows = all<Record<string, unknown>>('SELECT * FROM profiles ORDER BY created_at DESC');
      return rows.map(row => this.rowToProfile(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find profiles: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update a profile
   */
  update(id: string, updates: Partial<ExtendedProfile>): ExtendedProfile | null {
    const existing = this.findById(id);

    if (!existing) {
      return null;
    }

    const updated: ExtendedProfile = {
      ...existing,
      ...updates,
      id: existing.id,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: toISOString(new Date()),
    };

    try {
      run(`
        UPDATE profiles SET
          name = ?, headline = ?, summary = ?, contact_info = ?,
          experience = ?, education = ?, skills = ?, certifications = ?,
          projects = ?, preferences = ?, resume_path = ?, resume_content = ?,
          cover_letter_template = ?, is_default = ?, parsed_at = ?, updated_at = ?
        WHERE id = ?
      `, [
        `${updated.firstName} ${updated.lastName}`,
        updated.headline ?? null,
        updated.summary ?? null,
        JSON.stringify(updated.contact),
        JSON.stringify(updated.experience),
        JSON.stringify(updated.education),
        JSON.stringify(updated.skills),
        JSON.stringify(updated.certifications ?? []),
        JSON.stringify(updated.projects ?? []),
        JSON.stringify(updated.preferences),
        updated.resumePath ?? null,
        updated.resumeContent ?? null,
        updated.coverLetterTemplate ?? null,
        updated.isDefault ? 1 : 0,
        updated.parsedAt ?? null,
        updated.updatedAt,
        id
      ]);

      saveDatabase();
      return updated;
    } catch (error) {
      throw new DatabaseError(
        `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a profile
   */
  delete(id: string): boolean {
    try {
      const existing = this.findById(id);
      if (!existing) {
        return false;
      }

      run('DELETE FROM profiles WHERE id = ?', [id]);
      saveDatabase();

      // If this was the default profile, make another one default
      if (existing.isDefault && existing.userId) {
        const remaining = this.findByUserId(existing.userId);
        if (remaining.length > 0) {
          this.setDefault(remaining[0].id, existing.userId);
        }
      }

      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the default/primary profile (legacy support)
   */
  getDefault(): ExtendedProfile | null {
    const profiles = this.findAll();
    return profiles[0] ?? null;
  }

  /**
   * Convert database row to ExtendedProfile
   */
  private rowToProfile(row: Record<string, unknown>): ExtendedProfile {
    // Split the database 'name' field back into firstName and lastName
    const fullName = (row.name as string) || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const profile: ExtendedProfile = {
      id: row.id as string,
      userId: row.user_id as string | undefined,
      firstName,
      lastName,
      headline: row.headline ? (row.headline as string) : undefined,
      summary: row.summary ? (row.summary as string) : undefined,
      contact: JSON.parse(row.contact_info as string),
      experience: JSON.parse(row.experience as string),
      education: JSON.parse(row.education as string),
      skills: JSON.parse(row.skills as string),
      certifications: JSON.parse((row.certifications as string) || '[]'),
      projects: JSON.parse((row.projects as string) || '[]'),
      preferences: JSON.parse(row.preferences as string),
      resumePath: row.resume_path ? (row.resume_path as string) : undefined,
      resumeContent: row.resume_content ? (row.resume_content as string) : undefined,
      coverLetterTemplate: row.cover_letter_template ? (row.cover_letter_template as string) : undefined,
      isDefault: (row.is_default as number) === 1,
      parsedAt: row.parsed_at ? (row.parsed_at as string) : undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };

    // Validate the base profile
    const result = UserProfileSchema.safeParse(profile);
    if (!result.success) {
      throw new DatabaseError(
        `Invalid profile data in database: ${result.error.message}`
      );
    }

    return profile;
  }
}

// Singleton instance
export const profileRepository = new ProfileRepository();
