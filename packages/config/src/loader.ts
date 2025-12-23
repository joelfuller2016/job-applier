import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigError } from '@job-applier/core';
import {
  EnvSchema,
  AppConfig,
  AppConfigSchema,
  type EnvConfig,
} from './schema.js';

/**
 * Load environment variables from a .env file into process.env.
 *
 * If `envPath` is provided, that file will be loaded. If omitted, the function
 * checks for `.env.local` then `.env` in the current working directory and
 * loads the first one found. If `envPath` is not provided and `NODE_ENV` is
 * `'test'`, the function returns without loading any file.
 *
 * @param envPath - Optional path to a .env file to load; when omitted, use the
 * default lookup order described above
 */
export function loadEnvFile(envPath?: string): void {
  if (!envPath && process.env.NODE_ENV === 'test') {
    return;
  }

  const paths = envPath
    ? [envPath]
    : [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), '.env'),
      ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return;
    }
  }
}

type NormalizedEnvResult = {
  env: NodeJS.ProcessEnv;
  warnings: string[];
};

/**
 * Normalize legacy environment variable names to their canonical equivalents and collect deprecation warnings.
 *
 * @param rawEnv - The source environment object (typically `process.env`) that may contain legacy variable names.
 * @returns An object with `env` containing the normalized environment variables and `warnings` as an array of deprecation messages.
 */
function normalizeLegacyEnv(rawEnv: NodeJS.ProcessEnv): NormalizedEnvResult {
  const env: NodeJS.ProcessEnv = { ...rawEnv };
  const warnings = new Set<string>();

  const setIfMissing = (key: string, value: string | undefined): void => {
    if (value !== undefined && value !== '' && env[key] === undefined) {
      env[key] = value;
    }
  };

  const warn = (legacy: string, canonical: string): void => {
    if (rawEnv[legacy] !== undefined && rawEnv[legacy] !== '') {
      warnings.add(`${legacy} is deprecated; use ${canonical}`);
    }
  };

  setIfMissing('ANTHROPIC_API_KEY', rawEnv.CLAUDE_API_KEY);
  warn('CLAUDE_API_KEY', 'ANTHROPIC_API_KEY');

  // When both legacy flags are set, HEADLESS takes precedence over HEADLESS_MODE.
  if (
    rawEnv.HEADLESS !== undefined &&
    rawEnv.HEADLESS_MODE !== undefined &&
    rawEnv.HEADLESS !== rawEnv.HEADLESS_MODE
  ) {
    warnings.add(
      `HEADLESS and HEADLESS_MODE are both set and differ; using HEADLESS=${rawEnv.HEADLESS}`
    );
  }

  setIfMissing('BROWSER_HEADLESS', rawEnv.HEADLESS);
  warn('HEADLESS', 'BROWSER_HEADLESS');

  setIfMissing('BROWSER_HEADLESS', rawEnv.HEADLESS_MODE);
  warn('HEADLESS_MODE', 'BROWSER_HEADLESS');

  setIfMissing('BROWSER_TIMEOUT', rawEnv.BROWSER_TIMEOUT_MS);
  warn('BROWSER_TIMEOUT_MS', 'BROWSER_TIMEOUT');

  // Intentionally OR: legacy vars can fill whichever delay value is missing,
  // and setIfMissing() preserves any user-provided value for partial migration.
  if (
    env.MIN_DELAY_BETWEEN_ACTIONS === undefined ||
    env.MAX_DELAY_BETWEEN_ACTIONS === undefined
  ) {
    if (rawEnv.RATE_LIMIT_DELAY_MS !== undefined) {
      setIfMissing('MIN_DELAY_BETWEEN_ACTIONS', rawEnv.RATE_LIMIT_DELAY_MS);
      setIfMissing('MAX_DELAY_BETWEEN_ACTIONS', rawEnv.RATE_LIMIT_DELAY_MS);
      warn(
        'RATE_LIMIT_DELAY_MS',
        'MIN_DELAY_BETWEEN_ACTIONS/MAX_DELAY_BETWEEN_ACTIONS'
      );
    } else if (rawEnv.DELAY_BETWEEN_ACTIONS !== undefined) {
      const seconds = Number(rawEnv.DELAY_BETWEEN_ACTIONS);
      // Reject invalid values: NaN, Infinity, and non-positive numbers (including 0)
      if (Number.isFinite(seconds) && seconds > 0) {
        const ms = String(Math.round(seconds * 1000));
        setIfMissing('MIN_DELAY_BETWEEN_ACTIONS', ms);
        setIfMissing('MAX_DELAY_BETWEEN_ACTIONS', ms);
        warnings.add(
          'DELAY_BETWEEN_ACTIONS is deprecated (seconds); use MIN_DELAY_BETWEEN_ACTIONS/MAX_DELAY_BETWEEN_ACTIONS in ms'
        );
      } else {
        warn(
          'DELAY_BETWEEN_ACTIONS',
          'MIN_DELAY_BETWEEN_ACTIONS/MAX_DELAY_BETWEEN_ACTIONS'
        );
      }
    }
  }

  return { env, warnings: Array.from(warnings) };
}

/**
 * Parse environment variables, normalize legacy names, and validate them against the environment schema.
 *
 * May log deprecation warnings for legacy environment variables to the console unless NODE_ENV is 'test'.
 *
 * @returns The validated environment configuration as an `EnvConfig` object
 * @throws ConfigError when the environment fails schema validation; the error message lists validation failures
 */
export function parseEnv(): EnvConfig {
  const { env, warnings } = normalizeLegacyEnv(process.env);

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    for (const warning of warnings) {
      console.warn(`[Config] ${warning}`);
    }
  }

  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new ConfigError(
      `Invalid environment configuration:\n${errors.join('\n')}`
    );
  }

  return result.data;
}

/**
 * Convert environment config to application config
 */
export function envToAppConfig(env: EnvConfig): AppConfig {
  const config: AppConfig = {
    claude: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.CLAUDE_MODEL,
      maxTokens: env.CLAUDE_MAX_TOKENS,
      temperature: env.CLAUDE_TEMPERATURE,
    },
    exa: {
      apiKey: env.EXA_API_KEY,
      maxResults: env.EXA_MAX_RESULTS,
      searchTimeout: 30000,
    },
    database: {
      path: env.DATABASE_PATH,
      walMode: true,
      busyTimeout: 5000,
    },
    browser: {
      headless: env.BROWSER_HEADLESS,
      slowMo: env.BROWSER_SLOW_MO,
      timeout: env.BROWSER_TIMEOUT,
      viewport: { width: 1920, height: 1080 },
    },
    rateLimit: {
      maxApplicationsPerDay: env.MAX_APPLICATIONS_PER_DAY,
      maxApplicationsPerHour: env.MAX_APPLICATIONS_PER_HOUR,
      minDelayBetweenActions: env.MIN_DELAY_BETWEEN_ACTIONS,
      maxDelayBetweenActions: env.MAX_DELAY_BETWEEN_ACTIONS,
      pauseAfterApplications: 5,
      pauseDuration: 60000,
    },
    platforms: {
      linkedin: {
        enabled: true,
        email: env.LINKEDIN_EMAIL,
        password: env.LINKEDIN_PASSWORD,
        useEasyApply: true,
      },
      indeed: {
        enabled: true,
        email: env.INDEED_EMAIL,
        password: env.INDEED_PASSWORD,
      },
      glassdoor: {
        enabled: false,
      },
    },
    logging: {
      level: env.LOG_LEVEL,
      file: env.LOG_FILE,
      console: true,
      timestamps: true,
    },
    preferences: {
      defaultKeywords: '',
      defaultLocation: '',
      minMatchScore: env.MIN_MATCH_SCORE,
      autoApply: env.AUTO_APPLY,
      requireReview: env.REQUIRE_REVIEW,
      skipAppliedJobs: true,
      coverLetterStyle: 'professional',
      customizePerJob: true,
    },
    dataDir: env.DATA_DIR,
    environment: env.NODE_ENV,
  };

  // Validate the complete config
  const result = AppConfigSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new ConfigError(
      `Invalid application configuration:\n${errors.join('\n')}`
    );
  }

  return result.data;
}

/**
 * Load configuration from a JSON file
 */
export function loadConfigFile(configPath: string): Partial<AppConfig> {
  if (!fs.existsSync(configPath)) {
    throw new ConfigError(`Configuration file not found: ${configPath}`);
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new ConfigError(
      `Failed to parse configuration file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Save configuration to a JSON file
 */
export function saveConfigFile(configPath: string, config: Partial<AppConfig>): void {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new ConfigError(
      `Failed to save configuration file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Merge configuration objects deeply
 */
export function mergeConfig<T extends Record<string, unknown>>(
  base: T,
  overrides: Partial<T>
): T {
  const result = { ...base };

  for (const key of Object.keys(overrides) as Array<keyof T>) {
    const value = overrides[key];
    if (value === undefined) continue;

    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = mergeConfig(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>
      ) as T[keyof T];
    } else {
      result[key] = value as T[keyof T];
    }
  }

  return result;
}

/**
 * Load complete configuration from environment and optional config file
 */
export function loadConfig(options?: {
  envPath?: string;
  configPath?: string;
}): AppConfig {
  // Load .env file
  loadEnvFile(options?.envPath);

  // Parse environment variables
  const env = parseEnv();

  // Convert to app config
  let config = envToAppConfig(env);

  // Merge with config file if provided
  if (options?.configPath && fs.existsSync(options.configPath)) {
    const fileConfig = loadConfigFile(options.configPath);
    config = mergeConfig(config, fileConfig);
  }

  // Ensure data directory exists
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }

  // Ensure database directory exists
  const dbDir = path.dirname(config.database.path);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return config;
}
