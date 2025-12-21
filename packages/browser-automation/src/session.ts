import { Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { BrowserError, SESSION_SETTINGS } from '@job-applier/core';
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
  hasSession(platform: string): boolean {
    return fs.existsSync(this.getSessionPath(platform));
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
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

      // Save session state
      const state: SessionState = {
        platform,
        loggedIn,
        cookies: cookiesPath,
        lastActivity: new Date().toISOString(),
      };

      fs.writeFileSync(this.getSessionPath(platform), JSON.stringify(state, null, 2));
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

    if (!fs.existsSync(sessionPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(sessionPath, 'utf-8');
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

    // Check if session is still valid (less than SESSION_MAX_AGE_HOURS old)
    const lastActivity = new Date(state.lastActivity);
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity > SESSION_SETTINGS.MAX_AGE_HOURS) {
      console.log(`Session for ${platform} is too old (${hoursSinceActivity.toFixed(1)} hours)`);
      return false;
    }

    // Load cookies
    if (fs.existsSync(state.cookies)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(state.cookies, 'utf-8'));
        await context.addCookies(cookies);
        return true;
      } catch (error) {
        console.error(`Failed to restore cookies for ${platform}:`, error);
        return false;
      }
    }

    return false;
  }

  /**
   * Delete session for a platform
   */
  deleteSession(platform: string): void {
    const sessionPath = this.getSessionPath(platform);
    const cookiesPath = this.getCookiesPath(platform);

    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
    if (fs.existsSync(cookiesPath)) {
      fs.unlinkSync(cookiesPath);
    }
  }

  /**
   * List all saved sessions
   */
  listSessions(): SessionState[] {
    const sessions: SessionState[] = [];

    if (!fs.existsSync(this.sessionsDir)) {
      return sessions;
    }

    const files = fs.readdirSync(this.sessionsDir);

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('-cookies')) {
        try {
          const content = fs.readFileSync(path.join(this.sessionsDir, file), 'utf-8');
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
  cleanupExpiredSessions(maxAgeHours = SESSION_SETTINGS.MAX_AGE_HOURS): number {
    const sessions = this.listSessions();
    let cleaned = 0;

    for (const session of sessions) {
      const lastActivity = new Date(session.lastActivity);
      const now = new Date();
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursSinceActivity > maxAgeHours) {
        this.deleteSession(session.platform);
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
