/**
 * NextAuth.js Configuration
 * Provides Google OAuth authentication
 */

import { AuthOptions, DefaultSession, Provider } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * Check if demo auth is enabled
 * SECURITY: Demo auth must be explicitly enabled and only works in development
 */
const isDemoAuthEnabled = (): boolean => {
  return process.env.NODE_ENV === 'development' &&
         process.env.ENABLE_DEMO_AUTH === 'true';
};

/**
 * Get NextAuth secret with production safety check
 * SECURITY: Secret MUST be provided in production via environment variable
 */
const getAuthSecret = (): string => {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXTAUTH_SECRET environment variable is required in production. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  return secret || 'development-only-secret-not-for-production';
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
 * Build providers array based on configuration
 */
const buildProviders = (): Provider[] => {
  const providers: Provider[] = [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ];

  // Only add demo credentials provider if explicitly enabled in development
  if (isDemoAuthEnabled()) {
    providers.push(
      CredentialsProvider({
        name: 'Demo Account',
        credentials: {
          email: { label: 'Email', type: 'email', placeholder: 'demo@example.com' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          // Demo account for development/testing only
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
