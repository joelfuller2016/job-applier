/**
 * Demo Mode Utilities
 *
 * This module provides utilities for detecting and handling demo mode in the application.
 * Demo mode is used to show mock/sample data for demonstration purposes.
 *
 * IMPORTANT: Production builds should NEVER show demo data. The isDemoMode() function
 * is designed with safe defaults - it only returns true when explicitly set to 'demo'.
 */

/**
 * Check if demo mode is enabled (client-side)
 *
 * Demo data is ONLY shown when NEXT_PUBLIC_APP_MODE=demo
 *
 * @returns {boolean} true if demo mode is enabled, false otherwise
 *
 * @remarks
 * - Returns `false` when NEXT_PUBLIC_APP_MODE is not set (safe production default)
 * - Returns `false` when NEXT_PUBLIC_APP_MODE has any value other than 'demo'
 * - Returns `true` ONLY when NEXT_PUBLIC_APP_MODE === 'demo'
 *
 * This ensures that production deployments never accidentally show demo/mock data,
 * even if the environment variable is misconfigured or missing.
 *
 * @example
 * ```typescript
 * import { isDemoMode } from '@/lib/demo';
 *
 * // In a component:
 * const data = isDemoMode() ? mockData : [];
 *
 * // Or with early return:
 * if (!isDemoMode()) {
 *   return []; // Return empty in production
 * }
 * // ... use mock data for demo
 * ```
 */
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_MODE === 'demo';
};
