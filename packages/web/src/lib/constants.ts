/**
 * Application Constants
 * Centralized constants to avoid magic strings
 */

/**
 * Anonymous/unauthenticated user ID
 * Used as the default userId when no user is logged in
 */
export const ANONYMOUS_USER_ID = 'anonymous' as const;

/**
 * Legacy default user ID (deprecated, use ANONYMOUS_USER_ID)
 * @deprecated Use ANONYMOUS_USER_ID instead
 */
export const LEGACY_DEFAULT_USER_ID = 'default' as const;
