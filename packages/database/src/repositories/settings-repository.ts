import { run, get, all, saveDatabase } from '../connection.js';
import { DatabaseError } from '@job-applier/core';

/**
 * Settings repository for key-value storage
 * Provides a flexible way to store application settings and configuration
 */
export class SettingsRepository {
  /**
   * Set a value for a key
   */
  set(key: string, value: unknown): void {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);

      run(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `, [key, serialized]);

      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to set setting '${key}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a value by key
   */
  get<T = string>(key: string): T | null {
    try {
      const row = get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);

      if (!row) {
        return null;
      }

      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(row.value) as T;
      } catch {
        return row.value as T;
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to get setting '${key}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a value with a default fallback
   */
  getOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.get<T>(key);
    return value !== null ? value : defaultValue;
  }

  /**
   * Delete a setting
   */
  delete(key: string): boolean {
    try {
      const existing = this.get(key);
      if (existing === null) {
        return false;
      }

      run('DELETE FROM settings WHERE key = ?', [key]);
      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete setting '${key}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all settings
   */
  getAll(): Record<string, unknown> {
    try {
      const rows = all<{ key: string; value: string }>('SELECT key, value FROM settings');

      const settings: Record<string, unknown> = {};
      for (const row of rows) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }

      return settings;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get all settings: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get settings by prefix (e.g., 'platform.' for all platform settings)
   */
  getByPrefix(prefix: string): Record<string, unknown> {
    try {
      const rows = all<{ key: string; value: string }>(
        'SELECT key, value FROM settings WHERE key LIKE ?',
        [`${prefix}%`]
      );

      const settings: Record<string, unknown> = {};
      for (const row of rows) {
        // Remove prefix from key for cleaner object
        const keyWithoutPrefix = row.key.slice(prefix.length);
        try {
          settings[keyWithoutPrefix] = JSON.parse(row.value);
        } catch {
          settings[keyWithoutPrefix] = row.value;
        }
      }

      return settings;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get settings by prefix '${prefix}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Set multiple settings at once
   */
  setMany(settings: Record<string, unknown>): void {
    try {
      for (const [key, value] of Object.entries(settings)) {
        this.set(key, value);
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to set multiple settings: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if a setting exists
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all settings (use with caution)
   */
  clear(): void {
    try {
      run('DELETE FROM settings');
      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to clear settings: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// Singleton instance
export const settingsRepository = new SettingsRepository();
