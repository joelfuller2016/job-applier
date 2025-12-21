/**
 * Settings Router
 * Handles application settings and configuration
 * 
 * SECURITY: Settings mutations require admin access.
 * Regular users can only read settings, not modify them.
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';

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
      const updates: any = {};

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
    .mutation(async ({ ctx }) => {
      // This would reset to default config
      // For now, just return success
      return {
        success: true,
        message: 'Settings reset to defaults (not yet implemented)',
      };
    }),

  /**
   * Update platform credentials
   * SECURITY: Requires ADMIN access - modifies sensitive credentials
   */
  updatePlatformCredentials: adminProcedure
    .input(
      z.object({
        linkedinEmail: z.string().optional().or(z.literal('')),
        linkedinPassword: z.string().optional(),
        indeedEmail: z.string().optional().or(z.literal('')),
        indeedPassword: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentConfig = ctx.config;

      const updatedConfig = {
        ...currentConfig,
        platforms: {
          ...currentConfig.platforms,
          linkedin: {
            ...currentConfig.platforms.linkedin,
            // If email is empty string or provided, update it
            ...(input.linkedinEmail !== undefined && { email: input.linkedinEmail || undefined }),
            // Only update password if provided (not undefined/null)
            // Empty string might be valid if clearing password?
            // The UI schema allows optional string.
            ...(input.linkedinPassword !== undefined && { password: input.linkedinPassword || undefined }),
          },
          indeed: {
            ...currentConfig.platforms.indeed,
            ...(input.indeedEmail !== undefined && { email: input.indeedEmail || undefined }),
            ...(input.indeedPassword !== undefined && { password: input.indeedPassword || undefined }),
          }
        }
      };

      ctx.configManager.update(updatedConfig);

      return {
        success: true,
        message: 'Platform credentials updated successfully',
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
