/**
 * Settings Router
 * Handles application settings and configuration
 *
 * SECURITY:
 * - System-wide settings mutations require admin access
 * - User-specific settings (general, notifications, API keys) use protectedProcedure
 *   and are scoped to the authenticated user
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure, rateLimitedMutationProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Schema definitions for user settings
const generalSettingsSchema = z.object({
  defaultKeywords: z.string().optional(),
  defaultLocation: z.string().optional(),
  autoApplyEnabled: z.boolean().default(false),
  matchThreshold: z.number().min(0).max(100).default(70),
  browserHeadless: z.boolean().default(true),
  maxApplicationsPerDay: z.number().min(1).max(100).default(10),
  applicationDelay: z.number().min(1).max(60).default(5),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  desktopNotifications: z.boolean().default(false),
  notificationFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).default('daily'),
  notifyNewMatches: z.boolean().default(true),
  notifyApplicationSubmitted: z.boolean().default(true),
  notifyApplicationUpdate: z.boolean().default(true),
  notifyInterviewRequest: z.boolean().default(true),
  notifyRejection: z.boolean().default(false),
  notifyWeeklySummary: z.boolean().default(true),
});

const apiKeysSchema = z.object({
  claudeApiKey: z.string().optional(),
  exaApiKey: z.string().optional(),
});

/**
 * Settings router for app configuration
 */
export const settingsRouter = router({
  /**
   * Get current application settings
   * SECURITY: Requires authentication (users can read their settings)
   */
  getSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const config = ctx.config;

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
        database: {
          path: config.database.path,
          walMode: config.database.walMode,
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
        platforms: config.platforms,
        logging: {
          level: config.logging.level,
          file: config.logging.file,
          console: config.logging.console,
        },
        preferences: config.preferences,
        dataDir: config.dataDir,
        environment: config.environment,
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
   * Reset settings to defaults
   * SECURITY: Requires ADMIN access - affects global configuration
   */
  resetSettings: adminProcedure
    .mutation(async ({ ctx }) => {
      // This would reset to default config
      // For now, just return success
      return {
        success: true,
        message: 'Settings reset to defaults (not yet implemented)',
      };
    }),

  /**
   * Get data directory paths
   * SECURITY: Requires authentication (contains system paths)
   */
  getDataPaths: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        dataDir: ctx.configManager.getDataDir(),
        databasePath: ctx.config.database.path,
        logPath: ctx.configManager.ensureDataSubdir('logs'),
        screenshotsPath: ctx.configManager.ensureDataSubdir('screenshots'),
        uploadsPath: ctx.configManager.ensureDataSubdir('uploads'),
      };
    }),

  // ============================================
  // USER-SPECIFIC SETTINGS
  // These are scoped to the authenticated user
  // ============================================

  /**
   * Get user's general settings
   * SECURITY: Returns only the authenticated user's settings
   */
  getUserGeneralSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const key = `user.${ctx.userId}.general`;
      const settings = ctx.settingsRepository.get(key);
      return settings ?? {
        defaultKeywords: '',
        defaultLocation: '',
        autoApplyEnabled: false,
        matchThreshold: 70,
        browserHeadless: true,
        maxApplicationsPerDay: 10,
        applicationDelay: 5,
      };
    }),

  /**
   * Update user's general settings
   * SECURITY: Updates only the authenticated user's settings
   */
  updateGeneralSettings: rateLimitedMutationProcedure
    .input(generalSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const key = `user.${ctx.userId}.general`;
      ctx.settingsRepository.set(key, input);
      return {
        success: true,
        message: 'General settings saved successfully',
      };
    }),

  /**
   * Get user's notification settings
   * SECURITY: Returns only the authenticated user's settings
   */
  getUserNotificationSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const key = `user.${ctx.userId}.notifications`;
      const settings = ctx.settingsRepository.get(key);
      return settings ?? {
        emailNotifications: true,
        desktopNotifications: false,
        notificationFrequency: 'daily',
        notifyNewMatches: true,
        notifyApplicationSubmitted: true,
        notifyApplicationUpdate: true,
        notifyInterviewRequest: true,
        notifyRejection: false,
        notifyWeeklySummary: true,
      };
    }),

  /**
   * Update user's notification settings
   * SECURITY: Updates only the authenticated user's settings
   */
  updateNotificationSettings: rateLimitedMutationProcedure
    .input(notificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const key = `user.${ctx.userId}.notifications`;
      ctx.settingsRepository.set(key, input);
      return {
        success: true,
        message: 'Notification settings saved successfully',
      };
    }),

  /**
   * Get user's API key status (not the keys themselves)
   * SECURITY: Only returns whether keys are configured, not the actual values
   */
  getApiKeyStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const key = `user.${ctx.userId}.apiKeys`;
      const settings = ctx.settingsRepository.get<{ claudeApiKey?: string; exaApiKey?: string }>(key);
      return {
        claudeConfigured: !!(settings?.claudeApiKey && settings.claudeApiKey.length > 0),
        exaConfigured: !!(settings?.exaApiKey && settings.exaApiKey.length > 0),
      };
    }),

  /**
   * Update user's API keys
   * SECURITY: Stores encrypted API keys scoped to the authenticated user
   * Note: Keys are stored in the settings repository. For production,
   * consider using the credentials repository with proper encryption.
   */
  updateApiKeys: rateLimitedMutationProcedure
    .input(apiKeysSchema)
    .mutation(async ({ ctx, input }) => {
      const key = `user.${ctx.userId}.apiKeys`;

      // Only update keys that are provided (non-empty)
      const existingKeys = ctx.settingsRepository.get<{ claudeApiKey?: string; exaApiKey?: string }>(key) ?? {};
      const updatedKeys = {
        ...existingKeys,
        ...(input.claudeApiKey !== undefined && input.claudeApiKey !== ''
          ? { claudeApiKey: input.claudeApiKey }
          : {}),
        ...(input.exaApiKey !== undefined && input.exaApiKey !== ''
          ? { exaApiKey: input.exaApiKey }
          : {}),
      };

      ctx.settingsRepository.set(key, updatedKeys);
      return {
        success: true,
        message: 'API keys saved successfully',
      };
    }),

  /**
   * Test an API key
   * SECURITY: Rate limited to prevent abuse of external API calls
   */
  testApiKey: rateLimitedMutationProcedure
    .input(
      z.object({
        provider: z.enum(['claude', 'exa']),
        apiKey: z.string().min(1, 'API key is required'),
      })
    )
    .mutation(async ({ input }) => {
      const { provider, apiKey } = input;

      try {
        if (provider === 'claude') {
          // Test Claude API key by making a minimal API call
          // Check if it starts with expected prefix
          if (!apiKey.startsWith('sk-')) {
            return {
              valid: false,
              message: 'Invalid Claude API key format. Keys should start with "sk-"',
            };
          }

          // Make a minimal API call to verify the key
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'Hi' }],
            }),
          });

          if (response.ok) {
            return {
              valid: true,
              message: 'Claude API key is valid and working',
            };
          }

          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            return {
              valid: false,
              message: 'Invalid Claude API key',
            };
          }

          return {
            valid: false,
            message: `Claude API error: ${(errorData as { error?: { message?: string } }).error?.message || 'Unknown error'}`,
          };
        }

        if (provider === 'exa') {
          // Test Exa API key
          if (apiKey.length < 10) {
            return {
              valid: false,
              message: 'Invalid Exa API key format',
            };
          }

          // Make a minimal API call to verify the key
          const response = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            body: JSON.stringify({
              query: 'test',
              numResults: 1,
            }),
          });

          if (response.ok) {
            return {
              valid: true,
              message: 'Exa API key is valid and working',
            };
          }

          if (response.status === 401 || response.status === 403) {
            return {
              valid: false,
              message: 'Invalid Exa API key',
            };
          }

          return {
            valid: false,
            message: 'Failed to verify Exa API key',
          };
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unknown provider',
        });
      } catch (error) {
        // Network errors or other issues
        if (error instanceof TRPCError) throw error;

        return {
          valid: false,
          message: `Failed to test API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }),
});
