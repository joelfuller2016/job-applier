import { run, get, all, saveDatabase } from '../connection.js';
import {
  UserProfile,
  UserProfileSchema,
  generateId,
  toISOString,
  DatabaseError,
} from '@job-applier/core';

/**
 * Profile repository for database operations
 */
export class ProfileRepository {
  /**
   * Create a new profile
   */
  create(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): UserProfile {
    const now = toISOString(new Date());

    const newProfile: UserProfile = {
      ...profile,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      run(`
        INSERT INTO profiles (
          id, name, headline, summary, contact_info, experience, education,
          skills, certifications, projects, preferences, resume_path, parsed_at,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        newProfile.id,
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
  findById(id: string): UserProfile | null {
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
   * Find all profiles
   */
  findAll(): UserProfile[] {
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
  update(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const existing = this.findById(id);

    if (!existing) {
      return null;
    }

    const updated: UserProfile = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: toISOString(new Date()),
    };

    try {
      run(`
        UPDATE profiles SET
          name = ?, headline = ?, summary = ?, contact_info = ?,
          experience = ?, education = ?, skills = ?, certifications = ?,
          projects = ?, preferences = ?, resume_path = ?, parsed_at = ?,
          updated_at = ?
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
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the default/primary profile
   */
  getDefault(): UserProfile | null {
    const profiles = this.findAll();
    return profiles[0] ?? null;
  }

  /**
   * Convert database row to UserProfile
   */
  private rowToProfile(row: Record<string, unknown>): UserProfile {
    // Split the database 'name' field back into firstName and lastName
    const fullName = (row.name as string) || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const profile = {
      id: row.id as string,
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
      parsedAt: row.parsed_at ? (row.parsed_at as string) : undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };

    // Validate the profile
    const result = UserProfileSchema.safeParse(profile);
    if (!result.success) {
      throw new DatabaseError(
        `Invalid profile data in database: ${result.error.message}`
      );
    }

    return result.data;
  }
}

// Singleton instance
export const profileRepository = new ProfileRepository();
