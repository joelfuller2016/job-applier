/**
 * Next.js Instrumentation
 *
 * This file runs once when the Next.js server starts.
 * Used for environment validation and startup checks.
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await validateProductionEnvironment();
  }
}

/**
 * Validate environment configuration at startup
 * Ensures production deployments have all required variables
 */
async function validateProductionEnvironment(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const isProductionMode = process.env.APP_MODE !== 'demo';
  const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';

  // Skip validation during build phase
  if (isBuilding) {
    console.log('Skipping environment validation during build...');
    return;
  }

  // Log environment mode
  if (process.env.APP_MODE === 'demo') {
    console.log('');
    console.log('========================================');
    console.log('  DEMO MODE ENABLED');
    console.log('  Demo authentication is available');
    console.log('  NOT FOR PRODUCTION USE');
    console.log('========================================');
    console.log('');
  } else {
    console.log('');
    console.log('========================================');
    console.log('  PRODUCTION MODE');
    console.log('  Demo features are disabled');
    console.log('========================================');
    console.log('');
  }

  // Production mode requires these variables
  if (isProduction && isProductionMode) {
    const errors: string[] = [];

    // Required authentication variables
    if (!process.env.NEXTAUTH_SECRET) {
      errors.push('NEXTAUTH_SECRET is required in production');
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      errors.push('GOOGLE_CLIENT_ID is required in production');
    }

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      errors.push('GOOGLE_CLIENT_SECRET is required in production');
    }

    // Warn about missing optional but recommended variables
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('WARNING: ANTHROPIC_API_KEY not set - AI features will not work');
    }

    if (!process.env.EXA_API_KEY) {
      console.warn('WARNING: EXA_API_KEY not set - Job search will not work');
    }

    // Check for demo mode variables in production (potential misconfiguration)
    if (process.env.ENABLE_DEMO_FEATURES === 'true') {
      console.warn('WARNING: ENABLE_DEMO_FEATURES is set but APP_MODE is not demo');
    }

    // Fail startup if critical variables are missing
    if (errors.length > 0) {
      console.error('');
      console.error('========================================');
      console.error('  ENVIRONMENT VALIDATION FAILED');
      console.error('========================================');
      errors.forEach(error => console.error(`  - ${error}`));
      console.error('');
      console.error('  For production, ensure all required variables are set.');
      console.error('  For demo mode, set APP_MODE=demo');
      console.error('========================================');
      console.error('');

      throw new Error(
        `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
      );
    }

    console.log('Environment validation passed');
  }
}
