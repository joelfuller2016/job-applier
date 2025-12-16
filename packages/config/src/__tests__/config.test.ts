import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager, getConfigManager, initConfig } from '../manager.js';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

describe('ConfigManager', () => {
  let testDataDir: string;
  let configManager: ConfigManager;
  let testConfigPath: string;

  beforeEach(() => {
    ConfigManager.reset();
    testDataDir = path.join(process.cwd(), `.test-data-${randomUUID()}`);
    fs.mkdirSync(testDataDir, { recursive: true });
    testConfigPath = path.join(testDataDir, 'config.json');

    // Set required environment variables for testing
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.EXA_API_KEY = 'test-exa-key';
    process.env.NODE_ENV = 'test';

    configManager = getConfigManager();
    configManager.initialize({
      configPath: testConfigPath,
    });
  });

  afterEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.EXA_API_KEY;
    delete process.env.NODE_ENV;
    ConfigManager.reset();
  });

  describe('Configuration Loading', () => {
    it('should create default config if none exists', () => {
      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.claude).toBeDefined();
      expect(config.exa).toBeDefined();
      expect(config.database).toBeDefined();
      expect(config.browser).toBeDefined();
      expect(config.rateLimit).toBeDefined();
      expect(config.platforms).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.preferences).toBeDefined();
    });

    it('should load existing config from file', () => {
      const testConfig = {
        browser: {
          headless: true,
          timeout: 60000,
        },
        rateLimit: {
          maxApplicationsPerDay: 50,
          maxApplicationsPerHour: 10,
          delayBetweenApplications: { min: 30, max: 60 },
        },
        platforms: {
          linkedin: { enabled: true, useEasyApply: true },
          indeed: { enabled: false },
          glassdoor: { enabled: false },
        },
        preferences: {
          minMatchScore: 0.7,
          autoApply: false,
        },
        logging: {
          level: 'info',
          file: 'logs/app.log',
        },
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));

      ConfigManager.reset();
      configManager = getConfigManager();
      configManager.initialize({ configPath: testConfigPath });
      const loaded = configManager.getConfig();

      expect(loaded.rateLimit.maxApplicationsPerDay).toBe(50);
      expect(loaded.platforms.indeed.enabled).toBe(false);
      expect(loaded.preferences.minMatchScore).toBe(0.7);
    });

    it('should check initialization status', () => {
      ConfigManager.reset();
      const newManager = getConfigManager();
      expect(newManager.isInitialized()).toBe(false);

      newManager.initialize();
      expect(newManager.isInitialized()).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should update browser settings', () => {
      configManager.update({
        browser: {
          headless: false,
          timeout: 120000,
        },
      });

      const config = configManager.getConfig();
      expect(config.browser.headless).toBe(false);
      expect(config.browser.timeout).toBe(120000);
    });

    it('should update rate limit settings', () => {
      configManager.updateRateLimits({
        maxApplicationsPerDay: 100,
        maxApplicationsPerHour: 20,
      });

      const rateLimit = configManager.getRateLimit();
      expect(rateLimit.maxApplicationsPerDay).toBe(100);
      expect(rateLimit.maxApplicationsPerHour).toBe(20);
    });

    it('should update preferences', () => {
      configManager.updatePreferences({
        minMatchScore: 0.8,
        autoApply: true,
      });

      const preferences = configManager.getPreferences();
      expect(preferences.minMatchScore).toBe(0.8);
      expect(preferences.autoApply).toBe(true);
    });

    it('should update platform settings', () => {
      configManager.update({
        platforms: {
          linkedin: { enabled: true, useEasyApply: true },
          indeed: { enabled: false },
          glassdoor: { enabled: false },
        },
      });

      const platforms = configManager.getPlatforms();
      expect(platforms.linkedin.enabled).toBe(true);
      expect(platforms.linkedin.useEasyApply).toBe(true);
      expect(platforms.indeed.enabled).toBe(false);
    });

    it('should accept valid configuration updates', () => {
      // Test that valid updates work
      configManager.update({
        preferences: {
          minMatchScore: 0.8,
          autoApply: false,
        },
      });

      const config = configManager.getConfig();
      expect(config.preferences.minMatchScore).toBe(0.8);
      expect(config.preferences.autoApply).toBe(false);
    });
  });

  describe('Configuration Persistence', () => {
    it('should save config to file', () => {
      configManager.updateRateLimits({
        maxApplicationsPerDay: 75,
      });

      configManager.save();

      expect(fs.existsSync(testConfigPath)).toBe(true);

      const savedConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
      expect(savedConfig.rateLimit.maxApplicationsPerDay).toBe(75);
    });

    it('should persist across manager instances', () => {
      configManager.updateRateLimits({
        maxApplicationsPerDay: 42,
      });
      configManager.save();

      ConfigManager.reset();
      const newManager = getConfigManager();
      newManager.initialize({ configPath: testConfigPath });
      const config = newManager.getConfig();

      expect(config.rateLimit.maxApplicationsPerDay).toBe(42);
    });

    it('should not save sensitive data', () => {
      configManager.save();

      const savedConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
      // Should not contain API keys
      expect(savedConfig.claude).toBeUndefined();
      expect(savedConfig.exa).toBeUndefined();
      // Should contain safe config
      expect(savedConfig.browser).toBeDefined();
      expect(savedConfig.preferences).toBeDefined();
    });
  });

  describe('Platform Configuration', () => {
    it('should retrieve platform configurations', () => {
      const platforms = configManager.getPlatforms();

      expect(platforms.linkedin).toBeDefined();
      expect(platforms.indeed).toBeDefined();
      expect(platforms.glassdoor).toBeDefined();
    });

    it('should update platform configurations', () => {
      configManager.update({
        platforms: {
          linkedin: {
            enabled: true,
            useEasyApply: true,
            email: 'linkedin@example.com',
            password: 'secure123',
          },
          indeed: {
            enabled: false,
            email: 'indeed@example.com',
            password: 'secure456',
          },
          glassdoor: {
            enabled: false,
          },
        },
      });

      const platforms = configManager.getPlatforms();
      expect(platforms.linkedin.email).toBe('linkedin@example.com');
      expect(platforms.indeed.email).toBe('indeed@example.com');
      expect(platforms.linkedin.enabled).toBe(true);
      expect(platforms.indeed.enabled).toBe(false);
    });

    it('should validate platform credentials', () => {
      configManager.update({
        platforms: {
          linkedin: {
            enabled: true,
            useEasyApply: true,
            email: 'test@example.com',
            password: 'password',
          },
          indeed: {
            enabled: true,
          },
          glassdoor: {
            enabled: false,
          },
        },
      });

      const validation = configManager.validatePlatformCredentials();
      expect(validation.linkedin.configured).toBe(true);
      expect(validation.linkedin.valid).toBe(true);
      expect(validation.indeed.configured).toBe(false);
      expect(validation.indeed.valid).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate API keys', () => {
      const validation = configManager.validateApiKeys();
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should throw when API keys are missing during initialization', () => {
      const savedAnthropicKey = process.env.ANTHROPIC_API_KEY;
      const savedExaKey = process.env.EXA_API_KEY;

      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.EXA_API_KEY;

      ConfigManager.reset();
      const newManager = getConfigManager();

      // Initialization should throw when required API keys are missing
      expect(() => newManager.initialize()).toThrow(/API_KEY/);

      // Restore for other tests
      process.env.ANTHROPIC_API_KEY = savedAnthropicKey;
      process.env.EXA_API_KEY = savedExaKey;
    });
  });

  describe('API Key Access', () => {
    it('should read API keys from environment', () => {
      const claude = configManager.getClaude();
      const exa = configManager.getExa();

      expect(claude.apiKey).toBe('test-anthropic-key');
      expect(exa.apiKey).toBe('test-exa-key');
    });

    it('should access Claude configuration', () => {
      const claude = configManager.getClaude();
      expect(claude).toBeDefined();
      expect(claude.apiKey).toBeDefined();
      expect(claude.model).toBeDefined();
    });

    it('should access Exa configuration', () => {
      const exa = configManager.getExa();
      expect(exa).toBeDefined();
      expect(exa.apiKey).toBeDefined();
    });
  });

  describe('Configuration Getters', () => {
    it('should get database configuration', () => {
      const db = configManager.getDatabase();
      expect(db).toBeDefined();
      expect(db.path).toBeDefined();
    });

    it('should get browser configuration', () => {
      const browser = configManager.getBrowser();
      expect(browser).toBeDefined();
      expect(browser.headless).toBeDefined();
      expect(browser.timeout).toBeDefined();
    });

    it('should get rate limit configuration', () => {
      const rateLimit = configManager.getRateLimit();
      expect(rateLimit).toBeDefined();
      expect(rateLimit.maxApplicationsPerDay).toBeDefined();
      expect(rateLimit.maxApplicationsPerHour).toBeDefined();
    });

    it('should get logging configuration', () => {
      const logging = configManager.getLogging();
      expect(logging).toBeDefined();
      expect(logging.level).toBeDefined();
    });

    it('should get data directory', () => {
      const dataDir = configManager.getDataDir();
      expect(dataDir).toBeDefined();
      expect(typeof dataDir).toBe('string');
    });
  });

  describe('Environment Detection', () => {
    it('should detect test environment', () => {
      expect(configManager.isTest()).toBe(true);
      expect(configManager.isDevelopment()).toBe(false);
      expect(configManager.isProduction()).toBe(false);
    });

    it('should get environment', () => {
      const env = configManager.getEnvironment();
      expect(env).toBe('test');
    });
  });

  describe('Configuration Summary', () => {
    it('should get configuration summary', () => {
      const summary = configManager.getSummary();
      expect(summary).toBeDefined();
      expect(summary.environment).toBeDefined();
      expect(summary.dataDir).toBeDefined();
      expect(summary.database).toBeDefined();
      expect(summary.apiKeysConfigured).toBe(true);
      expect(summary.platformsEnabled).toBeInstanceOf(Array);
      expect(summary.rateLimit).toBeDefined();
      expect(summary.preferences).toBeDefined();
    });
  });

  describe('Data Path Helpers', () => {
    it('should get data path for file', () => {
      const filePath = configManager.getDataPath('test.db');
      expect(filePath).toContain('test.db');
    });

    it('should ensure data subdirectory exists', () => {
      const subdir = configManager.ensureDataSubdir('logs');
      expect(fs.existsSync(subdir)).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = ConfigManager.getInstance();
      ConfigManager.reset();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).not.toBe(instance2);
    });

    it('should use helper functions', () => {
      const manager1 = getConfigManager();
      const manager2 = getConfigManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when accessing uninitialized config', () => {
      ConfigManager.reset();
      const newManager = getConfigManager();
      expect(() => newManager.getConfig()).toThrow('Configuration not initialized');
    });

    it('should throw error when saving without config path', () => {
      ConfigManager.reset();
      const newManager = getConfigManager();
      newManager.initialize();
      expect(() => newManager.save()).toThrow('No configuration path specified');
    });
  });
});
