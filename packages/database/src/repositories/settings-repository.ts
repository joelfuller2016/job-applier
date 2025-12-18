import { run, get, all, saveDatabase } from '../connection.js';
import { DatabaseError, toISOString } from '@job-applier/core';

/**
 * Settings entry interface
 */
export interface SettingEntry {
  key: string;
  value: string;
  updatedAt: string;
}

/**
 * Settings repository for key-value storage
 */
export class SettingsRepository {
  /**
   * Get a setting value
   */
  get<T = string>(key: string): T | null {
    try {
      const row = get<Record<string, unknown>>(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );

      if (!row) {
        return null;
      }

      const value = row.value as string;

      // Try to parse JSON, otherwise return as string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to get setting '${key}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Set a setting value
   */
  set<T = string>(key: string, value: T): void {
    const now = toISOString(new Date());
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    try {
      run(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `, [key, stringValue, now]);

      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to set setting '${key}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
  getAll(): SettingEntry[] {
    try {
      const rows = all<Record<string, unknown>>(
        'SELECT key, value, updated_at FROM settings ORDER BY key'
      );

      return rows.map(row => ({
        key: row.key as string,
        value: row.value as string,
        updatedAt: row.updated_at as string,
      }));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get all settings: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get multiple settings by keys
   */
  getMultiple<T extends Record<string, unknown>>(keys: string[]): Partial<T> {
    const result: Record<string, unknown> = {};

    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result as Partial<T>;
  }

  /**
   * Set multiple settings at once
   */
  setMultiple(settings: Record<string, unknown>): void {
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
   * Get setting with default value
   */
  getOrDefault<T = string>(key: string, defaultValue: T): T {
    const value = this.get<T>(key);
    return value !== null ? value : defaultValue;
  }

  /**
   * Clear all settings
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
