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
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Validate required environment variables
 */
function validateAuthConfig(): void {
  if (!isDevelopment && !process.env.NEXTAUTH_SECRET) {
    throw new Error(
      'NEXTAUTH_SECRET environment variable is required in production. ' +
      'Generate one with: openssl rand -base64 32'
    );
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
    // Demo credentials only available in development mode
    ...(isDevelopment && process.env.ENABLE_DEMO_AUTH === 'true'
      ? [
          CredentialsProvider({
            name: 'Demo Account',
            credentials: {
              email: { label: 'Email', type: 'email', placeholder: 'demo@example.com' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              // Demo account ONLY for development/testing when explicitly enabled
              console.warn('[AUTH] Demo authentication used - DO NOT use in production');
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
  // SECURITY: Secret is validated in validateAuthConfig() - fallback only for development
  secret: process.env.NEXTAUTH_SECRET || (isDevelopment ? 'dev-only-secret-not-for-production' : undefined),
};
