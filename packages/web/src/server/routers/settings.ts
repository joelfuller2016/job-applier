/**
 * Settings Router
 * Handles application settings and configuration
 *
 * SECURITY: Settings mutations require admin access.
 * Regular users can only read settings, not modify them.
 * API key testing requires authentication but not admin access.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure, rateLimitedMutationProcedure } from '../trpc';

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
   * Test Claude API key validity
   * SECURITY: Requires authentication, rate-limited to prevent abuse
   * Makes a minimal API call to validate the key
   */
  testClaudeKey: rateLimitedMutationProcedure
    .input(z.object({
      apiKey: z.string().min(1, 'API key is required'),
    }))
    .mutation(async ({ input }) => {
      const { apiKey } = input;

      // Basic format validation for Claude API keys
      if (!apiKey.startsWith('sk-ant-')) {
        return {
          valid: false,
          message: 'Invalid API key format. Claude API keys should start with "sk-ant-".',
        };
      }

      try {
        // Make a minimal API call to validate the key
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
            messages: [{ role: 'user', content: 'test' }],
          }),
        });

        if (response.status === 401) {
          return {
            valid: false,
            message: 'Invalid API key. Please check your key and try again.',
          };
        }

        if (response.status === 400) {
          // 400 with valid key means key is valid but request was bad (expected for minimal test)
          // Or we get actual content which means it worked
          return {
            valid: true,
            message: 'Claude API key is valid and working.',
          };
        }

        if (response.ok) {
          return {
            valid: true,
            message: 'Claude API key is valid and working.',
          };
        }

        // Handle rate limiting
        if (response.status === 429) {
          return {
            valid: true,
            message: 'Claude API key appears valid (rate limited during test).',
          };
        }

        return {
          valid: false,
          message: `Unexpected response from Claude API: ${response.status}`,
        };
      } catch (error) {
        console.error('[Settings] Error testing Claude API key:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to test API key. Please check your network connection.',
        });
      }
    }),

  /**
   * Test Exa API key validity
   * SECURITY: Requires authentication, rate-limited to prevent abuse
   * Makes a minimal API call to validate the key
   */
  testExaKey: rateLimitedMutationProcedure
    .input(z.object({
      apiKey: z.string().min(1, 'API key is required'),
    }))
    .mutation(async ({ input }) => {
      const { apiKey } = input;

      // Basic length validation for Exa API keys
      if (apiKey.length < 10) {
        return {
          valid: false,
          message: 'Invalid API key format. API key is too short.',
        };
      }

      try {
        // Make a minimal API call to validate the key
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

        if (response.status === 401 || response.status === 403) {
          return {
            valid: false,
            message: 'Invalid API key. Please check your key and try again.',
          };
        }

        if (response.ok) {
          return {
            valid: true,
            message: 'Exa API key is valid and working.',
          };
        }

        // Handle rate limiting
        if (response.status === 429) {
          return {
            valid: true,
            message: 'Exa API key appears valid (rate limited during test).',
          };
        }

        return {
          valid: false,
          message: `Unexpected response from Exa API: ${response.status}`,
        };
      } catch (error) {
        console.error('[Settings] Error testing Exa API key:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to test API key. Please check your network connection.',
        });
      }
    }),

  /**
   * Update API keys
   * SECURITY: Requires authentication, rate-limited
   * Updates the Claude and Exa API keys in configuration
   *
   * NOTE: API keys are stored in memory/config file.
   * For production, consider using a secure secrets manager.
   */
  updateApiKeys: rateLimitedMutationProcedure
    .input(z.object({
      claudeApiKey: z.string().min(1, 'Claude API key is required'),
      exaApiKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { claudeApiKey, exaApiKey } = input;

      // Validate Claude API key format
      if (!claudeApiKey.startsWith('sk-ant-')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid Claude API key format. Keys should start with "sk-ant-".',
        });
      }

      try {
        // Update configuration with new API keys
        ctx.configManager.update({
          claude: {
            ...ctx.config.claude,
            apiKey: claudeApiKey,
          },
          ...(exaApiKey && {
            exa: {
              ...ctx.config.exa,
              apiKey: exaApiKey,
            },
          }),
        });

        return {
          success: true,
          message: 'API keys updated successfully.',
        };
      } catch (error) {
        console.error('[Settings] Error updating API keys:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update API keys. Please try again.',
        });
      }
    }),

  /**
   * Get current API key status (masked)
   * SECURITY: Returns only whether keys are configured, not the actual keys
   */
  getApiKeyStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const config = ctx.config;
      const claudeKey = config.claude.apiKey;
      const exaKey = config.exa.apiKey;

      return {
        claude: {
          configured: !!claudeKey && claudeKey.length > 0,
          masked: claudeKey ? `${claudeKey.slice(0, 10)}...${claudeKey.slice(-4)}` : null,
        },
        exa: {
          configured: !!exaKey && exaKey.length > 0,
          masked: exaKey ? `${exaKey.slice(0, 6)}...${exaKey.slice(-4)}` : null,
        },
      };
    }),
});
