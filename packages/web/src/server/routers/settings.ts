/**
 * Settings Router
 * Handles application settings and configuration
 *
 * SECURITY: Settings mutations require admin access.
 * Regular users can only read settings, not modify them.
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';

const DEFAULT_GENERAL_SETTINGS = {
  defaultKeywords: '',
  defaultLocation: '',
  autoApplyEnabled: false,
  matchThreshold: 70,
  browserHeadless: true,
  maxApplicationsPerDay: 10,
  applicationDelay: 5,
};

const generalSettingsSchema = z.object({
  defaultKeywords: z.string().default(DEFAULT_GENERAL_SETTINGS.defaultKeywords),
  defaultLocation: z.string().default(DEFAULT_GENERAL_SETTINGS.defaultLocation),
  autoApplyEnabled: z.boolean().default(DEFAULT_GENERAL_SETTINGS.autoApplyEnabled),
  matchThreshold: z
    .number()
    .min(0)
    .max(100)
    .default(DEFAULT_GENERAL_SETTINGS.matchThreshold),
  browserHeadless: z.boolean().default(DEFAULT_GENERAL_SETTINGS.browserHeadless),
  maxApplicationsPerDay: z
    .number()
    .min(1)
    .max(100)
    .default(DEFAULT_GENERAL_SETTINGS.maxApplicationsPerDay),
  applicationDelay: z
    .number()
    .min(1)
    .max(60)
    .default(DEFAULT_GENERAL_SETTINGS.applicationDelay),
});

function getGeneralSettingsKey(userId: string) {
  return `user:${userId}:settings.general`;
}

/**
 * Settings router for app configuration
 */
export const settingsRouter = router({
  /**
   * Get admin access status for the current user
   * SECURITY: Requires authentication; does not disclose admin list
   */
  getAdminStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const adminUserIds = (process.env.ADMIN_USER_IDS || '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      return {
        isAdmin: adminUserIds.length > 0 && adminUserIds.includes(ctx.userId),
        adminConfigured: adminUserIds.length > 0,
      };
    }),

  /**
   * Get current application settings
   * SECURITY: Requires authentication (users can read their settings)
   */
  getSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const config = ctx.config;
      const linkedInConfigured = Boolean(
        config.platforms.linkedin.email || config.platforms.linkedin.password
      );
      const indeedConfigured = Boolean(
        config.platforms.indeed.email || config.platforms.indeed.password
      );
      const glassdoorConfigured = Boolean(
        config.platforms.glassdoor.email || config.platforms.glassdoor.password
      );

      return {
        claude: {
          model: config.claude.model,
          maxTokens: config.claude.maxTokens,
          temperature: config.claude.temperature,
        },
        exa: {
          enabled: !!config.exa.apiKey,
          maxResults: config.exa.maxResults,
        },
        browser: {
          headless: config.browser.headless,
          timeout: config.browser.timeout,
          userAgent: config.browser.userAgent,
          slowMo: config.browser.slowMo,
        },
        rateLimit: {
          maxApplicationsPerDay: config.rateLimit.maxApplicationsPerDay,
          maxApplicationsPerHour: config.rateLimit.maxApplicationsPerHour,
          minDelayBetweenActions: config.rateLimit.minDelayBetweenActions,
          maxDelayBetweenActions: config.rateLimit.maxDelayBetweenActions,
        },
        platforms: {
          linkedin: {
            enabled: config.platforms.linkedin.enabled,
            useEasyApply: config.platforms.linkedin.useEasyApply,
            hasCredentials: linkedInConfigured,
          },
          indeed: {
            enabled: config.platforms.indeed.enabled,
            hasCredentials: indeedConfigured,
          },
          glassdoor: {
            enabled: config.platforms.glassdoor.enabled,
            hasCredentials: glassdoorConfigured,
          },
        },
        logging: {
          level: config.logging.level,
          file: config.logging.file,
          console: config.logging.console,
        },
        preferences: config.preferences,
        environment: config.environment,
      };
    }),

  /**
   * Get user-specific general settings
   * SECURITY: Requires authentication (user-specific settings)
   */
  getGeneral: protectedProcedure
    .query(async ({ ctx }) => {
      const stored = ctx.settingsRepository.get<Record<string, unknown>>(
        getGeneralSettingsKey(ctx.userId)
      );
      const parsed = generalSettingsSchema.partial().safeParse(stored ?? {});

      return {
        ...DEFAULT_GENERAL_SETTINGS,
        ...(parsed.success ? parsed.data : {}),
      };
    }),

  /**
   * Update user-specific general settings
   * SECURITY: Requires authentication (user-specific settings)
   */
  updateGeneral: protectedProcedure
    .input(generalSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      ctx.settingsRepository.set(getGeneralSettingsKey(ctx.userId), input);

      return {
        success: true,
        message: 'General settings updated successfully',
      };
    }),

  /**
   * Update application settings
   * SECURITY: Requires ADMIN access - modifies global configuration
   *
   * This endpoint allows modification of system-wide settings including:
   * - AI model configuration (affects all users)
   * - Rate limits (affects all users)
   * - Browser automation settings
   * - Logging configuration
   */
  updateSettings: adminProcedure
    .input(
      z.object({
        claude: z.object({
          model: z.string().optional(),
          maxTokens: z.number().optional(),
          temperature: z.number().optional(),
        }).optional(),
        browser: z.object({
          headless: z.boolean().optional(),
          timeout: z.number().optional(),
          userAgent: z.string().optional(),
          slowMo: z.number().optional(),
        }).optional(),
        rateLimit: z.object({
          maxApplicationsPerDay: z.number().optional(),
          maxApplicationsPerHour: z.number().optional(),
          minDelayBetweenActions: z.number().optional(),
          maxDelayBetweenActions: z.number().optional(),
        }).optional(),
        logging: z.object({
          level: z.enum(['error', 'warn', 'info', 'debug']).optional(),
          file: z.string().optional(),
          console: z.boolean().optional(),
        }).optional(),
        preferences: z.object({
          defaultKeywords: z.string().optional(),
          defaultLocation: z.string().optional(),
          minMatchScore: z.number().optional(),
          autoApply: z.boolean().optional(),
          requireReview: z.boolean().optional(),
          skipAppliedJobs: z.boolean().optional(),
          coverLetterStyle: z.enum(['professional', 'casual', 'technical']).optional(),
          customizePerJob: z.boolean().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Merge with existing config
      const currentConfig = ctx.config;
      const updatedConfig = {
        ...currentConfig,
        ...(input.claude && {
          claude: {
            ...currentConfig.claude,
            ...input.claude,
          },
        }),
        ...(input.browser && {
          browser: {
            ...currentConfig.browser,
            ...input.browser,
          },
        }),
        ...(input.rateLimit && {
          rateLimit: {
            ...currentConfig.rateLimit,
            ...input.rateLimit,
          },
        }),
        ...(input.logging && {
          logging: {
            ...currentConfig.logging,
            ...input.logging,
          },
        }),
        ...(input.preferences && {
          preferences: {
            ...currentConfig.preferences,
            ...input.preferences,
          },
        }),
      };

      // Save updated config
      ctx.configManager.update(updatedConfig);

      return {
        success: true,
        message: 'Settings updated successfully',
      };
    }),

  /**
   * Update API keys
   * SECURITY: Requires ADMIN access
   */
  updateApiKeys: adminProcedure
    .input(
      z.object({
        claudeApiKey: z.string().min(1),
        exaApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};

      if (input.claudeApiKey) {
        updates.claude = { apiKey: input.claudeApiKey };
      }

      // Only update Exa key if provided and not empty
      if (input.exaApiKey && input.exaApiKey.trim() !== '') {
        updates.exa = { apiKey: input.exaApiKey };
      }

      if (Object.keys(updates).length > 0) {
        ctx.configManager.update(updates);
      }

      return {
        success: true,
        message: 'API keys updated successfully',
      };
    }),

  /**
   * Reset settings to defaults
   * SECURITY: Requires ADMIN access - affects global configuration
   */
  resetSettings: adminProcedure
    .mutation(async () => {
      // This would reset to default config
      // For now, just return success
      return {
        success: true,
        message: 'Settings reset to defaults (not yet implemented)',
      };
    }),

  /**
   * Get data directory paths
   * SECURITY: Requires ADMIN access - exposes internal filesystem structure
   * Regular users should not see server-side paths as this could aid in attacks
   */
  getDataPaths: adminProcedure
    .query(async ({ ctx }) => {
      return {
        dataDir: ctx.configManager.getDataDir(),
        databasePath: ctx.config.database.path,
        logPath: ctx.configManager.ensureDataSubdir('logs'),
        screenshotsPath: ctx.configManager.ensureDataSubdir('screenshots'),
        uploadsPath: ctx.configManager.ensureDataSubdir('uploads'),
      };
    }),
});
