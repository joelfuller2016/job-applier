/**
 * Settings Router
 * Handles application settings and configuration
 * 
 * SECURITY: All mutations require authentication via protectedProcedure
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

/**
 * Settings router for app configuration
 */
export const settingsRouter = router({
  /**
   * Get current application settings
   */
  getSettings: publicProcedure
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
   * SECURITY: Requires authentication to prevent unauthorized config changes
   */
  updateSettings: protectedProcedure
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
   * SECURITY: Requires authentication to prevent unauthorized resets
   */
  resetSettings: protectedProcedure
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
   */
  getDataPaths: publicProcedure
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
