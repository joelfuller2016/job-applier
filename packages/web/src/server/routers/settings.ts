/**
 * Settings Router
 * Handles application settings and configuration
 *
 * SECURITY:
 * - System-wide settings require ADMIN access
 * - User-specific settings require authentication (protectedProcedure)
 * - API key testing is rate limited to prevent abuse
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure, rateLimitedMutationProcedure } from '../trpc';

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

const platformCredentialsSchema = z.object({
  platform: z.enum(['linkedin', 'indeed']),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().optional(),
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

  // ============================================
  // User-Specific Settings (protectedProcedure)
  // ============================================

  /**
   * Get user's general settings
   * SECURITY: Requires authentication, returns only the authenticated user's settings
   */
  getUserGeneralSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const key = `user:${ctx.userId}:general`;
      const settings = ctx.settingsRepository.get<z.infer<typeof generalSettingsSchema>>(key);

      // Return default values if no settings exist
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
   * SECURITY: Requires authentication, updates only the authenticated user's settings
   */
  updateGeneralSettings: protectedProcedure
    .input(generalSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const key = `user:${ctx.userId}:general`;
      ctx.settingsRepository.set(key, input);

      return {
        success: true,
        message: 'General settings updated successfully',
      };
    }),

  /**
   * Get user's notification settings
   * SECURITY: Requires authentication, returns only the authenticated user's settings
   */
  getUserNotificationSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const key = `user:${ctx.userId}:notifications`;
      const settings = ctx.settingsRepository.get<z.infer<typeof notificationSettingsSchema>>(key);

      // Return default values if no settings exist
      return settings ?? {
        emailNotifications: true,
        desktopNotifications: false,
        notificationFrequency: 'daily' as const,
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
   * SECURITY: Requires authentication, updates only the authenticated user's settings
   */
  updateNotificationSettings: protectedProcedure
    .input(notificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const key = `user:${ctx.userId}:notifications`;
      ctx.settingsRepository.set(key, input);

      return {
        success: true,
        message: 'Notification settings updated successfully',
      };
    }),

  /**
   * Check if user has API keys configured (without exposing the actual keys)
   * SECURITY: Only reveals whether keys exist, not their values
   */
  getApiKeyStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const key = `user:${ctx.userId}:apikeys`;
      const settings = ctx.settingsRepository.get<{ claudeApiKey?: string; exaApiKey?: string }>(key);

      return {
        hasClaudeKey: !!settings?.claudeApiKey,
        hasExaKey: !!settings?.exaApiKey,
      };
    }),

  /**
   * Update user's API keys
   * SECURITY: Requires authentication, keys are stored encrypted in the database
   */
  updateApiKeys: protectedProcedure
    .input(apiKeysSchema)
    .mutation(async ({ ctx, input }) => {
      const key = `user:${ctx.userId}:apikeys`;

      // Only update keys that are provided (non-empty)
      const currentSettings = ctx.settingsRepository.get<{ claudeApiKey?: string; exaApiKey?: string }>(key) ?? {};

      const updatedSettings = {
        ...currentSettings,
        ...(input.claudeApiKey && { claudeApiKey: input.claudeApiKey }),
        ...(input.exaApiKey && { exaApiKey: input.exaApiKey }),
      };

      ctx.settingsRepository.set(key, updatedSettings);

      return {
        success: true,
        message: 'API keys updated successfully',
      };
    }),

  /**
   * Test Claude API key
   * SECURITY: Rate limited to prevent abuse, key validated but not stored
   */
  testClaudeApiKey: rateLimitedMutationProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        // Validate the API key format
        if (!input.apiKey.startsWith('sk-ant-')) {
          return {
            valid: false,
            message: 'Invalid API key format. Claude API keys should start with "sk-ant-"',
          };
        }

        // Make a minimal test request to the Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': input.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });

        if (response.ok) {
          return {
            valid: true,
            message: 'Claude API key is valid and working',
          };
        }

        const error = await response.json().catch(() => ({}));

        if (response.status === 401) {
          return {
            valid: false,
            message: 'Invalid API key. Please check your Claude API key.',
          };
        }

        return {
          valid: false,
          message: error.error?.message || 'Failed to validate API key',
        };
      } catch (error) {
        return {
          valid: false,
          message: 'Failed to connect to Claude API. Please try again.',
        };
      }
    }),

  /**
   * Test Exa API key
   * SECURITY: Rate limited to prevent abuse
   */
  testExaApiKey: rateLimitedMutationProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        // Make a minimal test request to the Exa API
        const response = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': input.apiKey,
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
            message: 'Invalid API key. Please check your Exa API key.',
          };
        }

        return {
          valid: false,
          message: 'Failed to validate API key',
        };
      } catch (error) {
        return {
          valid: false,
          message: 'Failed to connect to Exa API. Please try again.',
        };
      }
    }),

  /**
   * Get platform credentials status (without exposing actual credentials)
   * SECURITY: Only reveals whether credentials exist, not their values
   */
  getPlatformStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const linkedinCreds = ctx.credentialsRepository.get('linkedin' as any);
      const indeedCreds = ctx.credentialsRepository.get('indeed' as any);

      return {
        linkedin: {
          configured: !!linkedinCreds?.email,
          email: linkedinCreds?.email ?? null,
        },
        indeed: {
          configured: !!indeedCreds?.email,
          email: indeedCreds?.email ?? null,
        },
      };
    }),

  /**
   * Update platform credentials
   * SECURITY: Requires authentication, credentials are encrypted at rest
   */
  updatePlatformCredentials: protectedProcedure
    .input(platformCredentialsSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input.email && !input.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email or password must be provided',
        });
      }

      ctx.credentialsRepository.save({
        platform: input.platform as any,
        email: input.email || undefined,
        password: input.password || undefined,
      });

      return {
        success: true,
        message: `${input.platform.charAt(0).toUpperCase() + input.platform.slice(1)} credentials updated successfully`,
      };
    }),

  /**
   * Test platform connection
   * SECURITY: Rate limited to prevent abuse
   * NOTE: Actual platform login testing requires browser automation
   */
  testPlatformConnection: rateLimitedMutationProcedure
    .input(z.object({
      platform: z.enum(['linkedin', 'indeed']),
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      // Note: Full platform testing would require browser automation
      // For now, we validate the credentials format and return a simulated result

      // Basic validation
      if (!input.email.includes('@')) {
        return {
          success: false,
          message: 'Invalid email format',
        };
      }

      if (input.password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters',
        };
      }

      // In a real implementation, this would attempt to log in via browser automation
      // For now, we indicate that the credentials have been validated locally
      return {
        success: true,
        message: 'Credentials format validated. Full connection testing requires automation service.',
      };
    }),

  // ============================================
  // Admin-Only Settings (adminProcedure)
  // ============================================

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
});
