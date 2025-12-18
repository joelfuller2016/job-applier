import { run, get, all, saveDatabase } from '../connection.js';
import { generateId, toISOString, DatabaseError } from '@job-applier/core';

/**
 * User type for database operations
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  provider: string;
  providerAccountId: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/**
 * User repository for database operations
 */
export class UserRepository {
  /**
   * Create a new user
   */
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>): User {
    const now = toISOString(new Date());

    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    try {
      run(`
        INSERT INTO users (
          id, email, name, image, provider, provider_account_id,
          email_verified, created_at, updated_at, last_login_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newUser.id,
        newUser.email,
        newUser.name,
        newUser.image,
        newUser.provider,
        newUser.providerAccountId,
        newUser.emailVerified ? 1 : 0,
        newUser.createdAt,
        newUser.updatedAt,
        newUser.lastLoginAt,
      ]);

      saveDatabase();
      return newUser;
    } catch (error) {
      throw new DatabaseError(
        `Failed to create user: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find a user by ID
   */
  findById(id: string): User | null {
    try {
      const row = get<Record<string, unknown>>('SELECT * FROM users WHERE id = ?', [id]);

      if (!row) {
        return null;
      }

      return this.rowToUser(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find user: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find a user by email
   */
  findByEmail(email: string): User | null {
    try {
      const row = get<Record<string, unknown>>('SELECT * FROM users WHERE email = ?', [email]);

      if (!row) {
        return null;
      }

      return this.rowToUser(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find user by email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find a user by provider and provider account ID
   */
  findByProvider(provider: string, providerAccountId: string): User | null {
    try {
      const row = get<Record<string, unknown>>(
        'SELECT * FROM users WHERE provider = ? AND provider_account_id = ?',
        [provider, providerAccountId]
      );

      if (!row) {
        return null;
      }

      return this.rowToUser(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find user by provider: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find or create a user from OAuth provider
   */
  findOrCreateFromOAuth(data: {
    email: string;
    name: string | null;
    image: string | null;
    provider: string;
    providerAccountId: string;
  }): User {
    // First try to find by provider + account ID
    let user = this.findByProvider(data.provider, data.providerAccountId);

    if (user) {
      // Update last login
      this.updateLastLogin(user.id);
      return user;
    }

    // Try to find by email
    user = this.findByEmail(data.email);

    if (user) {
      // Link provider to existing user
      this.linkProvider(user.id, data.provider, data.providerAccountId);
      this.updateLastLogin(user.id);
      return user;
    }

    // Create new user
    return this.create({
      email: data.email,
      name: data.name,
      image: data.image,
      provider: data.provider,
      providerAccountId: data.providerAccountId,
      emailVerified: true, // OAuth emails are verified
    });
  }

  /**
   * Update user
   */
  update(id: string, updates: Partial<User>): User | null {
    const existing = this.findById(id);

    if (!existing) {
      return null;
    }

    const updated: User = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: toISOString(new Date()),
    };

    try {
      run(`
        UPDATE users SET
          email = ?, name = ?, image = ?, provider = ?,
          provider_account_id = ?, email_verified = ?, updated_at = ?
        WHERE id = ?
      `, [
        updated.email,
        updated.name,
        updated.image,
        updated.provider,
        updated.providerAccountId,
        updated.emailVerified ? 1 : 0,
        updated.updatedAt,
        id
      ]);

      saveDatabase();
      return updated;
    } catch (error) {
      throw new DatabaseError(
        `Failed to update user: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin(id: string): void {
    try {
      run(
        'UPDATE users SET last_login_at = ? WHERE id = ?',
        [toISOString(new Date()), id]
      );
      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to update last login: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Link a provider to an existing user
   */
  linkProvider(id: string, provider: string, providerAccountId: string): void {
    try {
      run(
        'UPDATE users SET provider = ?, provider_account_id = ? WHERE id = ?',
        [provider, providerAccountId, id]
      );
      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to link provider: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a user
   */
  delete(id: string): boolean {
    try {
      const existing = this.findById(id);
      if (!existing) {
        return false;
      }

      run('DELETE FROM users WHERE id = ?', [id]);
      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete user: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find all users
   */
  findAll(): User[] {
    try {
      const rows = all<Record<string, unknown>>('SELECT * FROM users ORDER BY created_at DESC');
      return rows.map(row => this.rowToUser(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find users: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to User
   */
  private rowToUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string,
      name: row.name as string | null,
      image: row.image as string | null,
      provider: row.provider as string,
      providerAccountId: row.provider_account_id as string | null,
      emailVerified: (row.email_verified as number) === 1,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      lastLoginAt: row.last_login_at as string | null,
    };
  }
}

// Singleton instance
export const userRepository = new UserRepository();
