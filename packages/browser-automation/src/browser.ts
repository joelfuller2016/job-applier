import {
  chromium,
  Browser,
  BrowserContext,
  Page,
  LaunchOptions,
} from 'playwright';
import { getConfigManager, BrowserConfig } from '@job-applier/config';
import { BrowserError } from '@job-applier/core';

/**
 * Browser manager singleton
 */
export class BrowserManager {
  private static instance: BrowserManager | null = null;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: BrowserConfig;

  private constructor(config: BrowserConfig) {
    this.config = config;
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      const config = getConfigManager().getBrowser();
      BrowserManager.instance = new BrowserManager(config);
    }
    return BrowserManager.instance;
  }

  /**
   * Reset the singleton (for testing)
   */
  static reset(): void {
    if (BrowserManager.instance) {
      BrowserManager.instance.close().catch(console.error);
    }
    BrowserManager.instance = null;
  }

  /**
   * Launch the browser
   */
  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const launchOptions: LaunchOptions = {
      headless: this.config.headless,
      slowMo: this.config.slowMo,
    };

    try {
      this.browser = await chromium.launch(launchOptions);
      return this.browser;
    } catch (error) {
      throw new BrowserError(
        `Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get or create a browser context
   */
  async getContext(): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }

    const browser = await this.launch();

    try {
      this.context = await browser.newContext({
        viewport: this.config.viewport,
        userAgent: this.config.userAgent,
      });

      return this.context;
    } catch (error) {
      throw new BrowserError(
        `Failed to create browser context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a new page
   */
  async newPage(): Promise<Page> {
    const context = await this.getContext();

    try {
      const page = await context.newPage();
      page.setDefaultTimeout(this.config.timeout);
      return page;
    } catch (error) {
      throw new BrowserError(
        `Failed to create new page: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Check if browser is running
   */
  isRunning(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(console.error);
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close().catch(console.error);
      this.browser = null;
    }
  }

  /**
   * Take a screenshot of a page
   */
  async screenshot(page: Page, path: string): Promise<void> {
    try {
      await page.screenshot({ path, fullPage: true });
    } catch (error) {
      throw new BrowserError(
        `Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Save cookies from context
   */
  async saveCookies(path: string): Promise<void> {
    if (!this.context) {
      throw new BrowserError('No browser context available');
    }

    try {
      const cookies = await this.context.cookies();
      const { promises: fs } = await import('fs');
      await fs.writeFile(path, JSON.stringify(cookies, null, 2));
    } catch (error) {
      throw new BrowserError(
        `Failed to save cookies: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load cookies into context
   */
  async loadCookies(path: string): Promise<void> {
    if (!this.context) {
      throw new BrowserError('No browser context available');
    }

    try {
      const { promises: fs } = await import('fs');
      try {
        await fs.access(path);
      } catch {
        // File doesn't exist, nothing to load
        return;
      }

      const cookies = JSON.parse(await fs.readFile(path, 'utf-8'));
      await this.context.addCookies(cookies);
    } catch (error) {
      throw new BrowserError(
        `Failed to load cookies: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Get the browser manager instance
 */
export function getBrowserManager(): BrowserManager {
  return BrowserManager.getInstance();
}
