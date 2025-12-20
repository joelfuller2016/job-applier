/**
 * NextAuth.js Configuration
 * Provides Google OAuth authentication
 */

import { AuthOptions, DefaultSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

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
 * Environment detection
 * isDevelopment: Only true for local development (NODE_ENV=development)
 * isProduction: True for production deployments (NODE_ENV=production)
 * Note: Staging/testing environments should set NODE_ENV appropriately
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if demo auth is enabled and properly configured
 * Demo auth is ONLY available in development mode, never in production or staging
 */
const isDemoAuthEnabled = isDevelopment && process.env.ENABLE_DEMO_AUTH === 'true';

/**
 * Validate required environment variables
 * Called at module load to fail fast on misconfiguration
 * @throws Error if configuration is invalid
 */
function validateAuthConfig(): void {
  // NEXTAUTH_SECRET is required in all non-development environments
  // This includes production, staging, testing, and any other deployment
  if (!isDevelopment && !process.env.NEXTAUTH_SECRET) {
    throw new Error(
      '[Auth Configuration Error] NEXTAUTH_SECRET environment variable is required. ' +
      'This error occurs during module initialization. ' +
      'Generate a secure secret with: openssl rand -base64 32'
    );
  }

  // Demo auth requires DEMO_PASSWORD when enabled
  if (isDemoAuthEnabled && !process.env.DEMO_PASSWORD) {
    throw new Error(
      '[Auth Configuration Error] DEMO_PASSWORD environment variable is required when ENABLE_DEMO_AUTH=true. ' +
      'Set a secure password in your .env file.'
    );
  }

  // Warn about demo auth in development (once at startup, not per-auth)
  if (isDemoAuthEnabled) {
    console.warn('[AUTH] Demo authentication is ENABLED - this feature is only available in development mode');
  }
}

// Validate on module load
validateAuthConfig();

export const authOptions: AuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // Demo credentials only available in development when explicitly enabled
    ...(isDemoAuthEnabled
      ? [
          CredentialsProvider({
            name: 'Demo Account',
            credentials: {
              email: { label: 'Email', type: 'email', placeholder: 'demo@example.com' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              // Validate demo credentials - password from environment
              if (
                credentials?.email === 'demo@example.com' &&
                credentials?.password === process.env.DEMO_PASSWORD
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
          }),
        ]
      : []),
  ],
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
  // SECURITY: Secret is validated in validateAuthConfig() - fallback only for local development
  secret: process.env.NEXTAUTH_SECRET || (isDevelopment ? 'dev-only-secret-not-for-production' : undefined),
};
