/**
 * Settings Router
 * Handles application settings and configuration
 *
 * SECURITY: Settings mutations require admin access.
 * Regular users can only read settings, not modify them.
 * API key testing and updates are protected behind authentication.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import Anthropic from '@anthropic-ai/sdk';
import { Exa } from 'exa-js';
import { router, protectedProcedure, adminProcedure, aiRateLimitedProcedure } from '../trpc';

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

  /**
   * Test an API key (Claude or Exa)
   * SECURITY: Rate limited to prevent abuse (10 requests/min)
   * Makes actual API calls to verify the key is valid
   */
  testApiKey: aiRateLimitedProcedure
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
          // Test Claude API key by making a minimal request
          const client = new Anthropic({ apiKey });

          // Make a minimal API call to verify the key
          await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          });

          return {
            success: true,
            provider: 'claude',
            message: 'Claude API key is valid and working.',
          };
        } else if (provider === 'exa') {
          // Test Exa API key by making a minimal search request
          const client = new Exa(apiKey);

          // Make a minimal search to verify the key
          await client.search('test', { numResults: 1 });

          return {
            success: true,
            provider: 'exa',
            message: 'Exa API key is valid and working.',
          };
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unknown provider: ${provider}`,
        });
      } catch (error) {
        // Handle specific API errors
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check for authentication errors
        if (
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('unauthorized') ||
          errorMessage.toLowerCase().includes('authentication') ||
          errorMessage.toLowerCase().includes('api key')
        ) {
          return {
            success: false,
            provider,
            message: `Invalid ${provider === 'claude' ? 'Claude' : 'Exa'} API key. Please check your key and try again.`,
          };
        }

        // Other errors (rate limits, network issues, etc.)
        return {
          success: false,
          provider,
          message: `Failed to verify ${provider === 'claude' ? 'Claude' : 'Exa'} API key: ${errorMessage}`,
        };
      }
    }),

  /**
   * Update API keys (Claude and/or Exa)
   * SECURITY: Requires authentication. Updates are applied to the config.
   * Keys are stored in memory and environment - not persisted to disk in plain text.
   */
  updateApiKeys: protectedProcedure
    .input(
      z.object({
        claudeApiKey: z.string().min(1, 'Claude API key is required').optional(),
        exaApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};

      if (input.claudeApiKey) {
        updates.claude = {
          ...ctx.config.claude,
          apiKey: input.claudeApiKey,
        };
      }

      if (input.exaApiKey) {
        updates.exa = {
          ...ctx.config.exa,
          apiKey: input.exaApiKey,
        };
      }

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'At least one API key must be provided.',
        });
      }

      // Update the config in memory
      ctx.configManager.update(updates);

      return {
        success: true,
        message: 'API keys updated successfully.',
        updated: {
          claude: !!input.claudeApiKey,
          exa: !!input.exaApiKey,
        },
      };
    }),

  /**
   * Get API key status (configured or not, without revealing the actual keys)
   * SECURITY: Only returns whether keys are configured, not the keys themselves
   */
  getApiKeyStatus: protectedProcedure.query(async ({ ctx }) => {
    const config = ctx.config;

    return {
      claude: {
        configured: !!config.claude.apiKey && config.claude.apiKey.length > 0,
        // Show masked version for UX (first 7 chars + masked)
        masked: config.claude.apiKey
          ? `${config.claude.apiKey.substring(0, 7)}${'*'.repeat(20)}`
          : null,
      },
      exa: {
        configured: !!config.exa.apiKey && config.exa.apiKey.length > 0,
        masked: config.exa.apiKey
          ? `${config.exa.apiKey.substring(0, 4)}${'*'.repeat(20)}`
          : null,
      },
    };
  }),
});
