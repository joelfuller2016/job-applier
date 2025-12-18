'use client';

/**
 * Custom hook for authentication state and actions
 */

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  const loginWithGoogle = useCallback(() => {
    signIn('google', { callbackUrl: '/' });
  }, []);

  const loginWithDemo = useCallback(() => {
    signIn('credentials', {
      email: 'demo@example.com',
      password: 'demo123',
      callbackUrl: '/',
    });
  }, []);

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
    loginWithDemo,
    logout,
  };
}
