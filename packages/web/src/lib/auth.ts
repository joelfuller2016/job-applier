/**
 * NextAuth.js Configuration
 * Provides Google OAuth authentication for production
 * Demo mode authentication is ONLY available when APP_MODE=demo
 */

import { AuthOptions, DefaultSession } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * Check if demo mode is enabled
 * SECURITY: Demo mode requires APP_MODE=demo environment variable
 * This is the ONLY way to enable demo authentication
 */
export const isDemoMode = (): boolean => {
  return process.env.APP_MODE === 'demo';
};

/**
 * Check if we're in production mode (default)
 */
export const isProductionMode = (): boolean => {
  return process.env.APP_MODE !== 'demo';
};

/**
 * Get NextAuth secret with production safety check
 * SECURITY: Secret MUST be provided in production via environment variable
 * Note: NEXT_PHASE check allows builds to complete; actual secret is validated at runtime
 */
const getAuthSecret = (): string => {
  const secret = process.env.NEXTAUTH_SECRET;
  const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';

  // In demo mode, allow a development secret
  if (isDemoMode()) {
    return secret || 'demo-mode-secret-not-for-production';
  }

  // Production mode requires a real secret
  if (!secret && process.env.NODE_ENV === 'production' && !isBuilding) {
    throw new Error(
      'NEXTAUTH_SECRET environment variable is required in production. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  // For builds, return placeholder; actual runtime will require real secret
  if (!secret && isBuilding) {
    return 'build-time-placeholder-not-used-at-runtime';
  }

  return secret || 'development-only-secret-change-in-production';
};

/**
 * Validate Google OAuth configuration
 * SECURITY: In production mode, Google OAuth must be properly configured
 */
const validateGoogleOAuth = (): void => {
  const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';

  if (isProductionMode() && !isBuilding) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn(
        'WARNING: Google OAuth credentials not configured. ' +
        'Users will not be able to sign in. ' +
        'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
      );
    }
  }
};

// Extend the session type to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}

/**
 * Build providers array based on APP_MODE
 * - Production: Google OAuth only
 * - Demo: Google OAuth + Demo credentials
 */
const buildProviders = (): Provider[] => {
  validateGoogleOAuth();

  const providers: Provider[] = [
    // Google OAuth Provider - always available
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ];

  // Demo credentials provider - ONLY in demo mode
  if (isDemoMode()) {
    console.log('📋 Demo mode enabled - demo authentication available');
    providers.push(
      CredentialsProvider({
        id: 'demo-credentials',
        name: 'Demo Account',
        credentials: {
          email: { label: 'Email', type: 'email', placeholder: 'demo@example.com' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          // Demo account credentials
          if (
            credentials?.email === 'demo@example.com' &&
            credentials?.password === 'demo123'
          ) {
            return {
              id: 'demo-user-id',
              name: 'Demo User',
              email: 'demo@example.com',
              image: null,
            };
          }
          return null;
        },
      })
    );
  }

  return providers;
};

export const authOptions: AuthOptions = {
  providers: buildProviders(),
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist user id to the token after sign in
      if (user) {
        token.id = user.id;
      }
      // For OAuth providers, use the account's providerAccountId as a stable id
      if (account?.providerAccountId) {
        token.id = `${account.provider}-${account.providerAccountId}`;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: getAuthSecret(),
};
