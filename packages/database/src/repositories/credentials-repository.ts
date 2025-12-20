import { run, get, all, saveDatabase } from '../connection.js';
import { PlatformCredentials, JobPlatform, toISOString, DatabaseError } from '@job-applier/core';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Encryption configuration
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment or generate default
 * In production, this should be a securely stored secret
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY || 'job-applier-default-key-change-me';
  const salt = process.env.CREDENTIALS_ENCRYPTION_SALT || 'job-applier-salt';
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypt a string value
 */
function encrypt(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string value
 */
function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      // Not encrypted or invalid format, return as-is
      return encryptedText;
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // Return as-is if decryption fails (might be plaintext)
    return encryptedText;
  }
}

/**
 * Stored credentials entry (with encrypted fields)
 */
interface StoredCredentials {
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
 * Credentials repository for secure storage of platform credentials
 */
export class CredentialsRepository {
  /**
   * Save or update credentials for a platform
   */
  save(credentials: PlatformCredentials): void {
    const now = toISOString(new Date());

    try {
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
        credentials.platform,
        credentials.email ?? null,
        credentials.password ? encrypt(credentials.password) : null,
        credentials.apiKey ? encrypt(credentials.apiKey) : null,
        credentials.accessToken ? encrypt(credentials.accessToken) : null,
        credentials.refreshToken ? encrypt(credentials.refreshToken) : null,
        credentials.expiresAt ?? null,
        credentials.cookies ? JSON.stringify(credentials.cookies) : null,
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
  get(platform: JobPlatform): PlatformCredentials | null {
    try {
      const row = get<StoredCredentials>(
        'SELECT * FROM platform_credentials WHERE platform = ?',
        [platform]
      );

      if (!row) return null;
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
  getAll(): PlatformCredentials[] {
    try {
      const rows = all<StoredCredentials>(
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
   * Check if credentials exist for a platform
   */
  has(platform: JobPlatform): boolean {
    try {
      const row = get<{ count: number }>(
        'SELECT 1 as count FROM platform_credentials WHERE platform = ?',
        [platform]
      );

      return row !== undefined;
    } catch (error) {
      throw new DatabaseError(
        `Failed to check credentials for ${platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete credentials for a platform
   */
  delete(platform: JobPlatform): boolean {
    try {
      const exists = this.has(platform);
      if (!exists) return false;

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
   * Update tokens for a platform (after refresh)
   */
  updateTokens(
    platform: JobPlatform,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: string
  ): void {
    try {
      const updates: string[] = ['access_token_encrypted = ?', 'updated_at = ?'];
      const params: (string | null)[] = [encrypt(accessToken), toISOString(new Date())];

      if (refreshToken !== undefined) {
        updates.push('refresh_token_encrypted = ?');
        params.push(encrypt(refreshToken));
      }
      if (expiresAt !== undefined) {
        updates.push('expires_at = ?');
        params.push(expiresAt);
      }

      params.push(platform);

      run(`
        UPDATE platform_credentials
        SET ${updates.join(', ')}
        WHERE platform = ?
      `, params);

      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to update tokens for ${platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update cookies for a platform
   */
  updateCookies(
    platform: JobPlatform,
    cookies: PlatformCredentials['cookies']
  ): void {
    try {
      run(`
        UPDATE platform_credentials
        SET cookies = ?, updated_at = ?
        WHERE platform = ?
      `, [
        cookies ? JSON.stringify(cookies) : null,
        toISOString(new Date()),
        platform,
      ]);

      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to update cookies for ${platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if tokens are expired for a platform
   */
  isExpired(platform: JobPlatform): boolean {
    const credentials = this.get(platform);
    if (!credentials || !credentials.expiresAt) {
      return false; // No expiry set
    }

    return new Date(credentials.expiresAt) < new Date();
  }

  /**
   * Get list of configured platforms
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
   * Clear all credentials (use with extreme caution)
   */
  clearAll(): void {
    try {
      run('DELETE FROM platform_credentials');
      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to clear all credentials: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to PlatformCredentials
   */
  private rowToCredentials(row: StoredCredentials): PlatformCredentials {
    const credentials: PlatformCredentials = {
      platform: row.platform as JobPlatform,
    };

    if (row.email) {
      credentials.email = row.email;
    }
    if (row.password_encrypted) {
      credentials.password = decrypt(row.password_encrypted);
    }
    if (row.api_key_encrypted) {
      credentials.apiKey = decrypt(row.api_key_encrypted);
    }
    if (row.access_token_encrypted) {
      credentials.accessToken = decrypt(row.access_token_encrypted);
    }
    if (row.refresh_token_encrypted) {
      credentials.refreshToken = decrypt(row.refresh_token_encrypted);
    }
    if (row.expires_at) {
      credentials.expiresAt = row.expires_at;
    }
    if (row.cookies) {
      credentials.cookies = JSON.parse(row.cookies);
    }

    return credentials;
  }
}

// Singleton instance
export const credentialsRepository = new CredentialsRepository();
