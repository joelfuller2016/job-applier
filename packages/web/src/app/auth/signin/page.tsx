'use client';

/**
 * Sign In Page
 * Provides Google OAuth authentication for production
 * Demo account option is ONLY shown when APP_MODE=demo (via NEXT_PUBLIC_APP_MODE)
 */

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Chrome, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Check if demo mode is enabled
 * Uses NEXT_PUBLIC_APP_MODE which must be set at build time
 */
const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_MODE === 'demo';
};

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const showDemoOption = isDemoMode();

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    await signIn('google', { callbackUrl });
  };

  const handleDemoSignIn = async () => {
    if (!showDemoOption) return; // Safety check
    setIsLoading('demo');
    await signIn('demo-credentials', {
      email: 'demo@example.com',
      password: 'demo123',
      callbackUrl,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to JobApplier</h1>
          <p className="text-muted-foreground">
            Sign in to manage your job applications
          </p>
        </div>

        {/* Demo Mode Banner */}
        {showDemoOption && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Demo Mode - Not for production use</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive">
            {error === 'OAuthAccountNotLinked'
              ? 'This email is already associated with another account.'
              : error === 'CredentialsSignin'
              ? 'Invalid email or password.'
              : 'An error occurred during sign in.'}
          </div>
        )}

        {/* Sign In Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              {showDemoOption
                ? 'Choose your preferred sign in method'
                : 'Sign in with your Google account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth Button */}
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleGoogleSignIn}
              disabled={isLoading !== null}
            >
              {isLoading === 'google' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-5 w-5" />
              )}
              Continue with Google
            </Button>

            {/* Demo Account Button - ONLY shown in demo mode */}
            {showDemoOption && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or for demo
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full h-11"
                  onClick={handleDemoSignIn}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'demo' ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Briefcase className="mr-2 h-5 w-5" />
                  )}
                  Try Demo Account
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Demo credentials: demo@example.com / demo123
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to JobApplier</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInContent />
    </Suspense>
  );
}
