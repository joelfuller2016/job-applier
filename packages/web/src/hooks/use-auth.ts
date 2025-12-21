'use client';

/**
 * Custom hook for authentication state and actions
 * Demo login is ONLY available when APP_MODE=demo
 */

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback, useMemo } from 'react';

/**
 * Check if demo mode is enabled (client-side)
 */
const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_MODE === 'demo';
};

export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;
  const demoModeEnabled = useMemo(() => isDemoMode(), []);

  const loginWithGoogle = useCallback(() => {
    signIn('google', { callbackUrl: '/' });
  }, []);

  /**
   * Demo login - only works when APP_MODE=demo
   * Will throw error if called in production mode
   */
  const loginWithDemo = useCallback(() => {
    if (!demoModeEnabled) {
      console.error('Demo login attempted in production mode - this should not happen');
      throw new Error('Demo login is not available in production mode');
    }
    signIn('demo-credentials', {
      email: 'demo@example.com',
      password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || '',
      callbackUrl: '/',
    });
  }, [demoModeEnabled]);

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/auth/signin' });
  }, []);

  return {
    user,
    session,
    status,
    isLoading,
    isAuthenticated,
    loginWithGoogle,
    // Only expose loginWithDemo if in demo mode
    ...(demoModeEnabled && { loginWithDemo }),
    logout,
    // Expose demo mode status for UI decisions
    isDemoMode: demoModeEnabled,
  };
}
