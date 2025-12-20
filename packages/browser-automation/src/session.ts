import { Page, BrowserContext } from 'playwright';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BrowserError } from '@job-applier/core';
import { getConfigManager } from '@job-applier/config';
import { getBrowserManager } from './browser.js';

/**
 * Session state
 */
export interface SessionState {
  platform: string;
  loggedIn: boolean;
  cookies: string;
  localStorage?: Record<string, string>;
  lastActivity: string;
}

/**
 * Platform session manager
 */
export class SessionManager {
  private sessionsDir: string;

  constructor() {
    const config = getConfigManager();
    this.sessionsDir = config.ensureDataSubdir('sessions');
  }

  /**
   * Get session file path for a platform
   */
  private getSessionPath(platform: string): string {
    return path.join(this.sessionsDir, `${platform}.json`);
  }

  /**
   * Get cookies file path for a platform
   */
  private getCookiesPath(platform: string): string {
    return path.join(this.sessionsDir, `${platform}-cookies.json`);
  }

  /**
   * Check if a session exists for a platform
   */
  async hasSession(platform: string): Promise<boolean> {
    try {
      await fs.access(this.getSessionPath(platform));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save session state
   */
  async saveSession(
    platform: string,
    context: BrowserContext,
    loggedIn: boolean
  ): Promise<void> {
    try {
      // Save cookies
      const cookies = await context.cookies();
      const cookiesPath = this.getCookiesPath(platform);
      await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));

      // Save session state
      const state: SessionState = {
        platform,
        loggedIn,
        cookies: cookiesPath,
        lastActivity: new Date().toISOString(),
      };

      await fs.writeFile(this.getSessionPath(platform), JSON.stringify(state, null, 2));
    } catch (error) {
      throw new BrowserError(
        `Failed to save session for ${platform}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load session state
   */
  async loadSession(platform: string): Promise<SessionState | null> {
    const sessionPath = this.getSessionPath(platform);

    try {
      await fs.access(sessionPath);
    } catch {
      return null;
    }

    try {
      const content = await fs.readFile(sessionPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load session for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Restore session to a browser context
   */
  async restoreSession(platform: string, context: BrowserContext): Promise<boolean> {
    const state = await this.loadSession(platform);

    if (!state) {
      return false;
    }

    // Check if session is still valid (less than 24 hours old)
    const lastActivity = new Date(state.lastActivity);
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity > 24) {
      console.log(`Session for ${platform} is too old (${hoursSinceActivity.toFixed(1)} hours)`);
      return false;
    }

    // Load cookies
    try {
      await fs.access(state.cookies);
      const cookiesContent = await fs.readFile(state.cookies, 'utf-8');
      const cookies = JSON.parse(cookiesContent);
      await context.addCookies(cookies);
      return true;
    } catch (error) {
      console.error(`Failed to restore cookies for ${platform}:`, error);
      return false;
    }
  }

  /**
   * Delete session for a platform
   */
  async deleteSession(platform: string): Promise<void> {
    const sessionPath = this.getSessionPath(platform);
    const cookiesPath = this.getCookiesPath(platform);

    try {
      await fs.unlink(sessionPath);
    } catch {
      // File doesn't exist, ignore
    }
    try {
      await fs.unlink(cookiesPath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  /**
   * List all saved sessions
   */
  async listSessions(): Promise<SessionState[]> {
    const sessions: SessionState[] = [];

    try {
      await fs.access(this.sessionsDir);
    } catch {
      return sessions;
    }

    const files = await fs.readdir(this.sessionsDir);

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('-cookies')) {
        try {
          const content = await fs.readFile(path.join(this.sessionsDir, file), 'utf-8');
          sessions.push(JSON.parse(content));
        } catch {
          // Skip invalid files
        }
      }
    }

    return sessions;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(maxAgeHours = 24): Promise<number> {
    const sessions = await this.listSessions();
    let cleaned = 0;

    for (const session of sessions) {
      const lastActivity = new Date(session.lastActivity);
      const now = new Date();
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursSinceActivity > maxAgeHours) {
        await this.deleteSession(session.platform);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Lazy-initialized singleton
let _sessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!_sessionManager) {
    _sessionManager = new SessionManager();
  }
  return _sessionManager;
}

// For backwards compatibility - lazy getter
export const sessionManager = {
  get instance() {
    return getSessionManager();
  }
};

/**
 * Create a new page with session restoration
 */
export async function createPageWithSession(
  platform: string
): Promise<{ page: Page; hasSession: boolean }> {
  const manager = getBrowserManager();
  const sessManager = getSessionManager();

  const context = await manager.getContext();
  const hasSession = await sessManager.restoreSession(platform, context);
  const page = await manager.newPage();

  return { page, hasSession };
}

/**
 * Save current page session
 */
export async function savePageSession(
  platform: string,
  page: Page,
  loggedIn: boolean
): Promise<void> {
  const manager = getSessionManager();
  const context = page.context();
  await manager.saveSession(platform, context, loggedIn);
}
