import { run, get, all, saveDatabase } from '../connection.js';
import {
  PlatformCredentials,
  PlatformCredentialsSchema,
  JobPlatform,
  DatabaseError,
  toISOString,
} from '@job-applier/core';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Encryption settings
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
// AUTH_TAG_LENGTH and SALT_LENGTH are implicit in the algorithm

/**
 * Get encryption key from environment or generate a default
 * In production, this should come from a secure secret manager
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.CREDENTIAL_ENCRYPTION_KEY || 'job-applier-default-key-change-in-production';
  const salt = process.env.CREDENTIAL_ENCRYPTION_SALT || 'job-applier-salt';
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Platform credentials database row
 */
interface CredentialsRow {
  platform: string;
  email: string | null;
  password_encrypted: string | null;
  api_key_encrypted: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  expires_at: string | null;
  cookies: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Platform credentials repository with encryption
 */
export class PlatformCredentialsRepository {
  /**
   * Save or update credentials for a platform
   */
  save(credentials: PlatformCredentials): void {
    const now = toISOString(new Date());

    try {
      // Validate credentials
      const validated = PlatformCredentialsSchema.parse(credentials);

      run(`
        INSERT INTO platform_credentials (
          platform, email, password_encrypted, api_key_encrypted,
          access_token_encrypted, refresh_token_encrypted, expires_at,
          cookies, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(platform) DO UPDATE SET
          email = excluded.email,
          password_encrypted = excluded.password_encrypted,
          api_key_encrypted = excluded.api_key_encrypted,
          access_token_encrypted = excluded.access_token_encrypted,
          refresh_token_encrypted = excluded.refresh_token_encrypted,
          expires_at = excluded.expires_at,
          cookies = excluded.cookies,
          updated_at = excluded.updated_at
      `, [
        validated.platform,
        validated.email ?? null,
        validated.password ? encrypt(validated.password) : null,
        validated.apiKey ? encrypt(validated.apiKey) : null,
        validated.accessToken ? encrypt(validated.accessToken) : null,
        validated.refreshToken ? encrypt(validated.refreshToken) : null,
        validated.expiresAt ?? null,
        validated.cookies ? JSON.stringify(validated.cookies) : null,
        now,
        now,
      ]);

      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to save credentials for ${credentials.platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get credentials for a platform
   */
  findByPlatform(platform: JobPlatform): PlatformCredentials | null {
    try {
      const row = get<CredentialsRow>(
        'SELECT * FROM platform_credentials WHERE platform = ?',
        [platform]
      );

      if (!row) {
        return null;
      }

      return this.rowToCredentials(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get credentials for ${platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all stored credentials
   */
  findAll(): PlatformCredentials[] {
    try {
      const rows = all<CredentialsRow>(
        'SELECT * FROM platform_credentials ORDER BY platform'
      );

      return rows.map(row => this.rowToCredentials(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get all credentials: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete credentials for a platform
   */
  delete(platform: JobPlatform): boolean {
    try {
      const existing = this.findByPlatform(platform);
      if (!existing) {
        return false;
      }

      run('DELETE FROM platform_credentials WHERE platform = ?', [platform]);
      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete credentials for ${platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if credentials exist for a platform
   */
  has(platform: JobPlatform): boolean {
    return this.findByPlatform(platform) !== null;
  }

  /**
   * Update tokens for a platform
   */
  updateTokens(
    platform: JobPlatform,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: string;
    }
  ): boolean {
    try {
      const existing = this.findByPlatform(platform);
      if (!existing) {
        return false;
      }

      const now = toISOString(new Date());

      run(`
        UPDATE platform_credentials SET
          access_token_encrypted = ?,
          refresh_token_encrypted = ?,
          expires_at = ?,
          updated_at = ?
        WHERE platform = ?
      `, [
        tokens.accessToken ? encrypt(tokens.accessToken) : (existing.accessToken ? encrypt(existing.accessToken) : null),
        tokens.refreshToken ? encrypt(tokens.refreshToken) : (existing.refreshToken ? encrypt(existing.refreshToken) : null),
        tokens.expiresAt ?? existing.expiresAt ?? null,
        now,
        platform,
      ]);

      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to update tokens for ${platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update cookies for a platform
   */
  updateCookies(platform: JobPlatform, cookies: PlatformCredentials['cookies']): boolean {
    try {
      const existing = this.findByPlatform(platform);
      if (!existing) {
        return false;
      }

      const now = toISOString(new Date());

      run(`
        UPDATE platform_credentials SET
          cookies = ?,
          updated_at = ?
        WHERE platform = ?
      `, [
        cookies ? JSON.stringify(cookies) : null,
        now,
        platform,
      ]);

      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to update cookies for ${platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if credentials are expired
   */
  isExpired(platform: JobPlatform): boolean {
    const credentials = this.findByPlatform(platform);
    if (!credentials || !credentials.expiresAt) {
      return false;
    }

    return new Date(credentials.expiresAt) < new Date();
  }

  /**
   * Get all configured platforms
   */
  getConfiguredPlatforms(): JobPlatform[] {
    try {
      const rows = all<{ platform: string }>(
        'SELECT platform FROM platform_credentials'
      );

      return rows.map(row => row.platform as JobPlatform);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get configured platforms: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear all credentials
   */
  clear(): void {
    try {
      run('DELETE FROM platform_credentials');
      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to clear credentials: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to PlatformCredentials
   */
  private rowToCredentials(row: CredentialsRow): PlatformCredentials {
    const credentials: PlatformCredentials = {
      platform: row.platform as JobPlatform,
    };

    if (row.email) {
      credentials.email = row.email;
    }

    if (row.password_encrypted) {
      try {
        credentials.password = decrypt(row.password_encrypted);
      } catch {
        // If decryption fails, leave password undefined
      }
    }

    if (row.api_key_encrypted) {
      try {
        credentials.apiKey = decrypt(row.api_key_encrypted);
      } catch {
        // If decryption fails, leave apiKey undefined
      }
    }

    if (row.access_token_encrypted) {
      try {
        credentials.accessToken = decrypt(row.access_token_encrypted);
      } catch {
        // If decryption fails, leave accessToken undefined
      }
    }

    if (row.refresh_token_encrypted) {
      try {
        credentials.refreshToken = decrypt(row.refresh_token_encrypted);
      } catch {
        // If decryption fails, leave refreshToken undefined
      }
    }

    if (row.expires_at) {
      credentials.expiresAt = row.expires_at;
    }

    if (row.cookies) {
      try {
        credentials.cookies = JSON.parse(row.cookies);
      } catch {
        // If parsing fails, leave cookies undefined
      }
    }

    return credentials;
  }
}

// Singleton instance
export const credentialsRepository = new PlatformCredentialsRepository();
