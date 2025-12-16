// Schema exports
export {
  ClaudeConfigSchema,
  ExaConfigSchema,
  DatabaseConfigSchema,
  BrowserConfigSchema,
  RateLimitConfigSchema,
  PlatformConfigSchema,
  LoggingConfigSchema,
  ApplicationPreferencesSchema,
  AppConfigSchema,
  EnvSchema,
  type ClaudeConfig,
  type ExaConfig,
  type DatabaseConfig,
  type BrowserConfig,
  type RateLimitConfig,
  type PlatformConfig,
  type LoggingConfig,
  type ApplicationPreferences,
  type AppConfig,
  type EnvConfig,
} from './schema.js';

// Loader exports
export {
  loadEnvFile,
  parseEnv,
  envToAppConfig,
  loadConfigFile,
  saveConfigFile,
  mergeConfig,
  loadConfig,
} from './loader.js';

// Manager exports
export {
  ConfigManager,
  getConfigManager,
  initConfig,
  getConfig,
} from './manager.js';
