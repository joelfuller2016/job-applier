import * as fs from 'fs';
import * as path from 'path';
import { ConfigError } from '@job-applier/core';
import {
  AppConfig,
  AppConfigSchema,
  ClaudeConfig,
  ExaConfig,
  DatabaseConfig,
  BrowserConfig,
  RateLimitConfig,
  PlatformConfig,
  LoggingConfig,
  ApplicationPreferences,
} from './schema.js';
import { loadConfig, saveConfigFile, mergeConfig } from './loader.js';

/**
 * Configuration manager singleton
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: AppConfig | null = null;
  private configPath: string | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Reset the singleton (for testing)
   */
  static reset(): void {
    ConfigManager.instance = null;
  }

  /**
   * Initialize configuration
   */
  initialize(options?: {
    envPath?: string;
    configPath?: string;
  }): AppConfig {
    this.config = loadConfig(options);
    this.configPath = options?.configPath ?? null;
    return this.config;
  }

  /**
   * Check if configuration is initialized
   */
  isInitialized(): boolean {
    return this.config !== null;
  }

  /**
   * Get the full configuration
   */
  getConfig(): AppConfig {
    if (!this.config) {
      throw new ConfigError('Configuration not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Get Claude API configuration
   */
  getClaude(): ClaudeConfig {
    return this.getConfig().claude;
  }

  /**
   * Get Exa API configuration
   */
  getExa(): ExaConfig {
    return this.getConfig().exa;
  }

  /**
   * Get database configuration
   */
  getDatabase(): DatabaseConfig {
    return this.getConfig().database;
  }

  /**
   * Get browser configuration
   */
  getBrowser(): BrowserConfig {
    return this.getConfig().browser;
  }

  /**
   * Get rate limit configuration
   */
  getRateLimit(): RateLimitConfig {
    return this.getConfig().rateLimit;
  }

  /**
   * Get platform configuration
   */
  getPlatforms(): PlatformConfig {
    return this.getConfig().platforms;
  }

  /**
   * Get logging configuration
   */
  getLogging(): LoggingConfig {
    return this.getConfig().logging;
  }

  /**
   * Get application preferences
   */
  getPreferences(): ApplicationPreferences {
    return this.getConfig().preferences;
  }

  /**
   * Get data directory path
   */
  getDataDir(): string {
    return this.getConfig().dataDir;
  }

  /**
   * Get current environment
   */
  getEnvironment(): 'development' | 'production' | 'test' {
    return this.getConfig().environment;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this.getEnvironment() === 'test';
  }

  /**
   * Update configuration values
   */
  update(updates: Partial<AppConfig>): AppConfig {
    if (!this.config) {
      throw new ConfigError('Configuration not initialized');
    }

    const merged = mergeConfig(this.config, updates);

    // Validate the merged config
    const result = AppConfigSchema.safeParse(merged);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new ConfigError(
        `Invalid configuration update:\n${errors.join('\n')}`
      );
    }

    this.config = result.data;
    return this.config;
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<ApplicationPreferences>): ApplicationPreferences {
    this.update({ preferences: { ...this.getPreferences(), ...updates } });
    return this.getPreferences();
  }

  /**
   * Update rate limits
   */
  updateRateLimits(updates: Partial<RateLimitConfig>): RateLimitConfig {
    this.update({ rateLimit: { ...this.getRateLimit(), ...updates } });
    return this.getRateLimit();
  }

  /**
   * Save current configuration to file
   */
  save(configPath?: string): void {
    const savePath = configPath ?? this.configPath;
    if (!savePath) {
      throw new ConfigError('No configuration path specified');
    }
    if (!this.config) {
      throw new ConfigError('Configuration not initialized');
    }

    // Remove sensitive data before saving
    const safeConfig = this.getSafeConfig();
    saveConfigFile(savePath, safeConfig);
  }

  /**
   * Get configuration without sensitive data
   */
  getSafeConfig(): Partial<AppConfig> {
    const config = this.getConfig();
    return {
      browser: config.browser,
      rateLimit: config.rateLimit,
      logging: config.logging,
      preferences: config.preferences,
      dataDir: config.dataDir,
      environment: config.environment,
      platforms: {
        linkedin: { enabled: config.platforms.linkedin.enabled, useEasyApply: config.platforms.linkedin.useEasyApply },
        indeed: { enabled: config.platforms.indeed.enabled },
        glassdoor: { enabled: config.platforms.glassdoor.enabled },
      },
    };
  }

  /**
   * Validate API keys are present
   */
  validateApiKeys(): { valid: boolean; missing: string[] } {
    const config = this.getConfig();
    const missing: string[] = [];

    if (!config.claude.apiKey) {
      missing.push('ANTHROPIC_API_KEY');
    }
    if (!config.exa.apiKey) {
      missing.push('EXA_API_KEY');
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate platform credentials
   */
  validatePlatformCredentials(): Record<string, { configured: boolean; valid: boolean }> {
    const platforms = this.getPlatforms();

    return {
      linkedin: {
        configured: !!(platforms.linkedin.email && platforms.linkedin.password),
        valid: !!(platforms.linkedin.email && platforms.linkedin.password),
      },
      indeed: {
        configured: !!(platforms.indeed.email && platforms.indeed.password),
        valid: !!(platforms.indeed.email && platforms.indeed.password),
      },
      glassdoor: {
        configured: !!(platforms.glassdoor.email && platforms.glassdoor.password),
        valid: !!(platforms.glassdoor.email && platforms.glassdoor.password),
      },
    };
  }

  /**
   * Get a summary of the current configuration
   */
  getSummary(): {
    environment: string;
    dataDir: string;
    database: string;
    apiKeysConfigured: boolean;
    platformsEnabled: string[];
    rateLimit: { daily: number; hourly: number };
    preferences: { minScore: number; autoApply: boolean };
  } {
    const config = this.getConfig();
    const { valid } = this.validateApiKeys();

    const enabledPlatforms: string[] = [];
    if (config.platforms.linkedin.enabled) enabledPlatforms.push('LinkedIn');
    if (config.platforms.indeed.enabled) enabledPlatforms.push('Indeed');
    if (config.platforms.glassdoor.enabled) enabledPlatforms.push('Glassdoor');

    return {
      environment: config.environment,
      dataDir: config.dataDir,
      database: config.database.path,
      apiKeysConfigured: valid,
      platformsEnabled: enabledPlatforms,
      rateLimit: {
        daily: config.rateLimit.maxApplicationsPerDay,
        hourly: config.rateLimit.maxApplicationsPerHour,
      },
      preferences: {
        minScore: config.preferences.minMatchScore,
        autoApply: config.preferences.autoApply,
      },
    };
  }

  /**
   * Get path for a data file
   */
  getDataPath(filename: string): string {
    return path.join(this.getDataDir(), filename);
  }

  /**
   * Ensure a directory exists within the data directory
   */
  ensureDataSubdir(subdir: string): string {
    const fullPath = path.join(this.getDataDir(), subdir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
  }
}

/**
 * Get the config manager instance
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Initialize and get configuration
 */
export function initConfig(options?: {
  envPath?: string;
  configPath?: string;
}): AppConfig {
  return getConfigManager().initialize(options);
}

/**
 * Get current configuration (must be initialized first)
 */
export function getConfig(): AppConfig {
  return getConfigManager().getConfig();
}
