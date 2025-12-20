/**
 * Auth Router
 * Handles user authentication and account operations
 * 
 * SECURITY FIX: updateUser and deleteAccount now use protectedProcedure
 * instead of publicProcedure with manual checks.
 * See: https://github.com/joelfuller2016/job-applier/issues/16
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { ANONYMOUS_USER_ID } from '@/lib/constants';

/**
 * Auth router for user operations
 */
export const authRouter = router({
  /**
   * Get current authenticated user info
   * NOTE: Must be publicProcedure to check auth status
   */
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      return {
        session: ctx.session,
        userId: ctx.userId,
        isAuthenticated: ctx.userId !== ANONYMOUS_USER_ID && !!ctx.session,
      };
    }),

  /**
   * Get or create user from session
   * This is called after OAuth sign-in to ensure user exists in our database
   * NOTE: Must be publicProcedure because userId may still be ANONYMOUS_USER_ID
   * immediately after OAuth before user record is created
   */
  syncUser: publicProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.session?.user?.email) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const { email, name, image } = ctx.session.user;
      const userId = ctx.userId;

      // Check if user exists
      let user = ctx.userRepository.findByEmail(email);

      if (!user) {
        // Create new user
        user = ctx.userRepository.create({
          email,
          name: name || null,
          image: image || null,
          provider: 'google', // Or detect from session
          providerAccountId: userId,
          emailVerified: true,
        });
      } else {
        // Update last login
        ctx.userRepository.updateLastLogin(user.id);
      }

      return user;
    }),

  /**
   * Update user profile
   * SECURITY: Now uses protectedProcedure - middleware handles authentication
   */
  updateUser: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      image: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ctx.userId is guaranteed to be valid by protectedProcedure middleware
      const user = ctx.userRepository.findById(ctx.userId);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return ctx.userRepository.update(ctx.userId, input);
    }),

  /**
   * Delete user account
   * SECURITY: Now uses protectedProcedure - middleware handles authentication
   */
  deleteAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      // ctx.userId is guaranteed to be valid by protectedProcedure middleware
      const user = ctx.userRepository.findById(ctx.userId);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Delete all user's profiles first (cascade should handle this, but be explicit)
      const profiles = ctx.profileRepository.findByUserId(ctx.userId);
      for (const profile of profiles) {
        ctx.profileRepository.delete(profile.id);
      }

      // Delete user
      ctx.userRepository.delete(ctx.userId);

      return { success: true };
    }),
});
