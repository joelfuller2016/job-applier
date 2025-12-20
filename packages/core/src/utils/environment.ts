/**
 * Environment Utilities
 *
 * Provides runtime environment detection and validation for production vs demo modes.
 * This module ensures strict separation between production and demo environments.
 */

/**
 * Application mode - determines behavior and available features
 */
export type AppMode = 'production' | 'demo';

/**
 * Environment configuration for the application
 */
export interface EnvironmentConfig {
  mode: AppMode;
  isDevelopment: boolean;
  isProduction: boolean;
  isDemo: boolean;
  allowDemoFeatures: boolean;
}

/**
 * Get the current application mode from environment variables
 *
 * @returns The current app mode ('production' or 'demo')
 */
export function getAppMode(): AppMode {
  const mode = process.env.APP_MODE?.toLowerCase();

  if (mode === 'demo') {
    return 'demo';
  }

  // Default to production for safety
  return 'production';
}

/**
 * Check if the app is running in production mode
 */
export function isProductionMode(): boolean {
  return getAppMode() === 'production';
}

/**
 * Check if the app is running in demo mode
 */
export function isDemoMode(): boolean {
  return getAppMode() === 'demo';
}

/**
 * Check if demo features should be available
 * Demo features are only available in demo mode OR in development with explicit opt-in
 */
export function allowDemoFeatures(): boolean {
  if (isDemoMode()) {
    return true;
  }

  // In development, allow demo features if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEMO_FEATURES === 'true') {
    return true;
  }

  return false;
}

/**
 * Get the full environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const mode = getAppMode();

  return {
    mode,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: mode === 'production',
    isDemo: mode === 'demo',
    allowDemoFeatures: allowDemoFeatures(),
  };
}

/**
 * Assert that the application is running in production mode
 * Throws an error if demo code is being accessed in production
 *
 * @param featureName Name of the demo feature being accessed (for error message)
 */
export function assertNotProduction(featureName: string): void {
  if (isProductionMode() && !allowDemoFeatures()) {
    throw new Error(
      `SECURITY: Demo feature "${featureName}" cannot be accessed in production mode. ` +
      `Set APP_MODE=demo to enable demo features.`
    );
  }
}

/**
 * Validate that required environment variables are set for the current mode
 *
 * @throws Error if required variables are missing
 */
export function validateEnvironment(): void {
  const errors: string[] = [];

  if (isProductionMode()) {
    // Production requires these environment variables
    const requiredProdVars = [
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ];

    for (const varName of requiredProdVars) {
      if (!process.env[varName]) {
        errors.push(`${varName} is required in production mode`);
      }
    }

    // Warn if demo-related env vars are set in production
    if (process.env.ENABLE_DEMO_FEATURES === 'true') {
      console.warn(
        'WARNING: ENABLE_DEMO_FEATURES is set in production. This should not be used in production.'
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `For production, ensure all required variables are set.\n` +
      `For demo mode, set APP_MODE=demo`
    );
  }
}

/**
 * Log environment information (safe for logging, no secrets)
 */
export function logEnvironmentInfo(): void {
  const config = getEnvironmentConfig();

  console.log('Environment Configuration:');
  console.log(`  Mode: ${config.mode}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  Demo Features: ${config.allowDemoFeatures ? 'enabled' : 'disabled'}`);

  if (config.isDemo) {
    console.log('  ⚠️  Running in DEMO mode - not for production use');
  }
}
