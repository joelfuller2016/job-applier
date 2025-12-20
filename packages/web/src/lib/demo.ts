/**
 * Demo Mode Utilities
 *
 * This module provides utilities for managing demo mode state throughout the application.
 * Demo mode allows the application to show mock/sample data for demonstration purposes,
 * while production mode shows only real data from API sources.
 *
 * Environment Variable: NEXT_PUBLIC_APP_MODE
 * - 'demo': Demo mode enabled - mock data is shown
 * - 'production' or any other value: Demo mode disabled - only real data
 * - undefined: Treated as production (safe default)
 *
 * IMPORTANT: The function is designed to be safe by default:
 * - If the environment variable is not set, returns false (production behavior)
 * - If the environment variable has any value other than 'demo', returns false
 * - Only returns true when explicitly set to 'demo'
 */

/**
 * Check if the application is running in demo mode.
 *
 * @returns {boolean} true if demo mode is enabled, false otherwise
 *
 * @remarks
 * - Returns `false` when NEXT_PUBLIC_APP_MODE is not set (safe production default)
 * - Returns `false` when NEXT_PUBLIC_APP_MODE has any value other than 'demo'
 * - Returns `true` ONLY when NEXT_PUBLIC_APP_MODE === 'demo'
 *
 * @example
 * ```typescript
 * import { isDemoMode } from '@/lib/demo';
 *
 * // Gate mock data behind demo mode check
 * const data = isDemoMode() ? mockData : [];
 *
 * // Conditional rendering
 * if (isDemoMode()) {
 *   return <DemoComponent data={mockData} />;
 * }
 * return <RealComponent />;
 * ```
 */
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_MODE === 'demo';
};
